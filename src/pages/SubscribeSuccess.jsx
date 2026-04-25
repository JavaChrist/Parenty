import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, Loader2, XCircle, AlertTriangle } from 'lucide-react'
import { useFamily } from '../hooks/useFamily'
import { useMolliePaymentStatus, useStartSubscription } from '../hooks/useBilling'

/**
 * Page atterrissage après le retour de Mollie (redirectUrl du first payment).
 *
 * Trois cas possibles :
 *   1. ?payment_id=tr_xxx connu → on interroge Mollie via mollie-payment-status
 *      et on affiche un message en fonction du statut réel (paid / canceled /
 *      failed / expired / open / pending).
 *   2. Pas de payment_id (ancien lien, ou utilisateur arrivé directement) →
 *      on retombe sur le polling famille legacy.
 *   3. Statut paid → on attend que le webhook bascule la famille en "active",
 *      puis redirection profil.
 */
export default function SubscribeSuccess() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [params] = useSearchParams()
  const paymentId = params.get('payment_id')

  const { data: paymentInfo, isLoading: loadingPayment, error: paymentError } =
    useMolliePaymentStatus(paymentId)
  const { data: familyData } = useFamily()
  const startSub = useStartSubscription()
  const [waited, setWaited] = useState(0)

  const status = paymentInfo?.status // 'paid' | 'canceled' | 'expired' | 'failed' | 'open' | 'pending' | 'authorized'
  const isActive = familyData?.family?.subscription_status === 'active'

  // Cas terminal négatif (annulé / échec / expiré)
  const isAborted =
    status === 'canceled' || status === 'expired' || status === 'failed'

  // Cas terminal positif : Mollie dit "paid" → on attend l'activation famille
  const isPaid = status === 'paid' || status === 'authorized'

  // Cas indéterminé : pas de payment_id ou statut "open"/"pending" → polling famille
  const shouldPollFamily =
    !isAborted && (isPaid || !paymentId || status === 'open' || status === 'pending')

  useEffect(() => {
    if (!shouldPollFamily || isActive) return
    const iv = setInterval(() => {
      qc.invalidateQueries({ queryKey: ['family'] })
      setWaited((w) => w + 2)
    }, 2000)
    return () => clearInterval(iv)
  }, [shouldPollFamily, isActive, qc])

  useEffect(() => {
    if (!isActive) return
    const t = setTimeout(() => navigate('/profile', { replace: true }), 2500)
    return () => clearTimeout(t)
  }, [isActive, navigate])

  const stillWaiting = shouldPollFamily && !isActive && waited < 30
  const giveUp = shouldPollFamily && !isActive && waited >= 30

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
          {/* Cas chargement initial du statut Mollie */}
          {paymentId && loadingPayment && (
            <>
              <div className="mx-auto h-14 w-14 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container">
                <Loader2 size={28} strokeWidth={2.2} className="animate-spin" />
              </div>
              <h2 className="h-section text-h3">Vérification du paiement…</h2>
              <p className="text-body-md text-on-surface-variant">
                On récupère le statut de ta transaction auprès de Mollie.
              </p>
            </>
          )}

          {/* Cas erreur API Mollie */}
          {paymentId && paymentError && (
            <>
              <div className="mx-auto h-14 w-14 rounded-full bg-error-container flex items-center justify-center text-on-error-container">
                <AlertTriangle size={28} strokeWidth={2.2} />
              </div>
              <h2 className="h-section text-h3">Statut indisponible</h2>
              <p className="text-body-md text-on-surface-variant">
                Impossible de récupérer le statut du paiement.
                {' '}
                <span className="block mt-1">
                  Si tu as effectivement payé, ton abonnement sera activé sous quelques minutes.
                </span>
              </p>
              <Link to="/profile" className="btn-secondary w-full">
                Retour au profil
              </Link>
            </>
          )}

          {/* Cas annulé / échec / expiré */}
          {isAborted && (
            <>
              <div className="mx-auto h-14 w-14 rounded-full bg-error-container flex items-center justify-center text-on-error-container">
                <XCircle size={28} strokeWidth={2.2} />
              </div>
              <h2 className="h-section text-h3">
                {status === 'canceled' && 'Paiement annulé'}
                {status === 'expired' && 'Session de paiement expirée'}
                {status === 'failed' && 'Paiement échoué'}
              </h2>
              <p className="text-body-md text-on-surface-variant">
                {status === 'canceled' &&
                  "Tu as annulé le paiement avant de le valider. Aucun montant n'a été prélevé."}
                {status === 'expired' &&
                  "La page de paiement a expiré. Aucun montant n'a été prélevé."}
                {status === 'failed' &&
                  "Le paiement n'a pas abouti côté banque. Aucun montant n'a été prélevé."}
              </p>
              <button
                type="button"
                onClick={() => startSub.mutate()}
                disabled={startSub.isPending}
                className="btn-primary w-full"
              >
                {startSub.isPending ? 'Redirection…' : 'Réessayer le paiement'}
              </button>
              <Link to="/profile" className="btn-secondary w-full">
                Plus tard
              </Link>
            </>
          )}

          {/* Cas succès : famille passée en active */}
          {isActive && (
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
          )}

          {/* Cas en attente du webhook (paid mais pas encore active) */}
          {!isActive && stillWaiting && !loadingPayment && !paymentError && (
            <>
              <div className="mx-auto h-14 w-14 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container">
                <Loader2 size={28} strokeWidth={2.2} className="animate-spin" />
              </div>
              <h2 className="h-section text-h3">Confirmation en cours…</h2>
              <p className="text-body-md text-on-surface-variant">
                Mollie confirme ton paiement. Ça prend quelques secondes.
              </p>
            </>
          )}

          {/* Cas timeout webhook */}
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
