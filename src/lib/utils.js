import { clsx } from 'clsx'

// Class name utility
export function cn(...inputs) {
  return clsx(inputs)
}

// Format time helper
export function formatTime(seconds) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

// Format duration (minutes to readable format)
export function formatDuration(minutes) {
  if (minutes < 60) {
    return `${minutes}m`
  }
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
}

// Throttle function
export function throttle(func, wait) {
  let timeout = null
  let previous = 0

  return function executedFunction(...args) {
    const now = Date.now()
    const remaining = wait - (now - previous)

    if (remaining <= 0 || remaining > wait) {
      if (timeout) {
        clearTimeout(timeout)
        timeout = null
      }
      previous = now
      func.apply(this, args)
    } else if (!timeout) {
      timeout = setTimeout(() => {
        previous = Date.now()
        timeout = null
        func.apply(this, args)
      }, remaining)
    }
  }
}

// Debounce function
export function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

// Calculate focus score
export function calculateFocusScore(focusedMinutes, totalMinutes, distractionCount) {
  if (totalMinutes === 0) return 100

  const timeScore = (focusedMinutes / totalMinutes) * 100
  const distractionPenalty = Math.min(distractionCount * 5, 30) // Max 30 point penalty

  return Math.max(0, Math.round(timeScore - distractionPenalty))
}

// Get time of day greeting
export function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 5) return 'Burning the midnight oil'
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  if (hour < 22) return 'Good evening'
  return 'Late night grind'
}

// Format date to relative time
export function formatRelativeTime(date) {
  const now = new Date()
  const then = new Date(date)
  const diffMs = now - then
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return then.toLocaleDateString()
}

// Get rank suffix (1st, 2nd, 3rd, etc.)
export function getRankSuffix(rank) {
  const j = rank % 10
  const k = rank % 100
  if (j === 1 && k !== 11) return `${rank}st`
  if (j === 2 && k !== 12) return `${rank}nd`
  if (j === 3 && k !== 13) return `${rank}rd`
  return `${rank}th`
}

// Validate email
export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

// Play sound
export function playSound(soundName) {
  try {
    const audio = new Audio(`/sounds/${soundName}.mp3`)
    audio.volume = 0.5
    audio.play().catch(err => console.log('Audio play failed:', err))
  } catch (err) {
    console.log('Audio error:', err)
  }
}

// Show browser notification
export async function showNotification(title, options = {}) {
  if (!('Notification' in window)) {
    console.log('Notifications not supported')
    return
  }

  if (Notification.permission === 'granted') {
    new Notification(title, {
      icon: '/logo.png',
      badge: '/logo.png',
      ...options
    })
  } else if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission()
    if (permission === 'granted') {
      new Notification(title, {
        icon: '/logo.png',
        badge: '/logo.png',
        ...options
      })
    }
  }
}

// Local storage helpers
export const storage = {
  get: (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue
    } catch {
      return defaultValue
    }
  },
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (err) {
      console.error('Storage error:', err)
    }
  },
  remove: (key) => {
    try {
      localStorage.removeItem(key)
    } catch (err) {
      console.error('Storage error:', err)
    }
  }
}
