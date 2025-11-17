import { useState } from 'react'
import { auth } from '../../lib/supabase'

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      if (isLogin) {
        const { error } = await auth.signIn(email, password)
        if (error) throw error
      } else {
        // Sign up with name as metadata
        const { data, error } = await auth.signUp(email, password, {
          first_name: firstName,
          last_name: lastName,
          username: `${firstName} ${lastName}`.trim()
        })

        if (error) throw error

        console.log('Signup successful:', data)
        setSuccess('Check your email to verify your account!')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        {/* Logo and branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-primary rounded-2xl mb-3">
            <img
              src="/focusflow.svg"
              alt="FocusFlow logo"
              className="w-16 h-16"
              loading="lazy"
            />
          </div>
          <h1 className="text-4xl font-bold gradient-text mb-2">FocusFlow</h1>
          <p className="text-gray-600">Your AI study buddy that makes focusing feel like winning</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus-ring"
                  placeholder="John"
                  required={!isLogin}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus-ring"
                  placeholder="Doe"
                  required={!isLogin}
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus-ring"
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus-ring"
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Loading...' : (isLogin ? 'Sign In' : 'Sign Up')}
          </button>
        </form>

        {/* Toggle between login and signup */}
        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin)
              setError(null)
              setSuccess(null)
            }}
            className="text-primary hover:underline font-medium"
          >
            {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
          </button>
        </div>

        {/* Features */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center mb-3">What you'll get:</p>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <span className="text-success">✓</span>
              <span>Camera AI that detects distractions</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-success">✓</span>
              <span>Gamified study sessions with XP & levels</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-success">✓</span>
              <span>Weekly boss battles & achievements</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-success">✓</span>
              <span>Real-time leaderboards</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
