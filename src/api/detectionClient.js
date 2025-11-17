

const API_BASE_URL = import.meta.env.VITE_DETECTION_API_URL || 'http://localhost:8000'


export async function videoFrameToBlob(videoElement) {
  const canvas = document.createElement('canvas')
  canvas.width = videoElement.videoWidth
  canvas.height = videoElement.videoHeight

  const ctx = canvas.getContext('2d')
  ctx.drawImage(videoElement, 0, 0)

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob)
    }, 'image/jpeg', 0.8) // 80% quality for balance between size and accuracy
  })
}


export async function detectFrame(videoElement) {
  try {
    // Convert video frame to blob
    const blob = await videoFrameToBlob(videoElement)

    // Create FormData
    const formData = new FormData()
    formData.append('file', blob, 'frame.jpg')

    // Send to backend
    const response = await fetch(`${API_BASE_URL}/detect`, {
      method: 'POST',
      body: formData,
      // Don't set Content-Type - browser will set it with boundary for multipart/form-data
    })

    if (!response.ok) {
      throw new Error(`Detection API error: ${response.status}`)
    }

    const result = await response.json()
    return result
  } catch (error) {
    console.error('Detection API call failed:', error)
    throw error
  }
}


export async function checkHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/health`)

    if (!response.ok) {
      throw new Error(`Health check failed: ${response.status}`)
    }

    const result = await response.json()
    return result
  } catch (error) {
    console.error('Backend health check failed:', error)
    return {
      status: 'offline',
      models_loaded: {
        object_detector: false,
        pose_landmarker: false
      },
      ready: false
    }
  }
}


