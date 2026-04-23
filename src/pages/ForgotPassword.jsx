import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { supabase } from '../lib/supabase'

/**
 * Page de demande de réinitialisation de mot de passe.
 *
 * Étape 1 du flow :
 *   /forgot-password → l'user saisit son email → Supabase envoie le mail
 *   → l'user clique le lien → /reset-password → saisit le nouveau mot de passe
 *
 * UX : on n'indique JAMAIS si l'email existe ou non en base. Message identique
 * dans tous les cas (succès + "existant" + "inconnu") pour éviter l'énumération
 * d'utilisateurs. Bonne pratique standard (OWASP).
 */
export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const appUrl = import.meta.env.VITE_APP_URL || window.location.origin
      const redirectTo = `${appUrl.replace(/\/$/, '')}/reset-password`

      // On ignore volontairement l'erreur "user not found" de Supabase :
      // le message affiché reste neutre pour ne pas leaker l'existence
      // d'un compte. En cas de vraie erreur réseau on affiche quand même.
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email,
        { redirectTo }
      )

      if (resetError && !/user.*not.*found/i.test(resetError.message)) {
        throw resetError
      }

      setSent(true)
    } catch (err) {
      setError(err.message || 'Une erreur est survenue. Réessaie.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <img
            src="/icons/logo128.png"
            alt="Parenty"
            className="mx-auto h-20 w-20 rounded-2xl shadow-soft"
            width="80"
            height="80"
          />
          <h1 className="font-display text-display text-primary mt-md">
            Parenty
          </h1>
          <p className="text-body-md text-on-surface-variant mt-1">
            Mot de passe oublié
          </p>
        </div>

        {sent ? (
          <div className="card-elevated p-lg space-y-md text-center">
            <div className="mx-auto h-14 w-14 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container">
              <CheckCircle2 size={28} strokeWidth={2.2} />
            </div>
            <h2 className="h-section text-h3">Email envoyé</h2>
            <p className="text-body-md text-on-surface-variant">
              Si un compte est associé à <strong>{email}</strong>, tu recevras
              un email avec un lien pour réinitialiser ton mot de passe.
            </p>
            <p className="text-caption text-on-surface-variant">
              Le lien est valide pendant 1 heure. Pense à vérifier tes spams.
            </p>
            <Link
              to="/signin"
              className="btn-primary w-full inline-flex items-center justify-center gap-2"
            >
              <ArrowLeft size={16} />
              Retour à la connexion
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="card-elevated p-lg space-y-md">
            <div className="space-y-1">
              <h2 className="h-section text-h3">Réinitialiser</h2>
              <p className="text-body-md text-on-surface-variant">
                Indique l'email de ton compte. Nous t'enverrons un lien pour
                choisir un nouveau mot de passe.
              </p>
            </div>

            <div>
              <label className="label" htmlFor="email">
                Email
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-on-surface-variant pointer-events-none">
                  <Mail size={18} />
                </span>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input pl-10"
                  placeholder="toi@exemple.fr"
                />
              </div>
            </div>

            {error && (
              <div className="text-body-md text-on-error-container bg-error-container rounded-md p-3">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? 'Envoi…' : 'M\'envoyer le lien'}
            </button>

            <p className="text-body-md text-center text-on-surface-variant">
              <Link
                to="/signin"
                className="text-primary font-semibold inline-flex items-center gap-1"
              >
                <ArrowLeft size={14} />
                Retour à la connexion
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
