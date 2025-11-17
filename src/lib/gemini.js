import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY)
// Use gemini-2.0-flash (stable production model)
// Free tier limits: 15 RPM (requests per minute), 1M TPM (tokens per minute), 200 RPD (requests per day)
// More reliable than the experimental gemini-2.0-flash-exp model
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

// Video Classification
export async function classifyVideo(title, channel, description = '') {
  const prompt = `
You are a study assistant. Classify if this YouTube video is educational or entertainment.

Title: "${title}"
Channel: "${channel}"
Description: "${description.slice(0, 200)}"

Respond in JSON only:
{
  "classification": "educational" | "entertainment" | "ambiguous",
  "confidence": 0.0-1.0,
  "reason": "brief explanation"
}
  `.trim()

  try {
    const result = await model.generateContent(prompt)
    const text = result.response.text()

    // Strip markdown if present
    const jsonText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

    return JSON.parse(jsonText)
  } catch (error) {
    console.error('Gemini classification error:', error)
    return {
      classification: 'ambiguous',
      confidence: 0.5,
      reason: 'Error occurred'
    }
  }
}

// Friendly, Motivating Intervention (Study Buddy Vibe)
export async function generateIntervention(context) {
  const {
    distractionType,
    focusedMinutes,
    distractionCount,
    tone = 'friendly'
  } = context

  const toneGuides = {
    friendly: 'warm, supportive study buddy - encouraging and casual',
    coach: 'motivating gym buddy - energetic and pumped up',
    sarcastic: 'playful friend - witty but supportive'
  }

  const distractionContext = {
    phone_pickup: 'picked up their phone',
    phone_near_left_ear: 'took a phone call',
    phone_near_right_ear: 'took a phone call',
    phone_in_front_of_face: 'started looking at their phone',
    left_desk: 'stepped away from their desk',
    looking_away: 'attention wandered away',
    poor_posture: 'posture needs adjustment'
  }

  const prompt = `You are FocusFlow AI - a supportive study companion that helps students stay focused without being preachy.

Context:
- What happened: Student ${distractionContext[distractionType] || 'got distracted'}
- Time focused before this: ${focusedMinutes} minutes
- Distractions so far: ${distractionCount}
- Message tone: ${toneGuides[tone]}

Your goal: Create a brief intervention message (25-35 words) that feels personal and supportive.

Message structure:
1. Acknowledge what happened (no judgment)
2. Recognize their effort so far (be specific about ${focusedMinutes} mins)
3. Give them a gentle choice to refocus OR take a break

Guidelines:
- Sound like a friend checking in, NOT a parent scolding
- Be specific about their progress (use the actual numbers)
- Keep it conversational and authentic
- Use 1-2 emojis max (not every sentence)
- Vary your language - don't be repetitive
- If ${distractionCount} is high (3+), acknowledge it's been tough today

Examples of EXCELLENT interventions:

Friendly tone (phone pickup, 15 mins, 2 distractions):
"📱 Hey - noticed your phone came up. You've been crushing it for 15 minutes though! Want to keep the momentum going or need a quick breather?"

Coach tone (looking away, 8 mins, 1 distraction):
"💪 Quick focus check! You were locked in for 8 solid minutes. Let's push for 5 more and THEN celebrate. You got this!"

Sarcastic tone (phone pickup, 23 mins, 4 distractions):
"😏 Phone again? At least you made it 23 minutes this time - that's actually pretty good! Ready to beat your record or calling it quits?"

Respond with ONLY the intervention message, nothing else.`.trim()

  try {
    const result = await model.generateContent(prompt)
    return result.response.text().trim()
  } catch (error) {
    // Only log non-quota errors (quota errors already logged by rate limiter)
    if (!error.message?.includes('QUOTA_EXCEEDED_SKIP') && !error.message?.includes('429')) {
      console.error('Gemini intervention error:', error)
    }

    // Fallback messages - friendly study buddy vibe
    const fallbacks = {
      phone_pickup: `👀 Quick check — looks like your phone popped up. You've been focused for ${focusedMinutes} mins. Want to stay locked in? You got this!`,
      phone_near_left_ear: `📞 Phone call detected! Hope it's important. You were crushing it for ${focusedMinutes} mins — ready to jump back in?`,
      phone_near_right_ear: `📱 Quick call? No worries! You've been doing great for ${focusedMinutes} mins. Let's keep the momentum going 💪`,
      phone_in_front_of_face: `🧠 Focus Mode Reminder! Caught you scrolling — ${focusedMinutes} mins of solid focus so far. Ready to refocus?`,
      left_desk: `✨ Looks like you stepped away. Take your time! Ready to get back in the zone?`,
      looking_away: `📚 Let's keep the momentum! Your attention wandered for a sec — ${focusedMinutes} mins focused so far. You're doing great!`,
      social_media: `🔥 Stay with it! Social media can wait — you had ${focusedMinutes} mins of awesome focus. Keep going!`
    }

    return fallbacks[distractionType] || fallbacks.phone_pickup
  }
}

