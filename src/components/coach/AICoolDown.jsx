

import { useState, useEffect } from 'react'
import { Sparkles, TrendingUp } from 'lucide-react'

export default function AICoolDown({ sessionData, onClose }) {
  const [reflection, setReflection] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    generateReflection()
  }, [])

  async function generateReflection() {
    const { goal, focusedMinutes, distractions } = sessionData

    try {
      // Call Gemini AI to generate reflection
      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + import.meta.env.VITE_GEMINI_API_KEY, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are an empathetic AI study coach providing post-session reflection for a student.

Session Summary:
- Goal: "${goal}"
- Focused time: ${focusedMinutes} minutes
- Distractions: ${distractions}

Your task: Generate a meaningful, personalized reflection that helps build study habits and growth mindset.

Create 3 parts:
1. "great" - Celebrate what they accomplished (be SPECIFIC about the time/effort, not generic praise)
2. "nextTime" - One actionable, gentle improvement tip (based on the data, make it realistic)
3. "vibe" - Overall assessment that builds confidence (acknowledge progress, even if small)

Guidelines:
- Each part: 8-12 words max
- Sound like a supportive friend who cares about their growth
- Be honest but encouraging (even 5 mins is progress!)
- If distractions are high, acknowledge it without shame
- Add ONE relevant emoji to each part
- Use their actual goal in the reflection when possible

Examples of GREAT reflections:
For 25 mins, 1 distraction:
{
  "great": "25 minutes of solid focus time - that's real progress! 🎯",
  "nextTime": "Try stretching before - helps reduce that restlessness! 💪",
  "vibe": "Building consistency, one session at a time. Proud of you! 🌟"
}

For 8 mins, 4 distractions:
{
  "great": "You showed up and tried - that takes courage! 💙",
  "nextTime": "Phone on airplane mode might help reduce interruptions! ✈️",
  "vibe": "Rough start, but every session teaches you something! 📚"
}

Format: Return ONLY valid JSON with these exact keys: "great", "nextTime", "vibe"`
            }]
          }]
        })
      })

      const data = await response.json()
      let reflectionText = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim()

      // Parse JSON from response
      if (reflectionText) {
        // Remove markdown code blocks if present
        reflectionText = reflectionText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
        const parsed = JSON.parse(reflectionText)
        setReflection(parsed)
      } else {
        throw new Error('No reflection generated')
      }
    } catch (error) {
      console.error('Failed to generate AI reflection:', error)
      // Fallback reflection
      setReflection({
        great: `${focusedMinutes} minutes of solid focus - awesome! 💪`,
        nextTime: 'Try going even longer next time!',
        vibe: 'Building strong study habits! 🎯'
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
          <Sparkles size={48} className="mx-auto mb-4 text-yellow-500 animate-pulse" />
          <p className="text-gray-600">Generating your reflection...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-fadeIn">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-blue-600 p-6 text-white">
          <div className="flex items-center gap-2">
            <TrendingUp size={24} />
            <h3 className="font-bold text-xl">Session Complete!</h3>
          </div>
          <p className="text-sm text-white/90 mt-1">
            Here's how you did
          </p>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Stats Summary */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="text-xs text-gray-600">Focused Time</p>
              <p className="text-2xl font-bold text-gray-900">{sessionData.focusedMinutes} min</p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Distractions</p>
              <p className="text-2xl font-bold text-gray-900">{sessionData.distractions}</p>
            </div>
          </div>

          {/* AI Reflection */}
          {reflection && (
            <div className="space-y-3">
              <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
                <p className="text-xs font-semibold text-green-700 uppercase mb-1">Great job</p>
                <p className="text-sm text-gray-800">{reflection.great}</p>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                <p className="text-xs font-semibold text-blue-700 uppercase mb-1">Next time</p>
                <p className="text-sm text-gray-800">{reflection.nextTime}</p>
              </div>

              <div className="p-4 bg-purple-50 rounded-lg border-l-4 border-purple-500">
                <p className="text-xs font-semibold text-purple-700 uppercase mb-1">Overall vibe</p>
                <p className="text-sm text-gray-800">{reflection.vibe}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full px-4 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg font-medium hover:from-green-700 hover:to-blue-700 transition-colors"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  )
}
