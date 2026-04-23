import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export const useAuthStore = create((set, get) => ({
  user: null,
  session: null,
  loading: true,

  init: async () => {
    // Garde-fou : si getSession() ne répond pas (ancien SW qui cache /auth/v1,
    // réseau mort, Supabase HS…), on débloque l'UI au bout de 6 s en mode
    // "déconnecté". L'utilisateur voit au moins l'écran de login au lieu
    // de rester coincé sur le splash "Chargement…".
    const SESSION_TIMEOUT_MS = 6000
    const timeoutPromise = new Promise((resolve) =>
      setTimeout(() => resolve({ __timeout: true }), SESSION_TIMEOUT_MS)
    )

    try {
      const result = await Promise.race([
        supabase.auth.getSession(),
        timeoutPromise,
      ])

      if (result.__timeout) {
        console.warn('[auth] getSession() timeout — démarrage en mode déconnecté')
        set({ session: null, user: null, loading: false })
      } else {
        const session = result?.data?.session ?? null
        set({
          session,
          user: session?.user ?? null,
          loading: false,
        })
      }
    } catch (err) {
      console.error('[auth] init error', err)
      set({ session: null, user: null, loading: false })
    }

    supabase.auth.onAuthStateChange((_event, session) => {
      set({
        session,
        user: session?.user ?? null,
      })
    })
  },

  signUp: async (email, password) => {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
    return data
  },

  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
    return data
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    set({ user: null, session: null })
  },

  setUser: (user) => set({ user }),

  refreshUser: async () => {
    const { data, error } = await supabase.auth.getUser()
    if (error) throw error
    set({ user: data.user ?? null })
    return data.user
  },
}))
