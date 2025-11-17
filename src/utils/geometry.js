/**
 * Geometry utility functions for bounding box operations
 * Used in phone detection pipeline
 */

/**
 * Check if two bounding boxes intersect
 * @param {Object} boxA - {x, y, width, height}
 * @param {Object} boxB - {x, y, width, height}
 * @returns {boolean} - true if boxes overlap
 */
export function intersects(boxA, boxB) {
  if (!boxA || !boxB) return false

  const aRight = boxA.x + boxA.width
  const aBottom = boxA.y + boxA.height
  const bRight = boxB.x + boxB.width
  const bBottom = boxB.y + boxB.height

  // No intersection if one box is completely to the side of the other
  if (aRight < boxB.x || bRight < boxA.x) return false
  if (aBottom < boxB.y || bBottom < boxA.y) return false

  return true
}

/**
 * Expand a bounding box by a factor
 * @param {Object} box - {x, y, width, height}
 * @param {number} factor - expansion factor (1.5 = 50% larger)
 * @returns {Object} - expanded box
 */
export function expandBox(box, factor = 1.5) {
  if (!box) return null

  const widthIncrease = (box.width * (factor - 1)) / 2
  const heightIncrease = (box.height * (factor - 1)) / 2

  return {
    x: box.x - widthIncrease,
    y: box.y - heightIncrease,
    width: box.width * factor,
    height: box.height * factor
  }
}

/**
 * Calculate Euclidean distance between two points
 * @param {Object} a - {x, y}
 * @param {Object} b - {x, y}
 * @returns {number} - distance
 */
export function distance(a, b) {
  if (!a || !b) return Infinity
  const dx = a.x - b.x
  const dy = a.y - b.y
  return Math.sqrt(dx * dx + dy * dy)
}

/**
 * Create face region bounding box from pose keypoints
 * Uses nose, eyes, ears, and shoulders to define face area
 * @param {Array} keypoints - MoveNet keypoints
 * @param {number} videoWidth - video width for normalization
 * @param {number} videoHeight - video height for normalization
 * @returns {Object|null} - face bounding box {x, y, width, height}
 */
export function createFaceRegion(keypoints, videoWidth, videoHeight) {
  if (!keypoints || keypoints.length === 0) return null

  // Find relevant keypoints
  const nose = keypoints.find(kp => kp.name === 'nose')
  const leftEye = keypoints.find(kp => kp.name === 'left_eye')
  const rightEye = keypoints.find(kp => kp.name === 'right_eye')
  const leftEar = keypoints.find(kp => kp.name === 'left_ear')
  const rightEar = keypoints.find(kp => kp.name === 'right_ear')
  const leftShoulder = keypoints.find(kp => kp.name === 'left_shoulder')
  const rightShoulder = keypoints.find(kp => kp.name === 'right_shoulder')

  // Need at least nose for face detection
  if (!nose || nose.score < 0.2) return null

  // Collect valid face points
  const facePoints = [nose]
  if (leftEye && leftEye.score > 0.15) facePoints.push(leftEye)
  if (rightEye && rightEye.score > 0.15) facePoints.push(rightEye)
  if (leftEar && leftEar.score > 0.15) facePoints.push(leftEar)
  if (rightEar && rightEar.score > 0.15) facePoints.push(rightEar)

  // Calculate bounding box from face points
  const xs = facePoints.map(p => p.x)
  const ys = facePoints.map(p => p.y)

  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)

  // Add padding around face (30px on each side)
  const padding = 30

  // Extend height downward to cover chin/mouth area
  let height = (maxY - minY) + padding * 2

  // If we have shoulders, extend face region down to chest area
  if (leftShoulder && rightShoulder &&
      leftShoulder.score > 0.15 && rightShoulder.score > 0.15) {
    const shoulderY = Math.max(leftShoulder.y, rightShoulder.y)
    height = shoulderY - minY + padding
  }

  return {
    x: minX - padding,
    y: minY - padding,
    width: (maxX - minX) + padding * 2,
    height: height
  }
}

/**
 * Create hand region bounding box from wrist keypoint
 * Expands wrist position into a region where hand would be
 * @param {Object} wristKeypoint - wrist keypoint {x, y, score}
 * @param {number} videoWidth - video width
 * @param {number} videoHeight - video height
 * @returns {Object|null} - hand bounding box {x, y, width, height}
 */
export function createHandRegion(wristKeypoint, videoWidth, videoHeight) {
  if (!wristKeypoint || wristKeypoint.score < 0.15) return null

  // Create base box around wrist (60x60px)
  const baseSize = 60
  const baseBox = {
    x: wristKeypoint.x - baseSize / 2,
    y: wristKeypoint.y - baseSize / 2,
    width: baseSize,
    height: baseSize
  }

  // Expand by 1.8x to cover full hand + phone holding area
  return expandBox(baseBox, 1.8)
}

/**
 * Clamp bounding box to video dimensions
 * Ensures box doesn't go outside video bounds
 * @param {Object} box - {x, y, width, height}
 * @param {number} width - video width
 * @param {number} height - video height
 * @returns {Object} - clamped box
 */
export function clampBoxToVideo(box, width, height) {
  if (!box) return null

  return {
    x: Math.max(0, Math.min(box.x, width)),
    y: Math.max(0, Math.min(box.y, height)),
    width: Math.max(0, Math.min(box.width, width - box.x)),
    height: Math.max(0, Math.min(box.height, height - box.y))
  }
}

/**
 * Calculate Intersection over Union (IoU) for two boxes
 * Useful for measuring overlap percentage
 * @param {Object} boxA - {x, y, width, height}
 * @param {Object} boxB - {x, y, width, height}
 * @returns {number} - IoU score (0-1)
 */
export function calculateIoU(boxA, boxB) {
  if (!boxA || !boxB) return 0

  const aRight = boxA.x + boxA.width
  const aBottom = boxA.y + boxA.height
  const bRight = boxB.x + boxB.width
  const bBottom = boxB.y + boxB.height

  // Calculate intersection
  const intersectX = Math.max(0, Math.min(aRight, bRight) - Math.max(boxA.x, boxB.x))
  const intersectY = Math.max(0, Math.min(aBottom, bBottom) - Math.max(boxA.y, boxB.y))
  const intersectionArea = intersectX * intersectY

  // Calculate union
  const aArea = boxA.width * boxA.height
  const bArea = boxB.width * boxB.height
  const unionArea = aArea + bArea - intersectionArea

  return unionArea > 0 ? intersectionArea / unionArea : 0
}
