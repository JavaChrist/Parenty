import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { useFamily } from '../hooks/useFamily'

/**
 * Page atterrissage après le retour de Mollie (redirectUrl du first payment).
 *
 * Au moment où l'utilisateur arrive ici, le webhook mollie-webhook a peut-être
 * déjà été traité (paiement < 1s) ou peut-être pas encore (lag webhook Mollie
 * ~quelques secondes). On attend donc que `subscription_status === 'active'`
 * en re-pollant la famille via React Query, avec un timeout au-delà duquel on
 * affiche un message d'attente.
 */
export default function SubscribeSuccess() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { data } = useFamily()
  const [waited, setWaited] = useState(0)

  const isActive = data?.family?.subscription_status === 'active'

  useEffect(() => {
    if (isActive) return
    // Refresh famille toutes les 2s pendant 30s max
    const iv = setInterval(() => {
      qc.invalidateQueries({ queryKey: ['family'] })
      setWaited((w) => w + 2)
    }, 2000)
    return () => clearInterval(iv)
  }, [isActive, qc])

  useEffect(() => {
    if (!isActive) return
    const t = setTimeout(() => navigate('/profile', { replace: true }), 2500)
    return () => clearTimeout(t)
  }, [isActive, navigate])

  const stillWaiting = !isActive && waited < 30
  const giveUp = !isActive && waited >= 30

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
            Parenty Premium
          </h1>
        </div>

        <div className="card-elevated p-lg text-center space-y-md">
          {isActive ? (
            <>
              <div className="mx-auto h-14 w-14 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container">
                <CheckCircle2 size={28} strokeWidth={2.2} />
              </div>
              <h2 className="h-section text-h3">Abonnement activé</h2>
              <p className="text-body-md text-on-surface-variant">
                Merci de soutenir Parenty. Tu accèdes maintenant à toutes les
                fonctionnalités Premium. Redirection vers ton profil…
              </p>
            </>
          ) : stillWaiting ? (
            <>
              <div className="mx-auto h-14 w-14 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container">
                <Loader2 size={28} strokeWidth={2.2} className="animate-spin" />
              </div>
              <h2 className="h-section text-h3">Confirmation en cours…</h2>
              <p className="text-body-md text-on-surface-variant">
                Mollie confirme ton paiement. Ça prend quelques secondes.
              </p>
            </>
          ) : null}

          {giveUp && (
            <>
              <div className="mx-auto h-14 w-14 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container">
                <Loader2 size={28} strokeWidth={2.2} />
              </div>
              <h2 className="h-section text-h3">Paiement en cours de traitement</h2>
              <p className="text-body-md text-on-surface-variant">
                Ton paiement a été soumis. Mollie peut prendre jusqu'à quelques
                minutes pour nous confirmer le statut. Ton abonnement sera
                automatiquement activé dès réception.
              </p>
              <Link to="/profile" className="btn-primary w-full">
                Aller à mon profil
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
