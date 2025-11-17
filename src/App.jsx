import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import { SessionProvider } from './contexts/SessionContext'

import AuthScreen from './components/auth/AuthScreen'
import Dashboard from './components/Dashboard'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading FocusFlow...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {user ? (
        <SessionProvider userId={user.id}>
          <Dashboard user={user} />
        </SessionProvider>
      ) : (
        <AuthScreen />
      )}
    </div>
  )
}

export default App
