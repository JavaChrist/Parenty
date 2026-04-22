import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'

export default function SignUp() {
  const navigate = useNavigate()
  const signUp = useAuthStore((s) => s.signUp)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
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
      await signUp(email, password)
      navigate('/onboarding/child')
    } catch (err) {
      setError(err.message || 'Une erreur est survenue.')
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
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
            />
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
              <a href="/cgu" className="text-primary font-semibold underline">CGU</a>
              {' '}et la{' '}
              <a href="/privacy" className="text-primary font-semibold underline">
                politique de confidentialité
              </a>.
            </span>
          </label>

          {error && (
            <div className="text-body-md text-on-error-container bg-error-container rounded-md p-3">
              {error}
            </div>
          )}

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
