/**
 * Impact Card - Shows visible proof of behavior change
 * Critical for hackathon "Impact" scoring
 */

import { useState, useEffect } from 'react'
import { Flame, TrendingUp, Target } from 'lucide-react'
import { db } from '../../lib/supabase'

export default function ImpactCard({ userId, currentSession }) {
  const [stats, setStats] = useState({
    currentStreak: 0,
    todayFocused: 0,
    todayDistractions: 0,
    yesterdayFocused: 0,
    improvement: 0
  })

  // Load stats once on mount and when userId changes
  useEffect(() => {
    if (userId) {
      loadStats()
    }
  }, [userId]) // Removed currentSession to prevent constant reloading!

  // Update ONLY the current streak in real-time (no API calls)
  useEffect(() => {
    if (currentSession?.focusedTime) {
      const newStreak = Math.floor(currentSession.focusedTime / 60)
      setStats(prev => ({ ...prev, currentStreak: newStreak }))
    }
  }, [currentSession?.focusedTime])

  async function loadStats() {
    try {

      // Get today's sessions
      const today = new Date().toISOString().split('T')[0]
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]

      const { data: todaySessions, error: fetchError } = await db.getUserSessions(userId, 100)

      if (fetchError || !todaySessions) {
        console.error('Impact Card: Error fetching sessions:', fetchError)
        return
      }

      // Filter today and yesterday
      const todayData = todaySessions.filter(s => s.start_time?.startsWith(today))
      const yesterdayData = todaySessions.filter(s => s.start_time?.startsWith(yesterday))

      // Calculate today's totals (ALL sessions today)
      const todayFocused = todayData.reduce((sum, s) => sum + (s.focused_minutes || 0), 0)
      const todayDistractions = todayData.reduce((sum, s) => sum + (s.distraction_count || 0), 0)

      // Calculate yesterday's focused time (ALL sessions yesterday)
      const yesterdayFocused = yesterdayData.reduce((sum, s) => sum + (s.focused_minutes || 0), 0)

      // Calculate current streak (phone-free time in CURRENT session only)
      const currentStreak = currentSession?.focusedTime
        ? Math.floor(currentSession.focusedTime / 60)
        : 0

      // Calculate improvement (today vs yesterday TOTAL)
      const improvement = todayFocused - yesterdayFocused

      setStats({
        currentStreak,
        todayFocused,
        todayDistractions,
        yesterdayFocused,
        improvement
      })
    } catch (error) {
      console.error('Failed to load impact stats:', error)
    }
  }

  const getImprovementText = () => {
    if (stats.improvement > 0) {
      return `+${stats.improvement} min vs yesterday`
    } else if (stats.improvement < 0) {
      return `${stats.improvement} min vs yesterday`
    } else {
      return 'Same as yesterday'
    }
  }

  const getImprovementColor = () => {
    if (stats.improvement > 0) return 'text-green-600'
    if (stats.improvement < 0) return 'text-red-600'
    return 'text-gray-600'
  }

  return (
    <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl shadow-lg p-4 border-2 border-orange-200">
      <div className="flex items-center gap-2 mb-3">
        <Target className="text-orange-600" size={18} />
        <h3 className="font-semibold text-gray-900">Your Impact</h3>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Current Session Streak */}
        <div>
          <div className="flex items-center gap-1 mb-1">
            <Flame className="text-orange-500" size={16} />
            <p className="text-xs font-medium text-gray-600 uppercase">This Session</p>
          </div>
          <div className="flex items-baseline gap-1">
            <p className="text-3xl font-bold text-orange-600">{stats.currentStreak}</p>
            <p className="text-sm text-gray-600">min</p>
          </div>
          <p className="text-xs text-gray-500">phone-free now</p>
        </div>

        {/* Today's Total Stats (ALL sessions) */}
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-gray-600 uppercase mb-2">Today Total</p>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-700">Focused:</span>
              <span className="text-sm font-bold text-gray-900">{stats.todayFocused} min</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-700">Distractions:</span>
              <span className="text-sm font-bold text-gray-900">{stats.todayDistractions}</span>
            </div>
          </div>
        </div>

        {/* Improvement vs Yesterday (Total) */}
        <div>
          <div className="flex items-center gap-1 mb-2">
            <TrendingUp size={14} className={getImprovementColor()} />
            <span className="text-xs font-medium text-gray-600 uppercase">vs Yesterday</span>
          </div>
          <span className={`text-lg font-bold ${getImprovementColor()}`}>
            {getImprovementText()}
          </span>
          <p className="text-xs text-gray-500 mt-1">all sessions</p>
        </div>
      </div>
    </div>
  )
}
