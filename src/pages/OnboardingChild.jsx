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
      // Vérification session
      const { data: sessionData } = await supabase.auth.getSession()
      const s = sessionData.session
      console.log('[ONBOARDING] Debug session:', JSON.stringify({
        has_session: !!s,
        user_id: s?.user?.id ?? null,
        email: s?.user?.email ?? null,
        has_access_token: !!s?.access_token,
      }, null, 2))

      if (!s) {
        throw new Error('Aucune session active. Reconnecte-toi.')
      }

      // 1. Créer la famille (trigger SQL associe le user ensuite)
      const { data: family, error: familyError } = await supabase
        .from('families')
        .insert({ name: `Famille de ${user.email.split('@')[0]}` })
        .select()
        .single()

      if (familyError) {
        console.error('[ONBOARDING] Erreur INSERT families (JSON):',
          JSON.stringify(familyError, null, 2))
        throw new Error(
          `${familyError.message || 'Erreur inconnue'}` +
          (familyError.code ? ` [code: ${familyError.code}]` : '') +
          (familyError.hint ? ` — ${familyError.hint}` : '') +
          (familyError.details ? ` (${familyError.details})` : '')
        )
      }

      console.log('[ONBOARDING] Famille créée :', family)

      // 2. Ajouter l'enfant
      const { error: childError } = await supabase.from('children').insert({
        family_id: family.id,
        first_name: firstName,
        birth_date: birthDate,
      })

      if (childError) {
        console.error('[ONBOARDING] Erreur INSERT children (JSON):',
          JSON.stringify(childError, null, 2))
        throw new Error(childError.message || 'Erreur lors de l\'ajout de l\'enfant.')
      }

      // Invalider les caches React Query pour que les hooks refetch la famille
      // (sinon RequireFamily continue à voir "pas de famille" et boucle ici)
      await queryClient.invalidateQueries({ queryKey: ['family'] })
      await queryClient.invalidateQueries({ queryKey: ['children'] })
      await queryClient.invalidateQueries({ queryKey: ['family-members'] })

      navigate('/onboarding/invite')
    } catch (err) {
      console.error('[ONBOARDING] Erreur complète (JSON):',
        JSON.stringify({
          message: err.message,
          code: err.code,
          hint: err.hint,
          details: err.details,
        }, null, 2))
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
