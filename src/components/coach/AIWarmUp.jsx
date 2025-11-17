

import { useState } from 'react'
import { Target, Sparkles } from 'lucide-react'

export default function AIWarmUp({ onStart, onSkip }) {
  const [goal, setGoal] = useState('')
  const [customGoal, setCustomGoal] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [aiMessage, setAiMessage] = useState('')

  const quickGoals = [
    'Finish homework',
    'Review class notes',
    'Prepare for quiz',
    'Work on project',
    'Study for exam'
  ]

  async function handleStart() {
    const finalGoal = goal === 'custom' ? customGoal : goal

    if (!finalGoal.trim()) {
      alert('Please select or enter your study goal!')
      return
    }

    setIsLoading(true)

    try {
      // Call Gemini AI to generate warm-up message
      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + import.meta.env.VITE_GEMINI_API_KEY, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are a supportive AI study coach helping a student get mentally prepared for a focused session.

Student's goal: "${finalGoal}"

Your role: Generate ONE powerful, energizing message (10-15 words max) that helps them mentally prepare and feel motivated to start.

Guidelines:
- Be warm, encouraging, and genuine (not cheesy)
- Focus on effort and process, NOT outcomes
- Use active, present-tense language
- Add ONE relevant emoji at the end
- Sound like a supportive friend, not a teacher

Examples of GREAT tone:
- "Time to lock in on some math - small wins build momentum! 💪"
- "Let's tackle that essay together, one word at a time! ✍️"
- "Biology review mode activated - you got this! 🧬"

Respond with ONLY the motivational message, nothing else.`
            }]
          }]
        })
      })

      const data = await response.json()
      const message = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ||
        `Let's focus on ${finalGoal}! You got this! 💪`

      setAiMessage(message)

      // Show message for 2 seconds, then start session
      setTimeout(() => {
        onStart(finalGoal, message)
      }, 2000)
    } catch (error) {
      console.error('Failed to generate AI warm-up:', error)
      // Fallback message
      const fallbackMessage = `Let's focus on ${finalGoal}! You got this! 💪`
      setAiMessage(fallbackMessage)
      setTimeout(() => {
        onStart(finalGoal, fallbackMessage)
      }, 2000)
    }
  }

  if (aiMessage) {
    // Show AI message screen
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center animate-fadeIn">
          <Sparkles size={48} className="mx-auto mb-4 text-yellow-500 animate-pulse" />
          <p className="text-xl font-bold text-gray-800 leading-relaxed">
            {aiMessage}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
          <div className="flex items-center gap-2">
            <Target size={24} />
            <h3 className="font-bold text-xl">What's your goal?</h3>
          </div>
          <p className="text-sm text-white/90 mt-1">
            Set your study goal to get focused
          </p>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Quick Goals */}
          <div className="space-y-2">
            {quickGoals.map((quickGoal) => (
              <button
                key={quickGoal}
                onClick={() => setGoal(quickGoal)}
                className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                  goal === quickGoal
                    ? 'border-blue-600 bg-blue-50 text-blue-900 font-medium'
                    : 'border-gray-200 hover:border-blue-300 text-gray-700'
                }`}
              >
                {quickGoal}
              </button>
            ))}
          </div>

          {/* Custom Goal */}
          <div className="space-y-2">
            <button
              onClick={() => setGoal('custom')}
              className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                goal === 'custom'
                  ? 'border-blue-600 bg-blue-50 text-blue-900 font-medium'
                  : 'border-gray-200 hover:border-blue-300 text-gray-700'
              }`}
            >
              Custom goal...
            </button>
            {goal === 'custom' && (
              <input
                type="text"
                value={customGoal}
                onChange={(e) => setCustomGoal(e.target.value)}
                placeholder="e.g., Algebra 2 practice"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoFocus
              />
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-50 flex gap-3">
          <button
            onClick={onSkip}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Skip
          </button>
          <button
            onClick={handleStart}
            disabled={isLoading || !goal}
            className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Loading...' : 'Start Session'}
          </button>
        </div>
      </div>
    </div>
  )
}
