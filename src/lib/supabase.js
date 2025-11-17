import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

// Auth helper functions - exported both as named exports and in auth object
export const signUp = (email, password, metadata = {}) =>
  supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata // user_metadata that trigger can access
    }
  })

export const signIn = (email, password) =>
  supabase.auth.signInWithPassword({ email, password })

export const signOut = () =>
  supabase.auth.signOut()

export const getUser = () =>
  supabase.auth.getUser()

export const getSession = () =>
  supabase.auth.getSession()

// Grouped auth object
export const auth = {
  signUp,
  signIn,
  signOut,
  getUser,
  getSession
}

export const db = {
  // User operations
  getProfile: (userId) =>
    supabase.from('users').select('*').eq('id', userId).single(),

  updateProfile: async (userId, data) => {
    const result = await supabase.from('users').upsert(
      { id: userId, ...data },
      { onConflict: 'id', ignoreDuplicates: false }
    )
    console.log('updateProfile result:', result)
    return result
  },

  createProfile: (userId, data) =>
    supabase.from('users').insert({ id: userId, ...data }),

  // Session operations
  createSession: (data) =>
    supabase.from('sessions').insert(data).select().single(),

  updateSession: (id, data) =>
    supabase.from('sessions').update(data).eq('id', id),

  getSessionById: (id) =>
    supabase.from('sessions').select('*').eq('id', id).single(),

  getUserSessions: (userId, limit = 10) =>
    supabase
      .from('sessions')
      .select('*')
      .eq('user_id', userId)
      .order('start_time', { ascending: false })
      .limit(limit),

  // Event operations
  logEvent: (data) =>
    supabase.from('events').insert(data),

  getSessionEvents: (sessionId) =>
    supabase
      .from('events')
      .select('*')
      .eq('session_id', sessionId)
      .order('timestamp', { ascending: true }),

  // Challenge operations (for 1v1 friend battles)
  createChallenge: (data) =>
    supabase.from('challenges').insert(data).select().single(),

  getChallenge: (id) =>
    supabase.from('challenges').select('*').eq('id', id).single(),

  joinChallenge: (challengeId, opponentId, sessionId) =>
    supabase
      .from('challenges')
      .update({
        opponent_id: opponentId,
        opponent_session_id: sessionId,
        status: 'active',
        started_at: new Date().toISOString()
      })
      .eq('id', challengeId),

  endChallenge: (challengeId, winnerId) =>
    supabase
      .from('challenges')
      .update({
        status: 'completed',
        winner_id: winnerId,
        ended_at: new Date().toISOString()
      })
      .eq('id', challengeId)
}
