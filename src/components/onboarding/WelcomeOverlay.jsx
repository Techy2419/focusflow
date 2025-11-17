

import { useState } from 'react'
import { Camera, Brain, Sparkles, Zap } from 'lucide-react'

export default function WelcomeOverlay({ onComplete }) {
  const [step, setStep] = useState(0)

  const steps = [
    {
      icon: Camera,
      color: 'from-blue-500 to-cyan-500',
      title: 'Camera Detects Distractions',
      description: 'FocusFlow uses your camera to detect when you pick up your phone or get distracted. No recording - just real-time detection!',
      emoji: '📸'
    },
    {
      icon: Brain,
      color: 'from-purple-500 to-pink-500',
      title: 'AI Coach Helps You Refocus',
      description: 'Get warm, supportive nudges from our AI when you lose focus. No scolding - just friendly check-ins!',
      emoji: '🤖'
    },
    {
      icon: Sparkles,
      color: 'from-green-500 to-teal-500',
      title: 'Track Your Progress',
      description: 'See your focus streaks, daily progress, and get personalized insights after each session.',
      emoji: '✨'
    },
    {
      icon: Zap,
      color: 'from-orange-500 to-red-500',
      title: 'Ready to Focus?',
      description: 'Allow camera access when prompted, set your study goal, and let FocusFlow help you stay on track!',
      emoji: '🚀'
    }
  ]

  const currentStep = steps[step]
  const Icon = currentStep.icon

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1)
    } else {
      localStorage.setItem('focusflow_onboarding_complete', 'true')
      onComplete()
    }
  }

  const handleSkip = () => {
    localStorage.setItem('focusflow_onboarding_complete', 'true')
    onComplete()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-slideUp">
        {/* Progress dots */}
        <div className="flex justify-center gap-2 pt-6 pb-4">
          {steps.map((_, idx) => (
            <div
              key={idx}
              className={`h-2 rounded-full transition-all duration-300 ${
                idx === step
                  ? 'w-8 bg-gradient-to-r ' + currentStep.color
                  : 'w-2 bg-gray-300'
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="p-8 text-center">
          {/* Icon */}
          <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${currentStep.color} mb-6`}>
            <Icon size={48} className="text-white" />
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            {currentStep.emoji} {currentStep.title}
          </h2>

          {/* Description */}
          <p className="text-gray-600 leading-relaxed mb-8">
            {currentStep.description}
          </p>

          {/* Buttons */}
          <div className="flex gap-3">
            {step < steps.length - 1 ? (
              <>
                <button
                  onClick={handleSkip}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                >
                  Skip
                </button>
                <button
                  onClick={handleNext}
                  className={`flex-1 px-6 py-3 bg-gradient-to-r ${currentStep.color} text-white rounded-xl font-medium hover:opacity-90 transition-opacity shadow-lg`}
                >
                  Next
                </button>
              </>
            ) : (
              <button
                onClick={handleNext}
                className={`w-full px-6 py-3 bg-gradient-to-r ${currentStep.color} text-white rounded-xl font-bold hover:opacity-90 transition-opacity shadow-lg`}
              >
                Let's Go! 🎯
              </button>
            )}
          </div>
        </div>

        {/* Footer tip */}
        <div className="px-6 pb-6 text-center">
          <p className="text-xs text-gray-500">
            💡 Tip: Allow camera access for the best experience
          </p>
        </div>
      </div>
    </div>
  )
}
