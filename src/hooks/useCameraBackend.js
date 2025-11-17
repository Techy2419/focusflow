

import { useState, useRef, useCallback, useEffect } from 'react'
import { detectFrame, checkHealth } from '../api/detectionClient'

export function useCameraBackend(onDistractionDetected, options = {}) {
  const {
    detectionInterval = 500, // send frames to backend
    phoneDetectionDelay = 2000,
    awayDetectionDelay = 5000
  } = options

  // State
  const [isActive, setIsActive] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [backendStatus, setBackendStatus] = useState(null)
  const [status, setStatus] = useState({
    faceDetected: false,
    phoneDetected: false,
    lookingAway: false,
    posture: 'unknown'
  })
  const [stats, setStats] = useState({
    fps: 0,
    detections: 0,
    backendLatency: 0
  })

  // Refs
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const detectionLoopRef = useRef(null)
  const isActiveRef = useRef(false)  // track state for closure
  const lastPhoneDetectedRef = useRef(0)
  const lastFaceDetectedRef = useRef(0)
  const fpsRef = useRef({ count: 0, lastTime: Date.now() })

  
  useEffect(() => {
    checkBackendHealth()
  }, [])

  const checkBackendHealth = async () => {
    const health = await checkHealth()
    setBackendStatus(health)

    if (!health.ready) {
      console.warn('⚠️ Backend not ready:', health)
    } else {
      console.log('✅ Backend ready:', health)
    }
  }

  
  const startCamera = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      console.log('🎬 Starting camera (backend mode)...')

      // ping backend
      await checkBackendHealth()
      if (!backendStatus?.ready) {
        throw new Error('Backend not ready. Please start the Python detection server.')
      }

      // get camera
      console.log('📹 Requesting camera access...')
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        }
      })

      console.log('✅ Camera stream obtained')

      // attach stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream

        // wait for video
        await new Promise((resolve) => {
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play()
            resolve()
          }
        })

        console.log('✅ Video element ready')
        setIsActive(true)
        isActiveRef.current = true  // update ref
        startDetectionLoop()
      }
    } catch (err) {
      console.error('❌ Camera error:', err)
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }, [backendStatus])

  
  const stopCamera = useCallback(() => {
    console.log('⏹️ Stopping camera...')

    // stop loop
    if (detectionLoopRef.current) {
      clearInterval(detectionLoopRef.current)
      detectionLoopRef.current = null
    }

    // stop stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }

    // clear video
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }

    setIsActive(false)
    isActiveRef.current = false  // update ref
    console.log('✅ Camera stopped')
  }, [])

  
  const toggleCamera = useCallback(() => {
    if (isActive) {
      stopCamera()
    } else {
      startCamera()
    }
  }, [isActive, startCamera, stopCamera])

  
  const startDetectionLoop = useCallback(() => {
    console.log('🔄 Starting detection loop (backend mode)...')

    // detection interval
    let callCount = 0
    detectionLoopRef.current = setInterval(async () => {
      callCount++
      if (callCount === 1 || callCount % 10 === 0) {
        console.log(`📡 Detection interval fired (call #${callCount}):`, { hasVideo: !!videoRef.current, isActive: isActiveRef.current })
      }

      if (!videoRef.current || !isActiveRef.current) {
        console.log('⏸️ Detection paused:', { hasVideo: !!videoRef.current, isActive: isActiveRef.current })
        return
      }

      try {
        // send frame
        const startTime = Date.now()
        const result = await detectFrame(videoRef.current)
        const latency = Date.now() - startTime

        // update fps
        fpsRef.current.count++
        const now = Date.now()

        // calc fps
        let currentFps = fpsRef.current.fps || 0
        if (now - fpsRef.current.lastTime >= 1000) {
          currentFps = fpsRef.current.count
          fpsRef.current = { count: 0, lastTime: now, fps: currentFps }
        }

        // update stats
        setStats(prev => ({
          fps: currentFps,
          detections: prev.detections + 1,
          backendLatency: latency
        }))

        // process result
        processDetectionResult(result)

      } catch (err) {
        // log errors
        console.error('❌ Detection error:', err)
      }
    }, detectionInterval)

    console.log(`✅ Detection loop started (${detectionInterval}ms interval)`)
  }, [detectionInterval])  // Removed isActive - using ref instead to avoid closure issues

  
  const processDetectionResult = useCallback((result) => {
    const now = Date.now()

    // Debug logging
    if (Math.random() < 0.1) { // Log 10% of detections to avoid spam
      console.log('🔍 Detection result:', {
        pose_detected: result.pose_detected,
        face_detected: result.face_detected,
        phone_detected: result.phone_detected,
        keypoints: result.keypoints?.length || 0
      })
    }

    // Update temporal smoothing
    if (result.phone_near_left_ear || result.phone_near_right_ear || result.phone_in_front_of_face) {
      lastPhoneDetectedRef.current = now
    }

    if (result.face_detected) {
      lastFaceDetectedRef.current = now
    }

    // Apply temporal smoothing
    const phoneDetectedSmoothed = (
      result.phone_near_left_ear ||
      result.phone_near_right_ear ||
      result.phone_in_front_of_face ||
      (now - lastPhoneDetectedRef.current < phoneDetectionDelay)
    )

    const faceDetectedSmoothed = (
      result.face_detected ||
      (now - lastFaceDetectedRef.current < 1000)
    )

    // Update status
    const newStatus = {
      faceDetected: faceDetectedSmoothed,
      phoneDetected: phoneDetectedSmoothed,
      lookingAway: result.pose_detected && !faceDetectedSmoothed,
      posture: 'good', // Backend doesn't provide posture yet
      phoneNearLeftEar: result.phone_near_left_ear,
      phoneNearRightEar: result.phone_near_right_ear,
      phoneInFrontOfFace: result.phone_in_front_of_face
    }

    setStatus(newStatus)

    // Trigger distraction callbacks directly (avoid circular dependency)
    // Phone detection (highest priority)
    if (newStatus.phoneDetected && onDistractionDetected) {
      const distractionType = newStatus.phoneNearLeftEar ? 'phone_near_left_ear' :
                              newStatus.phoneNearRightEar ? 'phone_near_right_ear' :
                              newStatus.phoneInFrontOfFace ? 'phone_in_front_of_face' :
                              'phone_pickup'

      onDistractionDetected(distractionType, {
        timestamp: Date.now(),
        confidence: result.phone_boxes[0]?.confidence || 0,
        backend: 'mediapipe-python'
      })
    }
    // Looking away detection (body present, face not visible)
    else if (newStatus.lookingAway && onDistractionDetected) {
      onDistractionDetected('looking_away', {
        timestamp: Date.now(),
        backend: 'mediapipe-python',
        poseDetected: result.pose_detected
      })
    }
    // Left desk detection (neither body nor face detected)
    else if (!newStatus.faceDetected && !result.pose_detected && onDistractionDetected) {
      onDistractionDetected('left_desk', {
        timestamp: Date.now(),
        backend: 'mediapipe-python'
      })
    }
  }, [phoneDetectionDelay, onDistractionDetected])

  
  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [stopCamera])

  return {
    // State
    isActive,
    isLoading,
    error,
    backendStatus,
    status,
    stats,

    // Refs
    videoRef,

    // Actions
    startCamera,
    stopCamera,
    toggleCamera,
    checkBackendHealth
  }
}
