/**
 * Notification Hook
 * Manages notification state and deduplication
 */

import { useState, useCallback, useRef } from 'react'

export function useNotifications() {
  const [notifications, setNotifications] = useState([])
  const lastNotificationTime = useRef({})
  const COOLDOWN_MS = 3000 // 3 seconds cooldown per notification type

  const addNotification = useCallback((type, data = {}) => {
    const now = Date.now()
    const lastTime = lastNotificationTime.current[type] || 0

    // Check cooldown to prevent spam
    if (now - lastTime < COOLDOWN_MS) {
      return // Skip notification
    }

    // Update last notification time
    lastNotificationTime.current[type] = now

    // Add notification
    const notification = {
      type,
      timestamp: now,
      ...data
    }

    setNotifications(prev => [...prev, notification])

    console.log('📢 Notification:', type)
  }, [])

  const clearNotifications = useCallback(() => {
    setNotifications([])
    lastNotificationTime.current = {}
  }, [])

  return {
    notifications,
    addNotification,
    clearNotifications
  }
}
