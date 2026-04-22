import { Navigate, Outlet } from 'react-router-dom'
import { useFamily } from '../../hooks/useFamily'

/**
 * Garde-fou : si le user n'a pas encore de famille, on l'envoie à l'onboarding.
 * Affiche un écran de chargement pendant que la query tourne.
 */
export default function RequireFamily() {
  const { data, isLoading, error } = useFamily()

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-md bg-background">
        <img
          src="/icons/logo128.png"
          alt=""
          className="h-20 w-20 rounded-2xl shadow-soft animate-pulse"
          width="80"
          height="80"
        />
        <div className="text-on-surface-variant">Chargement de ta famille…</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-md bg-background">
        <div className="card-elevated p-lg max-w-sm text-center">
          <h2 className="h-section text-h3 text-error">Erreur</h2>
          <p className="text-body-md text-on-surface-variant mt-sm">
            {error.message}
          </p>
        </div>
      </div>
    )
  }

  if (!data?.family) {
    return <Navigate to="/onboarding/child" replace />
  }

  return <Outlet />
}
