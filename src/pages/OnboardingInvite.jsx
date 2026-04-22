import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { LogOut } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'

export default function OnboardingInvite() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const signOut = useAuthStore((s) => s.signOut)
  const [email, setEmail] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const goToDashboard = async () => {
    // Forcer le refetch de la famille pour éviter que RequireFamily redirige
    await queryClient.invalidateQueries({ queryKey: ['family'] })
    await queryClient.invalidateQueries({ queryKey: ['children'] })
    await queryClient.invalidateQueries({ queryKey: ['family-members'] })
    navigate('/', { replace: true })
  }

  const handleInvite = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const { error: fnError } = await supabase.functions.invoke(
        'invite-parent',
        { body: { email } }
      )

      if (fnError) throw fnError

      await goToDashboard()
    } catch (err) {
      setError(err.message || 'Une erreur est survenue.')
    } finally {
      setLoading(false)
    }
  }

  const handleSkip = () => {
    goToDashboard()
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/signin', { replace: true })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-lg">
          <p className="text-caption text-on-surface-variant uppercase tracking-wide mb-1">
            Étape 2 sur 2
          </p>
          <h1 className="h-title">
            Inviter l'autre parent
          </h1>
          <p className="text-body-md text-on-surface-variant mt-2">
            Optionnel. Tu peux l'inviter maintenant ou plus tard depuis ton profil.
          </p>
        </div>

        <form onSubmit={handleInvite} className="card-elevated p-lg space-y-md">
          <div>
            <label className="label" htmlFor="email">Email de l'autre parent</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              placeholder="parent@exemple.fr"
            />
          </div>

          {error && (
            <div className="text-body-md text-on-error-container bg-error-container rounded-md p-3">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <button
              type="submit"
              disabled={loading || !email}
              className="btn-primary w-full"
            >
              {loading ? 'Envoi…' : 'Envoyer l\'invitation'}
            </button>
            <button
              type="button"
              onClick={handleSkip}
              className="btn-ghost w-full"
            >
              Passer pour l'instant
            </button>
          </div>
        </form>

        <button
          onClick={handleSignOut}
          className="mt-md w-full inline-flex items-center justify-center gap-2 text-label-sm text-on-surface-variant hover:text-error transition-colors"
        >
          <LogOut size={16} strokeWidth={2} />
          Se déconnecter
        </button>
      </div>
    </div>
  )
}
