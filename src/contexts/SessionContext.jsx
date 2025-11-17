import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { db } from '../lib/supabase'
import { calculateFocusScore } from '../lib/utils'

const SessionContext = createContext(null)

export function SessionProvider({ children, userId }) {
  const [currentSession, setCurrentSession] = useState(null)
  const [isActive, setIsActive] = useState(false)
  const [isPaused, setIsPaused] = useState(false) // Break/pause state
  const [breakTimeRemaining, setBreakTimeRemaining] = useState(0) // seconds remaining in break
  const [elapsed, setElapsed] = useState(0) // seconds
  const [focusedTime, setFocusedTime] = useState(0) // seconds
  const [distractions, setDistractions] = useState([])
  const [isCurrentlyDistracted, setIsCurrentlyDistracted] = useState(false) // Track current distraction state
  const [lastDistractionTime, setLastDistractionTime] = useState(0) // Prevent spam logging

  
  const startSession = useCallback(async (goal = '', aiWarmup = '') => {
    try {
      const { data, error } = await db.createSession({
        user_id: userId,
        start_time: new Date().toISOString(),
        session_goal: goal,
        ai_warmup: aiWarmup,
        distraction_count: 0
      })

      if (error) throw error

      setCurrentSession(data)
      setIsActive(true)
      setElapsed(0)
      setFocusedTime(0)
      setDistractions([])
      setIsCurrentlyDistracted(false)
      setLastDistractionTime(0)

      return data
    } catch (error) {
      console.error('Failed to start session:', error)
      throw error
    }
  }, [userId])

  
  const endSession = useCallback(async (userProfile) => {
    if (!currentSession) return

    try {
      const totalMinutes = Math.floor(elapsed / 60)
      const focusedMinutes = Math.floor(focusedTime / 60)
      const focusScore = calculateFocusScore(focusedMinutes, totalMinutes, distractions.length)

      // Update session
      const { error } = await db.updateSession(currentSession.id, {
        end_time: new Date().toISOString(),
        total_minutes: totalMinutes,
        focused_minutes: focusedMinutes,
        distraction_count: distractions.length,
        focus_score: focusScore
      })

      if (error) throw error

      // Return session data for UI
      const sessionResult = {
        id: currentSession.id,
        totalMinutes,
        focusedMinutes,
        distractionCount: distractions.length,
        focusScore
      }

      setIsActive(false)
      setCurrentSession(null)

      return sessionResult
    } catch (error) {
      console.error('Failed to end session:', error)
      throw error
    }
  }, [currentSession, elapsed, focusedTime, distractions])

  
  const logDistraction = useCallback(async (type, details = {}) => {
    if (!currentSession) {
      console.error('❌ SessionContext: No currentSession! Cannot log distraction')
      return
    }

    const now = Date.now()
    const timeSinceLastDistraction = now - lastDistractionTime

    // debounce distractions (3s min)
    // prevents spam logging
    const lastDistraction = distractions[distractions.length - 1]
    if (lastDistraction && lastDistraction.type === type && timeSinceLastDistraction < 3000) {
      // update flag only
      setIsCurrentlyDistracted(true)
      return
    }

    const distraction = {
      type,
      timestamp: new Date().toISOString(),
      ...details
    }

    try {
      // build event data
      const eventData = {
        session_id: currentSession.id,
        type: 'distraction',
        app_name: details.appName || type
      }

      // add response if exists
      if (details.response) {
        eventData.user_response = details.response
      }

      await db.logEvent(eventData)

      setDistractions(prev => [...prev, distraction])
      setIsCurrentlyDistracted(true)
      setLastDistractionTime(now)
    } catch (error) {
      console.error('Failed to log distraction:', error)
    }
  }, [currentSession, distractions, lastDistractionTime])

  
  const pauseSession = useCallback((breakDuration = 300) => { // default 5 min = 300 seconds
    if (!isActive || isPaused) return

    setIsPaused(true)
    setBreakTimeRemaining(breakDuration)
  }, [isActive, isPaused])

  
  const resumeSession = useCallback(() => {
    if (!isPaused) return

    setIsPaused(false)
    setBreakTimeRemaining(0)
  }, [isPaused])

  
  const updateFocusedTime = useCallback((seconds) => {
    setFocusedTime(prev => prev + seconds)
  }, [])

  
  useEffect(() => {
    if (!isActive || isPaused) return // Don't count time during breaks

    const interval = setInterval(() => {
      setElapsed(prev => prev + 1)

      // only count focused time if not distracted
      if (!isCurrentlyDistracted) {
        setFocusedTime(prev => prev + 1)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [isActive, isPaused, isCurrentlyDistracted])

  
  useEffect(() => {
    if (!isPaused || breakTimeRemaining <= 0) return

    const interval = setInterval(() => {
      setBreakTimeRemaining(prev => {
        if (prev <= 1) {
          // auto resume
          setIsPaused(false)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isPaused, breakTimeRemaining])

  
  useEffect(() => {
    if (!isCurrentlyDistracted) return

    const timeout = setTimeout(() => {
      setIsCurrentlyDistracted(false)
    }, 5000) // 5 seconds

    return () => clearTimeout(timeout)
  }, [isCurrentlyDistracted, lastDistractionTime])

  
  const currentFocusScore = useCallback(() => {
    if (elapsed === 0) return 100

    const totalMinutes = Math.max(1, Math.floor(elapsed / 60))
    const focusedMinutes = Math.floor(focusedTime / 60)

    return calculateFocusScore(focusedMinutes, totalMinutes, distractions.length)
  }, [elapsed, focusedTime, distractions])

  
  const getDistractionCount = useCallback((type) => {
    return distractions.filter(d => d.type === type).length
  }, [distractions])

  const value = {
    // State
    currentSession,
    isActive,
    isPaused,
    breakTimeRemaining,
    elapsed,
    focusedTime,
    distractions,
    focusScore: currentFocusScore(),

    // Actions
    startSession,
    endSession,
    pauseSession,
    resumeSession,
    logDistraction,
    updateFocusedTime,
    getDistractionCount
  }

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  )
}

export function useSession() {
  const context = useContext(SessionContext)
  if (!context) {
    throw new Error('useSession must be used within SessionProvider')
  }
  return context
}
