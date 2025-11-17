import { useState, useEffect, useRef, useCallback } from 'react'
import { auth, db } from '../lib/supabase'
import CameraFeedBackend from './session/CameraFeedBackend'
import FocusTimer from './session/FocusTimer'
import ImpactCard from './dashboard/ImpactCard'
import ProfileWidget from './profile/ProfileWidget'
import { useSession } from '../contexts/SessionContext'
import NotificationManager from './notifications/NotificationManager'
import AIIntervention from './notifications/AIIntervention'
import WelcomeOverlay from './onboarding/WelcomeOverlay'
import { useNotifications } from '../hooks/useNotifications'
import { useAIIntervention } from '../hooks/useAIIntervention'

export default function Dashboard({ user }) {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const { logDistraction, isActive, elapsed, focusedTime, getDistractionCount, endSession, pauseSession } = useSession()
  const { notifications, addNotification, clearNotifications } = useNotifications()
  const {
    showIntervention,
    currentDistraction,
    triggerIntervention,
    dismissIntervention,
    handleResponse
  } = useAIIntervention()

  // Ref to control camera from Dashboard
  const cameraControlRef = useRef(null)

  // Ref to store the latest callback (solves stale closure issue)
  const handleDistractionRef = useRef(null)

  // Update ref with latest implementation
  useEffect(() => {
    handleDistractionRef.current = (type, data) => {
      // Show visual notification
      addNotification(type, data)

      // Log to session if active
      if (isActive) {
        logDistraction(type, data)

        // Check if we should trigger AI intervention
        const focusedMinutes = Math.floor(elapsed / 60)
        const distractionCount = getDistractionCount(type) + 1 // +1 for current distraction

        triggerIntervention({
          type,
          count: distractionCount,
          focusedMinutes,
          data
        })
      }
    }
  }, [isActive, logDistraction, elapsed, getDistractionCount, triggerIntervention, addNotification])

  // Stable wrapper that calls the ref (never changes)
  const handleDistraction = useCallback((type, data) => {
    handleDistractionRef.current?.(type, data)
  }, [])

  // Handle AI intervention response
  const handleInterventionResponse = async (response) => {
    console.log('Intervention response:', response)

    // Log the user's response
    if (currentDistraction) {
      await logDistraction(currentDistraction.type, {
        ...currentDistraction.data,
        response
      })
    }

    // Handle specific responses
    if (response === 'end_session') {
      try {
        const result = await endSession(profile)
        console.log('Session ended:', result)
      } catch (error) {
        console.error('Failed to end session:', error)
      }
    } else if (response === 'break') {
      // Pause session for 5 minute break
      pauseSession(300) // 300 seconds = 5 minutes
      console.log('💆 Taking a 5-minute break!')
    }
  }

  useEffect(() => {
    loadProfile()
  }, [user])

  // Clear notifications when session becomes inactive
  useEffect(() => {
    if (!isActive) {
      clearNotifications()
    }
  }, [isActive, clearNotifications])

  // Automatically coordinate camera with session
  useEffect(() => {
    if (!cameraControlRef.current) return

    if (isActive) {
      // Session started - ensure camera is on
      if (!cameraControlRef.current.isActive) {
        console.log('📹 Auto-starting camera for session...')
        cameraControlRef.current.startCamera()
      }
    } else {
      // Session ended - turn off camera
      if (cameraControlRef.current.isActive) {
        console.log('📹 Auto-stopping camera - session ended')
        cameraControlRef.current.stopCamera()
      }
    }
  }, [isActive])

  async function loadProfile() {
    try {
      const { data, error } = await db.getProfile(user.id)
      if (error) throw error
      setProfile(data)

      // Check if first-time user
      const hasSeenOnboarding = localStorage.getItem('focusflow_onboarding_complete')
      if (!hasSeenOnboarding) {
        setShowOnboarding(true)
      }
    } catch (err) {
      console.error('Error loading profile:', err)
    } finally {
      setLoading(false)
    }
  }


  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Notification Manager */}
      <NotificationManager notifications={notifications} />

      {/* AI Intervention Modal */}
      {showIntervention && currentDistraction && (
        <AIIntervention
          distractionType={currentDistraction.type}
          focusedMinutes={currentDistraction.focusedMinutes}
          distractionCount={currentDistraction.count}
          onDismiss={dismissIntervention}
          onResponse={(response) => handleResponse(response, handleInterventionResponse)}
        />
      )}

      {/* Welcome Onboarding Overlay */}
      {showOnboarding && (
        <WelcomeOverlay onComplete={() => setShowOnboarding(false)} />
      )}

      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img
                src="/focusflow.svg"
                alt="FocusFlow logo"
                className="w-12 h-12 rounded-xl shadow-sm"
              />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">FocusFlow</h1>
                <p className="text-sm text-gray-600">
                  Beat Your Focus Record
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Profile Widget */}
              <ProfileWidget userProfile={profile} />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Welcome + Impact Row */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Welcome Card */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-2">
                Welcome back! 👋
              </h2>
              <p className="text-gray-600">
                Can you beat your last session? Start focusing and track your personal record.
              </p>
            </div>

            {/* Impact Card */}
            <ImpactCard
              userId={user.id}
              currentSession={isActive ? { focusedTime } : null}
            />
          </div>

          {/* Session Row - Timer + Camera */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Focus Timer */}
            <div className="lg:col-span-2">
              <FocusTimer userProfile={profile} />
            </div>

            {/* Camera AI Feed */}
            <div className="lg:col-span-1">
              <CameraFeedBackend
                onDistractionDetected={handleDistraction}
                controlRef={cameraControlRef}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
