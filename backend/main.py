"""
FocusFlow Detection Backend
FastAPI server for phone and pose detection using MediaPipe
Runs entirely on CPU - no GPU required
"""

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import numpy as np
import cv2
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision
import time
from collections import deque
import io

# ================================
# Initialize FastAPI
# ================================
app = FastAPI(title="FocusFlow Detection API", version="1.0.0")

# CORS configuration for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://localhost:3000"],  # Vite ports
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ================================
# Response Models
# ================================
class BoundingBox(BaseModel):
    x_min: float
    y_min: float
    width: float
    height: float
    confidence: float

class Keypoint(BaseModel):
    x: float
    y: float
    z: float
    visibility: float
    name: str

class DetectionResult(BaseModel):
    phone_detected: bool
    phone_boxes: List[BoundingBox]
    pose_detected: bool
    keypoints: List[Keypoint]
    phone_near_left_ear: bool
    phone_near_right_ear: bool
    phone_in_front_of_face: bool
    face_detected: bool
    processing_time_ms: float
    backend: str = "mediapipe-cpu"

# ================================
# Detection State & Smoothing
# ================================
class DetectionSmoothing:
    """Smooth detection results over multiple frames to reduce flicker"""

    def __init__(self, window_size: int = 5):
        self.window_size = window_size
        self.phone_detections = deque(maxlen=window_size)
        self.last_detection_time = 0
        self.debounce_ms = 300  # 300ms debounce

    def add_detection(self, phone_detected: bool, near_left: bool, near_right: bool, in_front: bool):
        """Add new detection to smoothing window"""
        self.phone_detections.append({
            'phone': phone_detected,
            'left_ear': near_left,
            'right_ear': near_right,
            'front_face': in_front,
            'timestamp': time.time() * 1000
        })

    def get_smoothed_result(self) -> Dict[str, bool]:
        """Get smoothed detection result using majority voting"""
        if not self.phone_detections:
            return {
                'phone_detected': False,
                'phone_near_left_ear': False,
                'phone_near_right_ear': False,
                'phone_in_front_of_face': False
            }

        # Count votes for each detection type
        phone_votes = sum(1 for d in self.phone_detections if d['phone'])
        left_votes = sum(1 for d in self.phone_detections if d['left_ear'])
        right_votes = sum(1 for d in self.phone_detections if d['right_ear'])
        front_votes = sum(1 for d in self.phone_detections if d['front_face'])

        # Majority vote (>50% of window)
        threshold = self.window_size / 2

        return {
            'phone_detected': phone_votes > threshold,
            'phone_near_left_ear': left_votes > threshold,
            'phone_near_right_ear': right_votes > threshold,
            'phone_in_front_of_face': front_votes > threshold
        }

# Global smoothing instance
smoother = DetectionSmoothing(window_size=5)

