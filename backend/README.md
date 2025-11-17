# FocusFlow Detection Backend

Python FastAPI backend for phone and pose detection using MediaPipe.

**Runs entirely on CPU - no GPU required.**

## Setup

### 1. Create virtual environment

```bash
cd backend
python -m venv venv

# Activate (Linux/Mac)
source venv/bin/activate

# Activate (Windows)
venv\Scripts\activate
```

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

### 3. Download MediaPipe models

Create `backend/models/` directory and download:

**Object Detector (for phone detection):**
```bash
mkdir -p models
cd models

# EfficientDet Lite0 (13 MB)
wget https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float32/1/efficientdet_lite0.tflite
```

**Pose Landmarker (for body keypoints):**
```bash
# Pose Landmarker Heavy (26 MB)
wget https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_heavy/float16/1/pose_landmarker_heavy.task
```

### 4. Run server

```bash
python main.py
```

Server starts at: `http://localhost:8000`

API docs: `http://localhost:8000/docs`

## API Endpoints

### `POST /detect`

**Input:** Image file (JPEG/PNG) from webcam frame

**Output:**
```json
{
  "phone_detected": true,
  "phone_boxes": [
    {
      "x_min": 120.5,
      "y_min": 80.2,
      "width": 150.0,
      "height": 200.0,
      "confidence": 0.85
    }
  ],
  "pose_detected": true,
  "keypoints": [
    {
      "x": 320.5,
      "y": 240.8,
      "z": -0.05,
      "visibility": 0.95,
      "name": "nose"
    }
    // ... 32 more keypoints
  ],
  "phone_near_left_ear": false,
  "phone_near_right_ear": true,
  "phone_in_front_of_face": false,
  "face_detected": true,
  "processing_time_ms": 45.2,
  "backend": "mediapipe-cpu"
}
```

### `GET /health`

Health check endpoint - returns model status.

## Detection Logic

### Phone Near Ear

- **Left Ear:** Phone center within 140px of left ear landmark
- **Right Ear:** Phone center within 140px of right ear landmark
- **Requirement:** Wrist must be raised above shoulder

### Phone In Front of Face

- Phone overlaps face bounding box (constructed from nose, eyes, ears)
- Phone center within 200px of nose
- Either wrist visible and raised

## Smoothing

- Uses 5-frame moving window for stability
- 300ms debounce to prevent flicker
- Majority voting (>50% of frames must agree)

## Performance

- **CPU:** 20-30 FPS on modern CPU (Intel i5/i7, AMD Ryzen)
- **Processing time:** 30-50ms per frame
- **Memory:** ~500MB

## Troubleshooting

### Models not loading

```
⚠️ Object detector failed to load
```

**Solution:** Download models to `backend/models/` directory

### Import errors

```
ModuleNotFoundError: No module named 'mediapipe'
```

**Solution:** Activate virtual environment and install requirements

### CORS errors

Frontend must be running on allowed origins:
- `http://localhost:5173` (Vite default)
- `http://localhost:3000` (CRA default)

Update `allow_origins` in `main.py` if using different port.
