import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'

export default function SignIn() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirect = searchParams.get('redirect')
  const signIn = useAuthStore((s) => s.signIn)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await signIn(email, password)
      // Si on arrive depuis /invite, on y retourne pour reprendre le flow.
      // On limite aux URLs internes (commencent par /) pour éviter open redirect.
      const target = redirect && redirect.startsWith('/') ? redirect : '/'
      navigate(target, { replace: true })
    } catch (err) {
      const msg = err.message || ''
      if (msg === 'Invalid login credentials') {
        setError('Email ou mot de passe incorrect.')
      } else if (msg === 'Email not confirmed') {
        setError('Ton email n\'est pas encore confirmé. Va dans Dashboard Supabase > Authentication > Users pour confirmer ton compte, ou décoche "Confirm email" dans Providers > Email.')
      } else {
        setError(msg || 'Une erreur est survenue. Réessaie.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <img src="/icons/logo128.png" alt="Parenty" className="mx-auto h-20 w-20 rounded-2xl shadow-soft" width="80" height="80" />
          <h1 className="font-display text-display text-primary mt-md">Parenty</h1>
          <p className="text-body-md text-on-surface-variant mt-1">Organisation parentale partagée</p>
        </div>

        <form onSubmit={handleSubmit} className="card-elevated p-lg space-y-md">
          <h2 className="h-section text-h3">Connexion</h2>

          <div>
            <label className="label" htmlFor="email">Email</label>
            <input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input" />
          </div>

          <div>
            <label className="label" htmlFor="password">Mot de passe</label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
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
          </div>

          {error && (
            <div className="text-body-md text-on-error-container bg-error-container rounded-md p-3">
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Connexion…' : 'Se connecter'}
          </button>

          <p className="text-body-md text-center">
            <Link
              to="/forgot-password"
              className="text-primary font-semibold hover:underline"
            >
              Mot de passe oublié ?
            </Link>
          </p>

          <p className="text-body-md text-center text-on-surface-variant">
            Pas encore de compte ?{' '}
            <Link to="/signup" className="text-primary font-semibold">Créer un compte</Link>
          </p>
        </form>

        <p className="text-caption text-center text-on-surface-variant mt-md">
          <Link to="/install" className="hover:text-primary hover:underline">
            Installer Parenty sur ton téléphone
          </Link>
        </p>
      </div>
    </div>
  )
}