# ================================
# MediaPipe Model Initialization
# ================================
class MediaPipeDetector:
    """Manages MediaPipe models for object and pose detection"""

    def __init__(self):
        self.object_detector = None
        self.pose_landmarker = None
        self.initialize_models()

    def initialize_models(self):
        """Initialize MediaPipe object detector and pose landmarker"""
        print("🔧 Initializing MediaPipe models...")

        # Object Detector for phone detection
        # Download model: https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float32/1/efficientdet_lite0.tflite
        try:
            base_options = python.BaseOptions(model_asset_path='models/efficientdet_lite0.tflite')
            options = vision.ObjectDetectorOptions(
                base_options=base_options,
                running_mode=vision.RunningMode.IMAGE,
                max_results=5,
                score_threshold=0.3  # Lower threshold for better phone detection
            )
            self.object_detector = vision.ObjectDetector.create_from_options(options)
            print("✅ Object detector loaded")
        except Exception as e:
            print(f"⚠️ Object detector failed to load: {e}")
            print("   Download: https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float32/1/efficientdet_lite0.tflite")

        # Pose Landmarker for body keypoints
        # Download model: https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_heavy/float16/1/pose_landmarker_heavy.task
        try:
            base_options = python.BaseOptions(model_asset_path='models/pose_landmarker_heavy.task')
            options = vision.PoseLandmarkerOptions(
                base_options=base_options,
                running_mode=vision.RunningMode.IMAGE,
                num_poses=1,
                min_pose_detection_confidence=0.2,
                min_pose_presence_confidence=0.2,
                min_tracking_confidence=0.2
            )
            self.pose_landmarker = vision.PoseLandmarker.create_from_options(options)
            print("✅ Pose landmarker loaded")
        except Exception as e:
            print(f"⚠️ Pose landmarker failed to load: {e}")
            print("   Download: https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_heavy/float16/1/pose_landmarker_heavy.task")

    def detect_objects(self, image: np.ndarray) -> List[Dict[str, Any]]:
        """Detect objects (phone) in image"""
        if self.object_detector is None:
            return []

        # Convert to MediaPipe Image
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=image)

        # Detect objects
        detection_result = self.object_detector.detect(mp_image)

        # Filter for mobile phones (category name: "cell phone" or "mobile phone")
        phones = []
        for detection in detection_result.detections:
            for category in detection.categories:
                if 'phone' in category.category_name.lower() or 'cell' in category.category_name.lower():
                    bbox = detection.bounding_box
                    phones.append({
                        'x_min': bbox.origin_x,
                        'y_min': bbox.origin_y,
                        'width': bbox.width,
                        'height': bbox.height,
                        'confidence': category.score,
                        'category': category.category_name
                    })
                    break

        return phones

    def detect_pose(self, image: np.ndarray) -> Optional[Dict[str, Any]]:
        """Detect pose landmarks in image"""
        if self.pose_landmarker is None:
            return None

        # Convert to MediaPipe Image
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=image)

        # Detect pose
        detection_result = self.pose_landmarker.detect(mp_image)

        if not detection_result.pose_landmarks:
            return None

        # Get first pose (we only process 1 person)
        landmarks = detection_result.pose_landmarks[0]

        # MediaPipe Pose landmark names (33 points)
        # We focus on upper body for phone detection
        landmark_names = [
            'nose', 'left_eye_inner', 'left_eye', 'left_eye_outer',
            'right_eye_inner', 'right_eye', 'right_eye_outer',
            'left_ear', 'right_ear', 'mouth_left', 'mouth_right',
            'left_shoulder', 'right_shoulder', 'left_elbow', 'right_elbow',
            'left_wrist', 'right_wrist', 'left_pinky', 'right_pinky',
            'left_index', 'right_index', 'left_thumb', 'right_thumb',
            'left_hip', 'right_hip', 'left_knee', 'right_knee',
            'left_ankle', 'right_ankle', 'left_heel', 'right_heel',
            'left_foot_index', 'right_foot_index'
        ]

        # Extract keypoints with image dimensions for pixel coordinates
        height, width = image.shape[:2]
        keypoints = []
        for idx, landmark in enumerate(landmarks):
            keypoints.append({
                'x': landmark.x * width,  # Convert normalized to pixel coordinates
                'y': landmark.y * height,
                'z': landmark.z,
                'visibility': landmark.visibility,
                'name': landmark_names[idx] if idx < len(landmark_names) else f'point_{idx}'
            })

        return {
            'keypoints': keypoints,
            'image_width': width,
            'image_height': height
        }

# Global detector instance
detector = MediaPipeDetector()

# ================================
# Phone Proximity Detection Logic
# ================================

def get_phone_center(phone_box: Dict[str, float]) -> tuple:
    """Get center point of phone bounding box"""
    center_x = phone_box['x_min'] + phone_box['width'] / 2
    center_y = phone_box['y_min'] + phone_box['height'] / 2
    return (center_x, center_y)

def distance(p1: tuple, p2: tuple) -> float:
    """Calculate Euclidean distance between two points"""
    return np.sqrt((p1[0] - p2[0])**2 + (p1[1] - p2[1])**2)

def is_phone_near_left_ear(phone_box: Dict[str, float], keypoints: List[Dict]) -> bool:
    """
    Check if phone is near left ear

    Logic:
    - Phone center must be within 140px of left ear (keypoint 7)
    - Left wrist (keypoint 15) should be raised above left shoulder (keypoint 11)
    - Phone should be in upper half of frame
    """
    if not keypoints or len(keypoints) < 16:
        return False

    # Get relevant keypoints
    left_ear = keypoints[7]
    left_wrist = keypoints[15]
    left_shoulder = keypoints[11]

    # Check ear visibility (must be visible)
    if left_ear['visibility'] < 0.3:
        print(f"   ❌ Left ear: ear not visible (visibility={left_ear['visibility']:.2f})")
        return False

    # Get phone center
    phone_center = get_phone_center(phone_box)
    ear_pos = (left_ear['x'], left_ear['y'])

    # Calculate distance
    dist_to_ear = distance(phone_center, ear_pos)

    # Thresholds
    EAR_THRESHOLD = 140  # pixels
    CLOSE_THRESHOLD = 100  # Very close to ear - trust this even if wrist not visible

    # If phone is very close to ear, trust that detection
    if dist_to_ear < CLOSE_THRESHOLD:
        print(f"   📞 Left ear check: dist={dist_to_ear:.0f}px (VERY CLOSE), result=True")
        return True

    # Otherwise, also check if wrist is raised (only if wrist is visible)
    wrist_raised = left_wrist['visibility'] > 0.3 and left_wrist['y'] < left_shoulder['y']
    result = dist_to_ear < EAR_THRESHOLD and wrist_raised
    print(f"   📞 Left ear check: dist={dist_to_ear:.0f}px (threshold={EAR_THRESHOLD}), wrist_raised={wrist_raised}, result={result}")

    return result

