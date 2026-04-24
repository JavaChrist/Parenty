import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  Crown,
  CheckCircle2,
  XCircle,
  Receipt,
  RotateCcw,
} from 'lucide-react'
import { useFamily } from '../hooks/useFamily'
import { useBillingHistory } from '../hooks/useBillingHistory'

/**
 * Portail de facturation : récap de l'abonnement en cours + historique des
 * paiements Mollie.
 *
 * Ce n'est pas un portail de reçus officiels : les factures PDF sont
 * envoyées par Mollie par email à chaque prélèvement. On affiche ici la
 * même information pour la transparence et pour permettre à l'utilisateur
 * de vérifier rapidement ses prélèvements depuis l'app.
 */
export default function Billing() {
  const { data: familyData } = useFamily()
  const { data: history = [], isLoading } = useBillingHistory()

  const family = familyData?.family
  const status = family?.subscription_status ?? 'free'
  const endsAt = family?.subscription_ends_at
  const payments = history.filter((h) => h.type?.startsWith('payment.'))
  const paidPayments = payments.filter((p) => p.status === 'paid')

  return (
    <div className="space-y-lg">
      <header className="flex items-center gap-md">
        <Link
          to="/profile"
          className="p-2 -ml-2 rounded-full hover:bg-surface-container-low transition-colors"
          aria-label="Retour"
        >
          <ArrowLeft size={20} className="text-on-surface" />
        </Link>
        <div>
          <h1 className="font-display text-h2 text-on-surface">Facturation</h1>
          <p className="text-body-md text-on-surface-variant">
            Abonnement et historique des paiements.
          </p>
        </div>
      </header>

      {/* Récap abonnement */}
      <section className="card-elevated p-lg bg-gradient-to-br from-tertiary-fixed to-tertiary-fixed-dim">
        <div className="flex items-start gap-md">
          <div className="h-10 w-10 rounded-full bg-white/40 flex items-center justify-center text-on-tertiary-fixed-variant">
            <Crown size={20} strokeWidth={2} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-label-sm text-on-tertiary-fixed-variant uppercase tracking-wide">
              Statut
            </p>
            <h2 className="font-display text-h3 text-on-tertiary-fixed mt-1">
              {status === 'active'
                ? 'Parenty Premium — actif'
                : status === 'past_due'
                  ? 'Paiement en attente'
                  : status === 'cancelled'
                    ? 'Résiliation demandée'
                    : 'Plan gratuit'}
            </h2>
            <p className="text-body-md text-on-tertiary-fixed-variant mt-1">
              {status === 'active' && (
                <>
                  Prochain prélèvement automatique de <strong>6,99&nbsp;€</strong>
                  {endsAt
                    ? ` aux alentours du ${new Date(endsAt).toLocaleDateString('fr-FR')}`
                    : ''}
                  .
                </>
              )}
              {status === 'past_due' &&
                "Mollie relance automatiquement. Vérifie que ta carte est valide."}
              {status === 'cancelled' && endsAt && (
                <>
                  Accès Premium maintenu jusqu'au{' '}
                  <strong>
                    {new Date(endsAt).toLocaleDateString('fr-FR')}
                  </strong>
                  .
                </>
              )}
              {status === 'free' && 'Aucun abonnement actif.'}
            </p>
          </div>
        </div>
      </section>

      {/* Historique */}
      <section className="space-y-sm">
        <h2 className="text-label-sm text-on-surface-variant uppercase tracking-wide px-sm">
          Historique des paiements ({paidPayments.length})
        </h2>

        {isLoading ? (
          <div className="card p-lg text-center text-on-surface-variant">
            Chargement…
          </div>
        ) : payments.length === 0 ? (
          <div className="card p-lg text-center text-on-surface-variant">
            Aucun paiement enregistré.
          </div>
        ) : (
          <div className="card divide-y divide-outline-variant/40">
            {payments.map((p) => (
              <PaymentRow key={p.id} payment={p} />
            ))}
          </div>
        )}

        <p className="text-caption text-on-surface-variant px-sm">
          Les reçus officiels sont envoyés par Mollie par email à chaque
          prélèvement. Pour toute question de facturation, écris à{' '}
          <a
            href="mailto:support@javachrist.fr"
            className="text-primary font-semibold hover:underline"
          >
            support@javachrist.fr
          </a>
          .
        </p>
      </section>
    </div>
  )
}

function PaymentRow({ payment }) {
  const { status, amount, currency, receivedAt, description, sequenceType } =
    payment
  const date = new Date(receivedAt).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  const hour = new Date(receivedAt).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  })

  const { icon: Icon, className, label } = paymentBadge(status)
  const isFirst = sequenceType === 'first'

  return (
    <div className="flex items-center gap-md p-md">
      <div
        className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 ${className}`}
      >
        <Icon size={18} strokeWidth={2.2} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-body-md font-semibold text-on-surface">
          {amount
            ? `${Number(amount).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`
            : label}
          {isFirst && (
            <span className="ml-2 pill-primary text-[10px]">
              Premier prélèvement
            </span>
          )}
        </p>
        <p className="text-caption text-on-surface-variant truncate">
          {description || 'Parenty Premium'} · {date} · {hour}
        </p>
      </div>
      <span className={`pill text-xs ${className}`}>{label}</span>
    </div>
  )
}

function paymentBadge(status) {
  switch (status) {
    case 'paid':
      return {
        icon: CheckCircle2,
        className: 'bg-primary-container text-on-primary-container',
        label: 'Payé',
      }
    case 'failed':
      return {
        icon: XCircle,
        className: 'bg-error-container text-on-error-container',
        label: 'Échec',
      }
    case 'canceled':
    case 'expired':
      return {
        icon: XCircle,
        className: 'bg-surface-container text-on-surface-variant',
        label: status === 'canceled' ? 'Annulé' : 'Expiré',
      }
    case 'pending':
    case 'open':
      return {
        icon: RotateCcw,
        className: 'bg-secondary-container text-on-secondary-container',
        label: 'En cours',
      }
    default:
      return {
        icon: Receipt,
        className: 'bg-surface-container text-on-surface-variant',
        label: status || 'Inconnu',
      }
  }
}
