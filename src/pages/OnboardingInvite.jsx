import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { Check, Copy, LogOut } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'

export default function OnboardingInvite() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const signOut = useAuthStore((s) => s.signOut)
  const [email, setEmail] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null) // { emailSent, inviteUrl, warning }
  const [copied, setCopied] = useState(false)

  const goToDashboard = async () => {
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
      const { data, error: fnError } = await supabase.functions.invoke(
        'invite-parent',
        { body: { email } },
      )
      if (fnError) throw fnError
      setResult(data)
    } catch (err) {
      // Quand la fonction renvoie un body JSON avec { error, inviteUrl },
      // supabase-js le met dans err.context.response.text()
      const fallback = err?.message || 'Une erreur est survenue.'
      setError(fallback)
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async () => {
    if (!result?.inviteUrl) return
    try {
      await navigator.clipboard.writeText(result.inviteUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Navigateurs sans clipboard API : fallback silencieux
    }
  }

  const handleSkip = () => goToDashboard()

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
          <h1 className="h-title">Inviter l'autre parent</h1>
          <p className="text-body-md text-on-surface-variant mt-2">
            Optionnel. Tu peux l'inviter maintenant ou plus tard depuis ton profil.
          </p>
        </div>

        {result ? (
          <div className="card-elevated p-lg space-y-md">
            <div className="flex items-start gap-sm">
              <div className="mt-0.5 h-10 w-10 shrink-0 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container">
                <Check size={20} strokeWidth={2.5} />
              </div>
              <div>
                <h2 className="h-section text-h3">
                  {result.emailSent ? 'Invitation envoyée' : 'Invitation créée'}
                </h2>
                <p className="text-body-md text-on-surface-variant mt-1">
                  {result.emailSent
                    ? `Un email a été envoyé à ${email}. Le lien est valide 7 jours.`
                    : "L'email n'a pas pu être envoyé automatiquement. Partage ce lien directement avec l'autre parent."}
                </p>
              </div>
            </div>

            {!result.emailSent && result.inviteUrl && (
              <div className="space-y-1">
                <label className="label">Lien d'invitation</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={result.inviteUrl}
                    className="input text-caption"
                    onFocus={(e) => e.target.select()}
                  />
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="btn-secondary !px-3 shrink-0 inline-flex items-center gap-1"
                    aria-label="Copier le lien"
                  >
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={goToDashboard}
              className="btn-primary w-full"
            >
              Continuer
            </button>
          </div>
        ) : (
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
              <button type="submit" disabled={loading || !email} className="btn-primary w-full">
                {loading ? 'Envoi…' : 'Envoyer l\'invitation'}
              </button>
              <button type="button" onClick={handleSkip} className="btn-ghost w-full">
                Passer pour l'instant
              </button>
            </div>
          </form>
        )}

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
