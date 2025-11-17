/**
 * AI Intervention Component
 * Shows Gemini-powered personalized messages when distractions occur
 */

import { useState, useEffect } from 'react'
import { Sparkles, X, MessageCircle } from 'lucide-react'
import { generateInterventionLimited } from '../../lib/gemini'

export default function AIIntervention({
  distractionType,
  focusedMinutes,
  distractionCount,
  onDismiss,
  onResponse
}) {
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [tone, setTone] = useState('friendly')

  useEffect(() => {
    loadIntervention()
    // NOTE: focusedMinutes intentionally NOT in deps - it changes every second
    // and we don't want to regenerate the message constantly
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [distractionType, distractionCount, tone])

  const loadIntervention = async () => {
    setIsLoading(true)
    try {
      const interventionMessage = await generateInterventionLimited({
        distractionType,
        focusedMinutes,
        distractionCount,
        tone
      })
      setMessage(interventionMessage)
    } catch (error) {
      console.error('Failed to load AI intervention:', error)
      // Fallback message
      setMessage(getFallbackMessage())
    } finally {
      setIsLoading(false)
    }
  }

  const getFallbackMessage = () => {
    const messages = {
      phone_pickup: `Hey! Noticed you picked up your phone. You've been focused for ${focusedMinutes} mins - solid! Need a quick break?`,
      phone_near_left_ear: `Phone call on the left ear detected! Hope it's important. You were rocking ${focusedMinutes} mins of focus!`,
      phone_near_right_ear: `Phone call on the right ear detected! Quick call? You've been crushing it for ${focusedMinutes} mins!`,
      phone_in_front_of_face: `Scrolling time? Caught you with the phone in front! ${focusedMinutes} mins of focus so far though - nice!`,
      left_desk: `Looks like you stepped away. Take your time! Ready to jump back in?`,
      looking_away: `Your attention wandered a bit. ${focusedMinutes} minutes of focus so far - not bad! Everything okay?`,
      poor_posture: `Slouching detected! Sit up straight for better focus. You're ${focusedMinutes} minutes in - keep going!`
    }
    return messages[distractionType] || `Distraction detected. ${focusedMinutes} minutes focused so far!`
  }

  const handleResponse = (response) => {
    onResponse?.(response)
    onDismiss?.()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-slideUp">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500 to-blue-500 p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-white/20 rounded-lg">
                <Sparkles size={24} />
              </div>
              <h3 className="font-bold text-xl">FocusFlow AI</h3>
            </div>
            <button
              onClick={onDismiss}
              className="text-white/80 hover:text-white transition-colors"
              aria-label="Dismiss"
            >
              <X size={20} />
            </button>
          </div>
          <p className="text-sm text-white/90">Let's check in</p>
        </div>

        {/* Message Content */}
        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center gap-3 py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent"></div>
              <p className="text-gray-600">Generating personalized message...</p>
            </div>
          ) : (
            <>
              {/* AI Message */}
              <div className="mb-6">
                <div className="flex items-start gap-3 p-4 bg-purple-50 rounded-lg border border-purple-100">
                  <MessageCircle className="text-purple-500 flex-shrink-0 mt-1" size={20} />
                  <p className="text-gray-800 leading-relaxed">{message}</p>
                </div>
              </div>

              {/* Tone Selector */}
              <div className="mb-6">
                <p className="text-xs text-gray-500 mb-2">Message tone:</p>
                <div className="flex gap-2">
                  {['friendly', 'coach', 'sarcastic'].map((t) => (
                    <button
                      key={t}
                      onClick={() => setTone(t)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        tone === t
                          ? 'bg-primary text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {t === 'friendly' ? '🙂 Friendly' :
                       t === 'coach' ? '💪 Coach' :
                       '😏 Sarcastic'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Response Options */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700 mb-3">How do you want to respond?</p>

                <button
                  onClick={() => handleResponse('continue')}
                  className="w-full px-4 py-3 bg-success text-white rounded-lg font-medium hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                >
                  ✅ Back to work - let's do this!
                </button>

                <button
                  onClick={() => handleResponse('break')}
                  className="w-full px-4 py-3 bg-warning text-white rounded-lg font-medium hover:bg-yellow-600 transition-colors flex items-center justify-center gap-2"
                >
                  ☕ I need a 5-min break
                </button>

                <button
                  onClick={() => handleResponse('end_session')}
                  className="w-full px-4 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors flex items-center justify-center gap-2"
                >
                  ⏹️ End session for now
                </button>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-4">
          <p className="text-xs text-center text-gray-500">
            💡 Powered by Gemini AI • Your responses help us learn your patterns
          </p>
        </div>
      </div>
    </div>
  )
}
