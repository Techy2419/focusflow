import { useState, useEffect } from 'react'
import { Play, Pause, Square, Target, Lightbulb } from 'lucide-react'
import { useSession } from '../../contexts/SessionContext'
import { formatTime } from '../../lib/utils'
import { auth } from '../../lib/supabase'
import { getRandomStudyTip } from '../../data/studyTips'
import AIWarmUp from '../coach/AIWarmUp'
import AICoolDown from '../coach/AICoolDown'

export default function FocusTimer({ className = '', userProfile, onSessionEnd }) {
  const {
    isActive,
    isPaused,
    breakTimeRemaining,
    elapsed,
    focusedTime,
    focusScore,
    distractions,
    currentSession,
    startSession,
    endSession,
    resumeSession
  } = useSession()

  const [goal, setGoal] = useState('')
  const [showWarmUp, setShowWarmUp] = useState(false)
  const [showCoolDown, setShowCoolDown] = useState(false)
  const [coolDownData, setCoolDownData] = useState(null)
  const [isEnding, setIsEnding] = useState(false)
  const [studyTip, setStudyTip] = useState(getRandomStudyTip())

  // Get new study tip when break starts
  useEffect(() => {
    if (isPaused) {
      setStudyTip(getRandomStudyTip())
    }
  }, [isPaused])

  const handleStart = async (sessionGoal, aiWarmupMessage) => {
    try {
      await startSession(sessionGoal, aiWarmupMessage)
      setShowWarmUp(false)
      setGoal(sessionGoal)
    } catch (error) {
      console.error('Failed to start session:', error)
      alert('Failed to start session. Please try again.')
    }
  }

  const handleSkipWarmUp = async () => {
    try {
      await startSession('', '')
      setShowWarmUp(false)
    } catch (error) {
      console.error('Failed to start session:', error)
      alert('Failed to start session. Please try again.')
    }
  }

  const handleEnd = async () => {
    setIsEnding(true)
    try {
      const sessionData = await endSession(userProfile)

      // Show AI cool-down reflection
      setCoolDownData({
        goal: goal || 'Study session',
        focusedMinutes: Math.floor((focusedTime || 0) / 60),
        distractions: Array.isArray(distractions) ? distractions.length : (distractions || 0)
      })
      setShowCoolDown(true)

      // Notify parent component to show XP popup
      if (onSessionEnd) {
        onSessionEnd(sessionData)
      }
    } catch (error) {
      console.error('Failed to end session:', error)
      alert('Failed to end session. Please try again.')
    } finally {
      setIsEnding(false)
    }
  }

  const handleCloseCoolDown = () => {
    setShowCoolDown(false)
    setCoolDownData(null)
    setGoal('')
  }

  return (
    <div className={`bg-white rounded-xl shadow-lg p-6 ${className}`}>
      <div className="text-center">
        {/* Break Timer (when paused) */}
        {isPaused && (
          <div className="mb-6">
            <div className="p-6 bg-yellow-50 border-2 border-yellow-200 rounded-xl mb-4">
              <div className="text-4xl mb-3">☕</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Break Time!</h3>
              <div className="text-5xl font-bold text-yellow-600 mb-3">
                {formatTime(breakTimeRemaining)}
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Relax and recharge. Session will resume automatically.
              </p>
              <button
                onClick={resumeSession}
                className="px-6 py-2 bg-success text-white rounded-lg font-medium hover:bg-green-600 transition-colors"
              >
                Resume Now
              </button>
            </div>

            {/* Study Tip Card */}
            <div className="p-5 bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200 rounded-xl">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Lightbulb className="text-purple-600" size={24} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{studyTip.emoji}</span>
                    <h4 className="font-bold text-gray-900">{studyTip.title}</h4>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">{studyTip.tip}</p>
                  <p className="text-xs text-purple-600 mt-2 font-medium">💡 Science-backed learning tip</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Timer Display (when not on break) */}
        {!isPaused && (
          <div className="mb-6">
            <div className={`text-7xl font-bold mb-2 transition-colors ${
              isActive ? 'text-gray-900' : 'text-gray-400'
            }`}>
              {formatTime(elapsed)}
            </div>

            {/* Focus Score */}
            {isActive && (
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="text-sm text-gray-600">Focus Score:</span>
                <span className={`text-3xl font-bold ${
                  focusScore >= 80 ? 'text-success' :
                  focusScore >= 60 ? 'text-warning' :
                  'text-danger'
                }`}>
                  {Math.round(focusScore)}%
                </span>
              </div>
            )}

            {/* Progress Bar */}
            {isActive && (
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-4">
                <div
                  className={`h-full transition-all duration-300 ${
                    focusScore >= 80 ? 'bg-success' :
                    focusScore >= 60 ? 'bg-warning' :
                    'bg-danger'
                  }`}
                  style={{ width: `${focusScore}%` }}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
        {!isActive ? (
          <button
            onClick={() => setShowWarmUp(true)}
            className="flex items-center gap-2 px-8 py-4 bg-primary text-white rounded-xl font-semibold text-lg hover:bg-primary-dark transition-colors shadow-lg hover:shadow-xl"
          >
            <Play size={24} />
            Start Focus Session
          </button>
        ) : (
          <>
            <button
              onClick={handleEnd}
              disabled={isEnding}
              className="flex items-center gap-2 px-6 py-3 bg-danger text-white rounded-lg font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
            >
              <Square size={20} />
              End Session
            </button>
          </>
        )}
      </div>

      {/* Session Stats */}
      {isActive && (
        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600 mb-1">Duration</p>
            <p className="text-lg font-bold text-gray-900">
              {Math.floor(elapsed / 60)}m
            </p>
          </div>

          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600 mb-1">Distractions</p>
            <p className={`text-lg font-bold ${
              distractions.length === 0 ? 'text-success' :
              distractions.length <= 2 ? 'text-warning' :
              'text-danger'
            }`}>
              {distractions.length}
            </p>
          </div>

          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600 mb-1">Score</p>
            <p className={`text-lg font-bold ${
              focusScore >= 80 ? 'text-success' :
              focusScore >= 60 ? 'text-warning' :
              'text-danger'
            }`}>
              {Math.round(focusScore)}%
            </p>
          </div>
        </div>
      )}

      {/* Motivational Messages */}
      {isActive && (
        <div className="mt-4 p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg">
          <p className="text-sm text-gray-700">
            {elapsed < 300 ? "🚀 Just getting started! You've got this!" :
             elapsed < 1800 ? "💪 Great focus! Keep the momentum going!" :
             elapsed < 3600 ? "🔥 You're on fire! Crushing it!" :
             "🏆 LEGENDARY! Over an hour of pure focus!"}
          </p>
        </div>
      )}

      {/* Tips when not active */}
      {!isActive && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-left">
          <p className="text-sm font-semibold text-blue-900 mb-2">💡 Tips for better focus:</p>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>• Camera AI will auto-start when you begin</li>
            <li>• Set a specific goal before starting</li>
            <li>• Aim for at least 25 minutes (Pomodoro technique)</li>
            <li>• Keep your phone out of reach</li>
          </ul>
        </div>
      )}

      {/* AI Warm-Up Modal */}
      {showWarmUp && (
        <AIWarmUp
          onStart={handleStart}
          onSkip={handleSkipWarmUp}
        />
      )}

      {/* AI Cool-Down Reflection Modal */}
      {showCoolDown && coolDownData && (
        <AICoolDown
          sessionData={coolDownData}
          onClose={handleCloseCoolDown}
        />
      )}
    </div>
  )
}
