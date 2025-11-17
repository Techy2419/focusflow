/**
 * Distraction Alert Component
 * Shows visual notifications when distractions are detected
 * Supports different alert types with animations and sounds
 */

import { useEffect, useState } from 'react'
import { X, Smartphone, UserX, Eye, AlertTriangle } from 'lucide-react'

const ALERT_CONFIGS = {
  phone_pickup: {
    icon: Smartphone,
    title: '📱 Phone Pickup',
    message: 'Quick check-in: ready to refocus?',
    color: 'purple',
    sound: 'gentle'
  },
  phone_near_left_ear: {
    icon: Smartphone,
    title: '📞 Phone Call',
    message: 'Take your time - we\'ll be here when you\'re back!',
    color: 'blue',
    sound: 'gentle'
  },
  phone_near_right_ear: {
    icon: Smartphone,
    title: '📞 Phone Call',
    message: 'Take your time - we\'ll be here when you\'re back!',
    color: 'blue',
    sound: 'gentle'
  },
  phone_in_front_of_face: {
    icon: Smartphone,
    title: '📱 Scrolling Detected',
    message: 'Quick break? That\'s okay - ready to dive back in?',
    color: 'purple',
    sound: 'gentle'
  },
  left_desk: {
    icon: UserX,
    title: '🚶 Stepped Away',
    message: 'Stretch break? Come back when you\'re ready!',
    color: 'blue',
    sound: 'gentle'
  },
  looking_away: {
    icon: Eye,
    title: '👀 Attention Wandered',
    message: 'It happens! Let\'s gently refocus together',
    color: 'indigo',
    sound: 'gentle'
  },
  poor_posture: {
    icon: AlertTriangle,
    title: '🧘 Posture Check',
    message: 'Quick reminder: sit up for better focus & energy!',
    color: 'teal',
    sound: 'gentle'
  }
}

export default function DistractionAlert({
  type,
  onDismiss,
  autoHideDuration = 5000,
  enableSound = true
}) {
  const [isVisible, setIsVisible] = useState(true)
  const [isExiting, setIsExiting] = useState(false)

  const config = ALERT_CONFIGS[type] || {
    icon: AlertTriangle,
    title: 'Distraction Detected',
    message: 'Stay focused!',
    color: 'gray',
    sound: 'alert'
  }

  const Icon = config.icon

  // Color variants - modern, friendly palette
  const colorClasses = {
    purple: {
      bg: 'bg-gradient-to-r from-purple-500 to-pink-500',
      bgLight: 'bg-purple-50',
      border: 'border-purple-200',
      text: 'text-purple-900',
      iconBg: 'bg-purple-100',
      iconText: 'text-purple-600',
      accent: 'bg-purple-500'
    },
    blue: {
      bg: 'bg-gradient-to-r from-blue-500 to-cyan-500',
      bgLight: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-900',
      iconBg: 'bg-blue-100',
      iconText: 'text-blue-600',
      accent: 'bg-blue-500'
    },
    indigo: {
      bg: 'bg-gradient-to-r from-indigo-500 to-purple-500',
      bgLight: 'bg-indigo-50',
      border: 'border-indigo-200',
      text: 'text-indigo-900',
      iconBg: 'bg-indigo-100',
      iconText: 'text-indigo-600',
      accent: 'bg-indigo-500'
    },
    teal: {
      bg: 'bg-gradient-to-r from-teal-500 to-green-500',
      bgLight: 'bg-teal-50',
      border: 'border-teal-200',
      text: 'text-teal-900',
      iconBg: 'bg-teal-100',
      iconText: 'text-teal-600',
      accent: 'bg-teal-500'
    },
    gray: {
      bg: 'bg-gradient-to-r from-gray-500 to-gray-600',
      bgLight: 'bg-gray-50',
      border: 'border-gray-200',
      text: 'text-gray-900',
      iconBg: 'bg-gray-100',
      iconText: 'text-gray-600',
      accent: 'bg-gray-500'
    }
  }

  const colors = colorClasses[config.color]

  // Play sound effect
  useEffect(() => {
    if (enableSound) {
      playSound(config.sound)
    }
  }, [enableSound, config.sound])

  // Auto-hide timer
  useEffect(() => {
    if (autoHideDuration > 0) {
      const timer = setTimeout(() => {
        handleClose()
      }, autoHideDuration)

      return () => clearTimeout(timer)
    }
  }, [autoHideDuration])

  const handleClose = () => {
    setIsExiting(true)
    setTimeout(() => {
      setIsVisible(false)
      onDismiss?.()
    }, 300) // Match animation duration
  }

  if (!isVisible) return null

  return (
    <div
      className={`
        max-w-sm w-full
        transform transition-all duration-500 ease-out
        ${isExiting
          ? 'translate-x-full opacity-0 scale-95'
          : 'translate-x-0 opacity-100 scale-100'
        }
      `}
    >
      <div
        className={`
          ${colors.bgLight} backdrop-blur-sm bg-opacity-95
          rounded-xl shadow-2xl overflow-hidden
          border-2 ${colors.border}
          transform hover:scale-105 transition-transform duration-200
        `}
      >
        {/* Gradient accent bar on top */}
        <div className={`h-1.5 ${colors.bg}`} />

        <div className="p-4">
          <div className="flex items-start gap-3">
            {/* Icon with pulse animation */}
            <div className={`${colors.iconBg} p-2.5 rounded-xl flex-shrink-0 animate-pulse-slow`}>
              <Icon className={colors.iconText} size={22} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h3 className={`font-bold ${colors.text} mb-1 text-base`}>
                {config.title}
              </h3>
              <p className="text-sm text-gray-700 leading-relaxed">
                {config.message}
              </p>

              {/* Progress bar (auto-hide indicator) */}
              {autoHideDuration > 0 && (
                <div className="mt-3 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${colors.accent}`}
                    style={{
                      animation: `progress ${autoHideDuration}ms linear forwards`
                    }}
                  />
                </div>
              )}
            </div>

            {/* Close button */}
            <button
              onClick={handleClose}
              className="flex-shrink-0 text-gray-400 hover:text-gray-700 transition-colors p-1 rounded-lg hover:bg-gray-100"
              aria-label="Dismiss alert"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Play sound effect for alert
 */
function playSound(soundType) {
  // Use Web Audio API for sound generation
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    // Sound configurations
    const sounds = {
      alert: { freq: 880, duration: 0.15 },      // High beep
      warning: { freq: 440, duration: 0.2 },     // Medium beep
      gentle: { freq: 220, duration: 0.1 }       // Low beep
    }

    const sound = sounds[soundType] || sounds.alert

    oscillator.frequency.value = sound.freq
    oscillator.type = 'sine'
    gainNode.gain.value = 0.1 // Low volume

    oscillator.start()
    oscillator.stop(audioContext.currentTime + sound.duration)

    // Cleanup
    setTimeout(() => {
      audioContext.close()
    }, sound.duration * 1000 + 100)
  } catch (error) {
    console.warn('Could not play sound:', error)
  }
}
