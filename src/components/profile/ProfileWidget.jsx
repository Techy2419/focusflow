// profile dropdown with avatar and user info

import { useState, useRef, useEffect } from 'react'
import { LogOut, User } from 'lucide-react'
import { auth } from '../../lib/supabase'

const AVATAR_GRADIENTS = [
  'from-purple-400 to-pink-600',
  'from-blue-400 to-cyan-600',
  'from-green-400 to-teal-600',
  'from-orange-400 to-red-600',
  'from-indigo-400 to-purple-600',
  'from-yellow-400 to-orange-600',
  'from-pink-400 to-rose-600',
  'from-cyan-400 to-blue-600'
]

function getAvatarGradient(email) {
  const hash = email.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return AVATAR_GRADIENTS[hash % AVATAR_GRADIENTS.length]
}

function getInitials(profile) {
  if (profile?.first_name && profile?.last_name) {
    return (profile.first_name[0] + profile.last_name[0]).toUpperCase()
  }
  if (profile?.first_name) {
    return profile.first_name.slice(0, 2).toUpperCase()
  }
  if (profile?.username) {
    const parts = profile.username.trim().split(' ')
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    }
    return profile.username.slice(0, 2).toUpperCase()
  }
  return (profile?.email || 'US').slice(0, 2).toUpperCase()
}

export default function ProfileWidget({ userProfile }) {
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef(null)

  const gradient = getAvatarGradient(userProfile?.email || 'default@email.com')
  const initials = getInitials(userProfile)

  // close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function handleSignOut() {
    await auth.signOut()
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold text-sm shadow-md`}>
          {initials}
        </div>
      </button>

      {showMenu && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
          <div className="px-4 py-3 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold shadow-md`}>
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {userProfile?.first_name
                    ? `${userProfile.first_name}${userProfile.last_name ? ' ' + userProfile.last_name : ''}`
                    : userProfile?.username || 'User'}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {userProfile?.email}
                </p>
              </div>
            </div>
          </div>

          <div className="px-4 py-3 border-b border-gray-200">
            <div className="grid grid-cols-2 gap-2 text-center">
              <div>
                <p className="text-xs text-gray-500">Sessions</p>
                <p className="text-lg font-bold text-gray-900">{userProfile?.total_sessions || 0}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Study Time</p>
                <p className="text-lg font-bold text-gray-900">
                  {Math.floor((userProfile?.total_study_minutes || 0) / 60)}h
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={handleSignOut}
            className="w-full px-4 py-2 text-left flex items-center gap-2 hover:bg-gray-50 text-red-600 hover:text-red-700 transition-colors"
          >
            <LogOut size={16} />
            <span className="text-sm font-medium">Sign Out</span>
          </button>
        </div>
      )}
    </div>
  )
}
