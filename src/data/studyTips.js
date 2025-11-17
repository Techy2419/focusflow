/**
 * Study tips and motivational messages for students
 * Shown during breaks to maximize learning effectiveness
 */

export const STUDY_TIPS = [
  {
    title: "The Pomodoro Technique Works!",
    tip: "You're doing it right! Studies show 25-minute focus sessions with 5-minute breaks improve retention by 25%.",
    emoji: "🍅"
  },
  {
    title: "Hydrate for Better Focus",
    tip: "Grab some water! Dehydration reduces cognitive performance by up to 30%. Your brain is 75% water!",
    emoji: "💧"
  },
  {
    title: "Move Your Body",
    tip: "Stand up and stretch! Physical movement increases blood flow to the brain and boosts creativity.",
    emoji: "🧘"
  },
  {
    title: "The 20-20-20 Rule",
    tip: "Every 20 minutes, look at something 20 feet away for 20 seconds. Your eyes will thank you!",
    emoji: "👁️"
  },
  {
    title: "Active Recall is King",
    tip: "After your break, try to recall what you just learned without looking. This strengthens memory formation.",
    emoji: "🧠"
  },
  {
    title: "Environment Matters",
    tip: "Study different subjects in different locations. Your brain associates places with information!",
    emoji: "🏠"
  },
  {
    title: "Sleep = Superpower",
    tip: "Your brain consolidates memories during sleep. Don't skip it for studying - you'll remember less!",
    emoji: "😴"
  },
  {
    title: "The Spacing Effect",
    tip: "Reviewing material over several days (not cramming) improves long-term retention by 200%!",
    emoji: "📅"
  },
  {
    title: "Teach to Learn",
    tip: "Try explaining what you learned to a friend (or rubber duck!). Teaching forces deep understanding.",
    emoji: "👥"
  },
  {
    title: "Music or Silence?",
    tip: "Classical music can help with math, but lyrics distract during reading. Choose wisely!",
    emoji: "🎵"
  },
  {
    title: "Break the Forgetting Curve",
    tip: "Review new material within 24 hours. You forget 50% of new info in just one day!",
    emoji: "📈"
  },
  {
    title: "Chunk Information",
    tip: "Your brain can hold 7±2 items in working memory. Break big concepts into smaller chunks!",
    emoji: "🧩"
  },
  {
    title: "Nutrition for Focus",
    tip: "Complex carbs (whole grains) provide steady energy. Avoid sugar crashes during study sessions!",
    emoji: "🥗"
  },
  {
    title: "The Testing Effect",
    tip: "Practice tests beat re-reading notes. Testing yourself strengthens memory pathways.",
    emoji: "✍️"
  },
  {
    title: "Interleaving Works",
    tip: "Mix up different topics/problems instead of blocking. It's harder but boosts retention!",
    emoji: "🔀"
  },
  {
    title: "Your Peak Performance Time",
    tip: "Most students focus best 2-4 hours after waking. Schedule tough subjects for your peak!",
    emoji: "⏰"
  },
  {
    title: "Digital Wellness",
    tip: "Blue light suppresses melatonin. Use night mode for evening study sessions!",
    emoji: "📱"
  },
  {
    title: "Growth Mindset",
    tip: "Struggling doesn't mean you're failing - it means you're learning! Your brain grows through challenge.",
    emoji: "🌱"
  },
  {
    title: "The Feynman Technique",
    tip: "Explain concepts in simple terms. If you can't, you don't truly understand it yet!",
    emoji: "💡"
  },
  {
    title: "Reward Yourself",
    tip: "Dopamine helps memory formation. Give yourself small rewards after completing tasks!",
    emoji: "🎁"
  }
]

export function getRandomStudyTip() {
  return STUDY_TIPS[Math.floor(Math.random() * STUDY_TIPS.length)]
}
