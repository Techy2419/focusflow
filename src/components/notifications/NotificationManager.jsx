/**
 * Notification Manager
 * Manages multiple notifications with queue and deduplication
 */

import { useState, useCallback, useEffect } from 'react'
import DistractionAlert from './DistractionAlert'

export default function NotificationManager({ notifications = [] }) {
  const [activeNotifications, setActiveNotifications] = useState([])

  // Update active notifications when new ones come in
  useEffect(() => {
    if (notifications.length > 0) {
      // Get the latest notification
      const latest = notifications[notifications.length - 1]

      // Check if we already have this type in active notifications
      const existingIndex = activeNotifications.findIndex(n => n.type === latest.type)

      if (existingIndex === -1) {
        // Add new notification
        setActiveNotifications(prev => [...prev, { ...latest, id: Date.now() }])
      }
      // If already exists, don't add duplicate (prevents spam)
    }
  }, [notifications])

  const handleDismiss = useCallback((id) => {
    setActiveNotifications(prev => prev.filter(n => n.id !== id))
  }, [])

  return (
    <div className="fixed top-0 right-0 z-50 pointer-events-none">
      <div className="p-4 space-y-3">
        {activeNotifications.map((notification, index) => (
          <div
            key={notification.id}
            className="pointer-events-auto transform transition-all duration-300 ease-out"
            style={{
              opacity: 1 - (index * 0.15), // Fade older notifications
              transform: `scale(${1 - (index * 0.05)})` // Slightly shrink older ones
            }}
          >
            <DistractionAlert
              type={notification.type}
              onDismiss={() => handleDismiss(notification.id)}
              autoHideDuration={6000}
              enableSound={index === 0} // Only play sound for newest
            />
          </div>
        ))}
      </div>
    </div>
  )
}