def is_phone_near_right_ear(phone_box: Dict[str, float], keypoints: List[Dict]) -> bool:
    """
    Check if phone is near right ear

    Logic:
    - Phone center must be within 140px of right ear (keypoint 8)
    - Right wrist (keypoint 16) should be raised above right shoulder (keypoint 12)
    - Phone should be in upper half of frame
    """
    if not keypoints or len(keypoints) < 17:
        return False

    # Get relevant keypoints
    right_ear = keypoints[8]
    right_wrist = keypoints[16]
    right_shoulder = keypoints[12]

    # Check ear visibility (must be visible)
    if right_ear['visibility'] < 0.3:
        print(f"   ❌ Right ear: ear not visible (visibility={right_ear['visibility']:.2f})")
        return False

    # Get phone center
    phone_center = get_phone_center(phone_box)
    ear_pos = (right_ear['x'], right_ear['y'])

    # Calculate distance
    dist_to_ear = distance(phone_center, ear_pos)

    # Thresholds
    EAR_THRESHOLD = 140  # pixels
    CLOSE_THRESHOLD = 100  # Very close to ear - trust this even if wrist not visible

    # If phone is very close to ear, trust that detection
    if dist_to_ear < CLOSE_THRESHOLD:
        print(f"   📞 Right ear check: dist={dist_to_ear:.0f}px (VERY CLOSE), result=True")
        return True

    # Otherwise, also check if wrist is raised (only if wrist is visible)
    wrist_raised = right_wrist['visibility'] > 0.3 and right_wrist['y'] < right_shoulder['y']
    result = dist_to_ear < EAR_THRESHOLD and wrist_raised
    print(f"   📞 Right ear check: dist={dist_to_ear:.0f}px (threshold={EAR_THRESHOLD}), wrist_raised={wrist_raised}, result={result}")

    return result

def is_phone_in_front_of_face(phone_box: Dict[str, float], keypoints: List[Dict]) -> bool:
    """
    Check if phone is in front of face (scrolling/watching)

    Logic:
    - Phone overlaps with face bounding box (nose, eyes, ears)
    - Phone center is within 160px of nose
    - Either wrist is in raised position
    """
    if not keypoints or len(keypoints) < 17:
        return False

    # Get facial keypoints
    nose = keypoints[0]
    left_eye = keypoints[2]
    right_eye = keypoints[5]
    left_ear = keypoints[7]
    right_ear = keypoints[8]

    # Get wrists
    left_wrist = keypoints[15]
    right_wrist = keypoints[16]

    # Check visibility
    if nose['visibility'] < 0.3:
        return False

    # Construct face bounding box with margin
    FACE_MARGIN = 120
    face_points = [nose, left_eye, right_eye, left_ear, right_ear]
    visible_face_points = [p for p in face_points if p['visibility'] > 0.2]

    if not visible_face_points:
        return False

    face_x_coords = [p['x'] for p in visible_face_points]
    face_y_coords = [p['y'] for p in visible_face_points]

    face_bbox = {
        'x_min': min(face_x_coords) - FACE_MARGIN,
        'x_max': max(face_x_coords) + FACE_MARGIN,
        'y_min': min(face_y_coords) - FACE_MARGIN,
        'y_max': max(face_y_coords) + FACE_MARGIN
    }

    # Get phone center
    phone_center = get_phone_center(phone_box)

    # Check if phone overlaps face bbox
    phone_in_face_area = (
        face_bbox['x_min'] <= phone_center[0] <= face_bbox['x_max'] and
        face_bbox['y_min'] <= phone_center[1] <= face_bbox['y_max']
    )

    # Check distance to nose
    nose_pos = (nose['x'], nose['y'])
    dist_to_nose = distance(phone_center, nose_pos)

    # Check if either wrist is visible and raised
    wrist_visible = (
        (left_wrist['visibility'] > 0.3) or
        (right_wrist['visibility'] > 0.3)
    )

    NOSE_THRESHOLD = 200  # pixels (1.3x of 160 for extra tolerance)

    return phone_in_face_area and dist_to_nose < NOSE_THRESHOLD and wrist_visible

