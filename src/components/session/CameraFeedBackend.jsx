

import { useEffect, useImperativeHandle } from 'react'
import { Camera, CameraOff, Activity, User, Phone, Eye, Server } from 'lucide-react'
import { useCameraBackend } from '../../hooks/useCameraBackend'

export default function CameraFeedBackend({ onDistractionDetected, controlRef, className = '' }) {
  const {
    isActive,
    isLoading,
    error,
    backendStatus,
    status,
    stats,
    videoRef,
    startCamera,
    stopCamera,
    toggleCamera
  } = useCameraBackend(onDistractionDetected, {
    detectionInterval: 500, // Send frames every 500ms
    phoneDetectionDelay: 2000,
    awayDetectionDelay: 5000
  })

  // Expose camera control methods via ref (for Dashboard to auto-start)
  useImperativeHandle(controlRef, () => ({
    isActive,
    startCamera,
    stopCamera,
    toggleCamera
  }), [isActive, startCamera, stopCamera, toggleCamera])

  return (
    <div className={`bg-white rounded-xl shadow-lg p-6 h-full flex flex-col ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Activity className="text-primary" size={20} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">AI Focus Monitor</h3>
            <p className="text-xs text-gray-500">
              Python MediaPipe Backend • CPU-only
            </p>
          </div>
        </div>

        {/* Toggle Button */}
        <button
          onClick={toggleCamera}
          disabled={isLoading || (backendStatus && !backendStatus.ready)}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
            isActive
              ? 'bg-danger/10 text-danger hover:bg-danger/20'
              : 'bg-primary text-white hover:bg-primary-dark'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              <span className="text-sm">Starting...</span>
            </>
          ) : isActive ? (
            <>
              <CameraOff size={16} />
              <span className="text-sm">Turn Off</span>
            </>
          ) : (
            <>
              <Camera size={16} />
              <span className="text-sm">Turn On</span>
            </>
          )}
        </button>
      </div>

      {/* Backend Status Warning */}
      {backendStatus && !backendStatus.ready && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start gap-2">
            <Server className="text-yellow-600 flex-shrink-0 mt-0.5" size={16} />
            <div>
              <p className="text-sm font-medium text-yellow-800">Backend Not Ready</p>
              <p className="text-xs text-yellow-700 mt-1">
                Detection server is offline. Please start the Python backend:
              </p>
              <code className="text-xs bg-yellow-100 px-2 py-1 rounded mt-2 block">
                cd backend && python main.py
              </code>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
          <p className="text-xs text-red-600 mt-1">
            {error.includes('Backend') ? 'Start the Python server first.' : 'Try refreshing or check camera permissions.'}
          </p>
        </div>
      )}

      {/* Camera View or Placeholder */}
      <div className="space-y-4 flex-1 flex flex-col">
        {/* Video Feed - Always rendered but hidden when inactive */}
        <div className={`relative aspect-video bg-gray-900 rounded-lg overflow-hidden ${!isActive ? 'hidden' : ''}`}>
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            style={{ transform: 'scaleX(-1)' }}
            playsInline
            muted
            autoPlay
          />

          {/* Status Indicators Overlay */}
          <div className="absolute top-2 right-2 flex flex-col gap-2">
            {/* Face Detection Indicator */}
            <div
              className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
                status.faceDetected
                  ? 'bg-success/90 text-white'
                  : 'bg-danger/90 text-white'
              }`}
            >
              <User size={12} />
              {status.faceDetected ? 'Present' : 'Away'}
            </div>

            {/* Phone Detection Indicator */}
            {status.phoneDetected && (
              <div className="px-3 py-1 rounded-full text-xs font-medium bg-warning/90 text-white flex items-center gap-1 animate-pulse">
                <Phone size={12} />
                {status.phoneNearLeftEar ? 'Left Ear' :
                 status.phoneNearRightEar ? 'Right Ear' :
                 status.phoneInFrontOfFace ? 'In Front' :
                 'Detected'}
              </div>
            )}

            {/* Backend Indicator */}
            <div className="px-3 py-1 rounded-full text-xs font-medium bg-purple-500/90 text-white flex items-center gap-1">
              <Server size={12} />
              Backend
            </div>
          </div>

          {/* Stats Overlay (Bottom Left) */}
          <div className="absolute bottom-2 left-2 space-y-1">
            <div className="px-2 py-1 bg-black/50 text-white text-xs rounded">
              {stats.fps} FPS
            </div>
            <div className="px-2 py-1 bg-black/50 text-white text-xs rounded">
              {stats.backendLatency}ms
            </div>
          </div>
        </div>

        {/* Status Grid - Only shown when active */}
        {isActive && (
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <User size={16} className="text-gray-600" />
                <p className="text-xs font-medium text-gray-600">Face</p>
              </div>
              <p className={`text-sm font-bold ${
                status.faceDetected ? 'text-success' : 'text-danger'
              }`}>
                {status.faceDetected ? 'Detected' : 'Not Found'}
              </p>
            </div>

            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Phone size={16} className="text-gray-600" />
                <p className="text-xs font-medium text-gray-600">Phone</p>
              </div>
              <p className={`text-sm font-bold ${
                status.phoneDetected ? 'text-warning' : 'text-success'
              }`}>
                {status.phoneNearRightEar ? 'Right Ear' :
                 status.phoneNearLeftEar ? 'Left Ear' :
                 status.phoneInFrontOfFace ? 'In Front' :
                 status.phoneDetected ? 'In Hand' : 'Clear'}
              </p>
            </div>
          </div>
        )}

        {/* Info - Only shown when active */}
        {isActive && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-700">
              <strong>Privacy Note:</strong> All AI processing happens on your local Python server.
              No video is ever uploaded to the cloud.
            </p>
          </div>
        )}

        {/* Placeholder when camera is off */}
        {!isActive && (
          <div className="aspect-video bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-primary/30">
            <div className="p-4 bg-white rounded-full mb-4 shadow-sm">
              <Camera className="text-primary" size={32} />
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">
              Camera AI Disabled
            </h4>
            <p className="text-sm text-gray-600 max-w-xs mb-3">
              Using Python MediaPipe backend for detection.
              Start the detection server first!
            </p>
            {backendStatus && backendStatus.ready && (
              <div className="flex items-center gap-2 text-xs text-success">
                <Server size={14} />
                <span>Backend ready</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Backend Info Footer */}
      {isActive && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Powered by MediaPipe (Python CPU)</span>
            <span className="flex items-center gap-1">
              <Server size={12} />
              localhost:8000
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
