import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { LogOut } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'

export default function OnboardingChild() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const signOut = useAuthStore((s) => s.signOut)
  const [firstName, setFirstName] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      if (!sessionData.session) {
        throw new Error('Aucune session active. Reconnecte-toi.')
      }

      const { data: family, error: familyError } = await supabase
        .from('families')
        .insert({ name: `Famille de ${user.email.split('@')[0]}` })
        .select()
        .single()
      if (familyError) throw familyError

      const { error: childError } = await supabase.from('children').insert({
        family_id: family.id,
        first_name: firstName,
        birth_date: birthDate,
      })
      if (childError) throw childError

      await queryClient.invalidateQueries({ queryKey: ['family'] })
      await queryClient.invalidateQueries({ queryKey: ['children'] })
      await queryClient.invalidateQueries({ queryKey: ['family-members'] })

      navigate('/onboarding/invite')
    } catch (err) {
      setError(err.message || 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
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
            Étape 1 sur 2
          </p>
          <h1 className="h-title">Ajoute ton premier enfant</h1>
          <p className="text-body-md text-on-surface-variant mt-2">
            Tu pourras en ajouter d'autres plus tard.
          </p>
          {user?.email && (
            <p className="text-caption text-on-surface-variant mt-3">
              Connecté en tant que <strong>{user.email}</strong>
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="card-elevated p-lg space-y-md">
          <div>
            <label className="label" htmlFor="firstName">Prénom</label>
            <input
              id="firstName"
              type="text"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="input"
            />
          </div>

          <div>
            <label className="label" htmlFor="birthDate">Date de naissance</label>
            <input
              id="birthDate"
              type="date"
              required
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className="input"
            />
          </div>

          {error && (
            <div className="text-body-md text-on-error-container bg-error-container rounded-md p-3 whitespace-pre-wrap">
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Enregistrement…' : 'Continuer'}
          </button>
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