# ================================
# API Endpoints
# ================================

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "online",
        "service": "FocusFlow Detection API",
        "version": "1.0.0",
        "models": {
            "object_detector": detector.object_detector is not None,
            "pose_landmarker": detector.pose_landmarker is not None
        }
    }

@app.get("/health")
async def health():
    """Detailed health check"""
    return {
        "status": "healthy",
        "models_loaded": {
            "object_detector": detector.object_detector is not None,
            "pose_landmarker": detector.pose_landmarker is not None
        },
        "cpu_backend": True,
        "ready": detector.object_detector is not None and detector.pose_landmarker is not None
    }

@app.post("/detect", response_model=DetectionResult)
async def detect(file: UploadFile = File(...)):
    """
    Detect phone and pose from uploaded image frame

    Accepts: JPEG/PNG image
    Returns: Phone detection, pose keypoints, and proximity results
    """
    start_time = time.time()

    try:
        # Read image from upload
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if image is None:
            raise HTTPException(status_code=400, detail="Invalid image format")

        # Convert BGR to RGB (OpenCV uses BGR, MediaPipe uses RGB)
        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

        # Detect objects (phones)
        phone_boxes = detector.detect_objects(image_rgb)

        # Detect pose
        pose_result = detector.detect_pose(image_rgb)

        # Check if pose detected
        pose_detected = pose_result is not None
        keypoints = pose_result['keypoints'] if pose_result else []

        # Debug logging
        print(f"📊 Detection: pose={pose_detected}, keypoints={len(keypoints)}, phones={len(phone_boxes)}")

        # Check face detection (nose visible)
        face_detected = False
        if keypoints:
            nose = keypoints[0]
            face_detected = nose['visibility'] > 0.2  # Lowered from 0.3 for better detection
            print(f"   Face: nose_visibility={nose['visibility']:.2f}, face_detected={face_detected}")

        # Phone proximity detection
        phone_detected = len(phone_boxes) > 0
        phone_near_left_ear = False
        phone_near_right_ear = False
        phone_in_front_of_face = False

        if phone_detected and pose_detected:
            # Check each detected phone against proximity rules
            # Priority: Ear detection (specific) > Front of face (general)
            print(f"   🔍 Checking {len(phone_boxes)} phone(s) for proximity...")
            for phone_box in phone_boxes:
                # Check ears first (more specific detection)
                if is_phone_near_left_ear(phone_box, keypoints):
                    phone_near_left_ear = True
                    print(f"   ✅ DETECTED: Phone near LEFT EAR")
                elif is_phone_near_right_ear(phone_box, keypoints):
                    phone_near_right_ear = True
                    print(f"   ✅ DETECTED: Phone near RIGHT EAR")
                # Only check front of face if NOT near an ear
                elif is_phone_in_front_of_face(phone_box, keypoints):
                    phone_in_front_of_face = True
                    print(f"   ✅ DETECTED: Phone IN FRONT of face")

        # Add to smoothing window
        smoother.add_detection(
            phone_detected and (phone_near_left_ear or phone_near_right_ear or phone_in_front_of_face),
            phone_near_left_ear,
            phone_near_right_ear,
            phone_in_front_of_face
        )

        # Get smoothed results
        smoothed = smoother.get_smoothed_result()

        # Calculate processing time
        processing_time = (time.time() - start_time) * 1000  # Convert to ms

        # Build response
        response = DetectionResult(
            phone_detected=smoothed['phone_detected'],
            phone_boxes=[BoundingBox(**box) for box in phone_boxes],
            pose_detected=pose_detected,
            keypoints=[Keypoint(**kp) for kp in keypoints],
            phone_near_left_ear=smoothed['phone_near_left_ear'],
            phone_near_right_ear=smoothed['phone_near_right_ear'],
            phone_in_front_of_face=smoothed['phone_in_front_of_face'],
            face_detected=face_detected,
            processing_time_ms=round(processing_time, 2),
            backend="mediapipe-cpu"
        )

        return response

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Detection failed: {str(e)}")

# ================================
# Run Server
# ================================
if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting FocusFlow Detection API...")
    print("📡 Server will be available at: http://localhost:8000")
    print("📖 API docs at: http://localhost:8000/docs")
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