// Weekly Insights
export async function generateWeeklyInsights(weekData) {
  const {
    totalMinutes,
    avgFocusScore,
    lastWeekScore,
    bestDay,
    worstDay,
    topDistraction,
    distractionMinutes
  } = weekData

  const prompt = `
Analyze this student's focus patterns for the week:

- Total study time: ${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m
- Average focus: ${avgFocusScore}% (last week: ${lastWeekScore}%)
- Best day: ${bestDay?.day || 'N/A'} (${bestDay?.score || 0}% focus)
- Worst day: ${worstDay?.day || 'N/A'} (${worstDay?.score || 0}% focus)
- Top distraction: ${topDistraction} (${distractionMinutes} mins total)

Generate a short insight (max 80 words) that:
1. Highlights what they did well
2. Identifies one specific pattern
3. Suggests one concrete improvement

Be encouraging but honest. Use simple language.

Respond with ONLY the insight text.
  `.trim()

  try {
    const result = await model.generateContent(prompt)
    return result.response.text().trim()
  } catch (error) {
    console.error('Gemini insights error:', error)
    return `You studied ${Math.floor(totalMinutes / 60)} hours this week! Your focus improved by ${avgFocusScore - lastWeekScore}%. Keep up the momentum!`
  }
}

// Rate limiting wrapper with quota handling
let lastCallTime = 0
let quotaExceeded = false
let quotaResetTime = 0
const MIN_INTERVAL = 1000 // 1 request per second

async function rateLimitedCall(fn) {
  const now = Date.now()

  // If quota exceeded, skip API calls until reset time
  if (quotaExceeded && now < quotaResetTime) {
    throw new Error('QUOTA_EXCEEDED_SKIP')
  }

  // Reset quota flag if enough time has passed
  if (quotaExceeded && now >= quotaResetTime) {
    quotaExceeded = false
    console.log('✅ Gemini quota reset - resuming API calls')
  }

  const timeSinceLastCall = now - lastCallTime

  if (timeSinceLastCall < MIN_INTERVAL) {
    await new Promise(resolve =>
      setTimeout(resolve, MIN_INTERVAL - timeSinceLastCall)
    )
  }

  lastCallTime = Date.now()

  try {
    return await fn()
  } catch (error) {
    // Detect 429 quota errors
    if (error.message?.includes('429') || error.message?.includes('quota')) {
      quotaExceeded = true
      quotaResetTime = now + (60 * 1000) // Wait 1 minute before retry
      console.warn('⚠️ Gemini API quota exceeded - falling back to static messages for 1 minute')
      throw error
    }
    throw error
  }
}

// Export rate-limited versions
export const classifyVideoLimited = (title, channel, desc) =>
  rateLimitedCall(() => classifyVideo(title, channel, desc))

export const generateInterventionLimited = (context) =>
  rateLimitedCall(() => generateIntervention(context))
