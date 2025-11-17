/**
 * AI Intervention Hook
 * Manages when to show AI interventions based on distraction patterns
 */

import { useState, useCallback, useRef } from 'react'

export function useAIIntervention() {
  const [showIntervention, setShowIntervention] = useState(false)
  const [currentDistraction, setCurrentDistraction] = useState(null)
  const lastInterventionTime = useRef(0)
  // 1 minute cooldown to manage API calls (max 15/min, 200/day)
  const INTERVENTION_COOLDOWN = 60000 // 60 seconds cooldown

  /**
   * Decide whether to show AI intervention for this distraction
   * Not all distractions trigger interventions - only significant ones
   */
  const shouldShowIntervention = useCallback((distractionType, distractionCount) => {
    const now = Date.now()
    const timeSinceLastIntervention = now - lastInterventionTime.current

    // Don't show if within cooldown period
    if (timeSinceLastIntervention < INTERVENTION_COOLDOWN) {
      return false
    }

    // Show intervention rules:
    // 1. Phone detection always triggers (high priority distraction)
    // 2. Left desk triggers after 2nd occurrence
    // 3. Looking away triggers after 3rd occurrence
    // 4. Poor posture triggers after 5th occurrence

    const thresholds = {
      phone_pickup: 1,
      phone_near_left_ear: 1,
      phone_near_right_ear: 1,
      phone_in_front_of_face: 1,
      left_desk: 2,
      looking_away: 3,
      poor_posture: 5
    }

    const threshold = thresholds[distractionType] || 2

    return distractionCount >= threshold
  }, [])

  /**
   * Trigger an AI intervention
   */
  const triggerIntervention = useCallback((distractionData) => {
    if (shouldShowIntervention(distractionData.type, distractionData.count)) {
      setCurrentDistraction(distractionData)
      setShowIntervention(true)
      lastInterventionTime.current = Date.now()
    }
  }, [shouldShowIntervention])

  /**
   * Dismiss the intervention
   */
  const dismissIntervention = useCallback(() => {
    setShowIntervention(false)
    setCurrentDistraction(null)
  }, [])

  /**
   * Handle user response to intervention
   */
  const handleResponse = useCallback((response, onAction) => {
    console.log('User responded to intervention:', response)

    // Trigger appropriate action based on response
    if (onAction) {
      onAction(response)
    }

    dismissIntervention()
  }, [dismissIntervention])

  return {
    showIntervention,
    currentDistraction,
    triggerIntervention,
    dismissIntervention,
    handleResponse
  }
}
