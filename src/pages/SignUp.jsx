import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { setPendingInviteToken } from '../lib/pendingInvite'

export default function SignUp() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const inviteToken = searchParams.get('invite') || ''
  const signUp = useAuthStore((s) => s.signUp)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [cguAccepted, setCguAccepted] = useState(false)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.')
      return
    }
    if (!cguAccepted) {
      setError('Tu dois accepter les CGU pour continuer.')
      return
    }

    setLoading(true)
    try {
      // Si on arrive ici via un lien d'invitation, on persiste le token AVANT
      // le signUp : il survivra à la confirmation email et sera repris par
      // RequireFamily (ou par la nav post-login) pour relancer le flow.
      if (inviteToken) setPendingInviteToken(inviteToken)

      await signUp(email, password)

      // Après signup :
      //  - avec invitation : on tente directement /invite?token=xxx
      //    (si la confirmation email est activée, AcceptInvite affichera
      //    le CTA "Se connecter" une fois le mail confirmé).
      //  - sans invitation : onboarding classique.
      if (inviteToken) {
        navigate(`/invite?token=${inviteToken}`, { replace: true })
      } else {
        navigate('/onboarding/child')
      }
    } catch (err) {
      // Cas spécifique : email déjà enregistré → on propose de basculer sur
      // la page de connexion plutôt que d'afficher une erreur sèche.
      if (err.code === 'email_already_registered') {
        setError('email_already_registered')
      } else {
        setError(err.message || 'Une erreur est survenue.')
      }
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
          <h1 className="font-display text-display text-primary mt-md">Parenty</h1>
          <p className="text-body-md text-on-surface-variant mt-1">Créer un compte</p>
        </div>

        <form onSubmit={handleSubmit} className="card-elevated p-lg space-y-md">
          <div>
            <label className="label" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
            />
          </div>

          <div>
            <label className="label" htmlFor="password">Mot de passe</label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input pr-11"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-on-surface-variant hover:text-on-surface transition-colors"
                aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                aria-pressed={showPassword}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <p className="text-caption text-on-surface-variant mt-1">
              Au moins 8 caractères.
            </p>
          </div>

          <label className="flex items-start gap-2 text-body-md text-on-surface-variant">
            <input
              type="checkbox"
              checked={cguAccepted}
              onChange={(e) => setCguAccepted(e.target.checked)}
              className="mt-1 accent-primary"
            />
            <span>
              J'accepte les{' '}
              <Link
                to="/cgu"
                target="_blank"
                rel="noopener"
                className="text-primary font-semibold underline"
              >
                CGU
              </Link>
              {' '}et la{' '}
              <Link
                to="/privacy"
                target="_blank"
                rel="noopener"
                className="text-primary font-semibold underline"
              >
                politique de confidentialité
              </Link>
              .
            </span>
          </label>

          {error === 'email_already_registered' ? (
            <div className="text-body-md text-on-error-container bg-error-container rounded-md p-3 space-y-2">
              <p>
                Un compte existe déjà avec <strong>{email}</strong>. Pas
                besoin d'en créer un nouveau.
              </p>
              <div className="flex flex-col gap-1">
                <Link
                  to={
                    inviteToken
                      ? `/signin?redirect=/invite?token=${inviteToken}`
                      : '/signin'
                  }
                  className="font-semibold underline"
                >
                  Me connecter avec cet email
                </Link>
                <Link to="/forgot-password" className="font-semibold underline">
                  J'ai oublié mon mot de passe
                </Link>
              </div>
            </div>
          ) : error ? (
            <div className="text-body-md text-on-error-container bg-error-container rounded-md p-3">
              {error}
            </div>
          ) : null}

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Création…' : 'Créer mon compte'}
          </button>

          <p className="text-body-md text-center text-on-surface-variant">
            Déjà un compte ?{' '}
            <Link to="/signin" className="text-primary font-semibold">
              Se connecter
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
