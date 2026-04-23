import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Lock, CheckCircle2, AlertTriangle } from 'lucide-react'
import { supabase } from '../lib/supabase'

/**
 * Page de réinitialisation du mot de passe (étape 2 du flow).
 *
 * Flux Supabase :
 *   1. L'user clique le lien dans l'email → arrive sur cette URL avec
 *      `#access_token=...&refresh_token=...&type=recovery` dans le hash.
 *   2. Le client Supabase (initialisé avec `detectSessionInUrl: true`) parse
 *      ce hash et déclenche un event `PASSWORD_RECOVERY`.
 *   3. À ce moment, on a une session limitée au changement de mot de passe.
 *   4. On appelle `supabase.auth.updateUser({ password })` pour finaliser.
 *
 * Si l'user arrive ici sans être en mode recovery (direct URL, lien expiré,
 * onglet rouvert plus tard…), on affiche un message d'erreur plutôt qu'un
 * formulaire inutilisable.
 */
export default function ResetPassword() {
  const navigate = useNavigate()
  const [ready, setReady] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState(null)
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // On s'abonne AVANT d'appeler getSession : l'event PASSWORD_RECOVERY
    // peut arriver pendant le parsing du hash par le SDK au montage.
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setReady(true)
        setCheckingSession(false)
      }
    })

    // Cas où l'user est arrivé il y a peu : la session de recovery est déjà
    // établie avant qu'on s'abonne → on la détecte via getSession().
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setReady(true)
      }
      setCheckingSession(false)
    })

    return () => {
      sub.subscription.unsubscribe()
    }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.')
      return
    }
    if (password !== passwordConfirm) {
      setError('Les deux mots de passe ne correspondent pas.')
      return
    }

    setLoading(true)
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      })
      if (updateError) throw updateError

      setDone(true)
      // Déconnexion propre : on force l'user à se reconnecter avec le nouveau
      // mot de passe, sans garder la session recovery active.
      await supabase.auth.signOut()

      // Petit délai pour que l'user voie le message de succès.
      setTimeout(() => navigate('/signin', { replace: true }), 2500)
    } catch (err) {
      setError(err.message || 'Impossible de mettre à jour le mot de passe.')
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
            Nouveau mot de passe
          </p>
        </div>

        {checkingSession ? (
          <div className="card-elevated p-lg text-center text-on-surface-variant">
            Vérification du lien…
          </div>
        ) : done ? (
          <div className="card-elevated p-lg space-y-md text-center">
            <div className="mx-auto h-14 w-14 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container">
              <CheckCircle2 size={28} strokeWidth={2.2} />
            </div>
            <h2 className="h-section text-h3">Mot de passe modifié</h2>
            <p className="text-body-md text-on-surface-variant">
              Tu vas être redirigé vers la connexion…
            </p>
          </div>
        ) : !ready ? (
          <div className="card-elevated p-lg space-y-md text-center">
            <div className="mx-auto h-14 w-14 rounded-full bg-error-container flex items-center justify-center text-on-error-container">
              <AlertTriangle size={28} strokeWidth={2.2} />
            </div>
            <h2 className="h-section text-h3">Lien invalide ou expiré</h2>
            <p className="text-body-md text-on-surface-variant">
              Ce lien n'est plus valide (expiré, déjà utilisé, ou ouvert dans
              un autre navigateur que celui qui a demandé l'email).
            </p>
            <Link to="/forgot-password" className="btn-primary w-full">
              Redemander un lien
            </Link>
            <Link
              to="/signin"
              className="block text-caption text-on-surface-variant hover:text-primary"
            >
              Retour à la connexion
            </Link>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="card-elevated p-lg space-y-md"
          >
            <div className="space-y-1">
              <h2 className="h-section text-h3">Choisis ton nouveau mot de passe</h2>
              <p className="text-body-md text-on-surface-variant">
                Au moins 8 caractères. Choisis-en un que tu n'utilises pas
                ailleurs.
              </p>
            </div>

            <div>
              <label className="label" htmlFor="password">
                Nouveau mot de passe
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-on-surface-variant pointer-events-none">
                  <Lock size={18} />
                </span>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input pl-10 pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-on-surface-variant hover:text-on-surface transition-colors"
                  aria-label={
                    showPassword
                      ? 'Masquer le mot de passe'
                      : 'Afficher le mot de passe'
                  }
                  aria-pressed={showPassword}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label className="label" htmlFor="passwordConfirm">
                Confirmer
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-on-surface-variant pointer-events-none">
                  <Lock size={18} />
                </span>
                <input
                  id="passwordConfirm"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  className="input pl-10"
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
              {loading ? 'Enregistrement…' : 'Valider'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
