import { useState } from 'react'
import {
  Plus,
  Stethoscope,
  GraduationCap,
  ShoppingBag,
  Check,
  Clock,
  X,
  Utensils,
  Gamepad2,
  Wallet,
  Paperclip,
  Palmtree,
  Bus,
  Dumbbell,
  Car,
  Gift,
  Baby,
  Pencil,
} from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { Link } from 'react-router-dom'
import { Crown } from 'lucide-react'
import {
  useExpenses,
  useValidateExpense,
  EXPENSE_CATEGORIES,
  getReceiptSignedUrl,
  expenseSplit,
  computeBalances,
} from '../hooks/useExpenses'
import { usePlanLimits } from '../hooks/usePlanLimits'
import Modal from '../components/ui/Modal'
import AddExpenseForm from '../components/expenses/AddExpenseForm'
import RejectExpenseForm from '../components/expenses/RejectExpenseForm'
import YearlyExpenseChart from '../components/expenses/YearlyExpenseChart'

// Icônes par catégorie BD → composant
const CATEGORY_ICONS = {
  school: GraduationCap,
  school_trip: Bus,
  medical: Stethoscope,
  clothing: ShoppingBag,
  food: Utensils,
  leisure: Gamepad2,
  sport: Dumbbell,
  vacation: Palmtree,
  transport: Car,
  gifts: Gift,
  childcare: Baby,
  other: Wallet,
}

// Libellés FR des catégories (depuis le hook)
const CATEGORY_LABELS = Object.fromEntries(
  EXPENSE_CATEGORIES.map((c) => [c.value, c.label])
)

const STATUS_META = {
  pending: { label: 'En attente', className: 'pill-warning', Icon: Clock },
  approved: { label: 'Validée', className: 'pill-success', Icon: Check },
  rejected: { label: 'Refusée', className: 'pill-danger', Icon: X },
}

// Filtre les dépenses du mois calendaire en cours (hors refusées).
function currentMonthExpenses(expenses) {
  const now = new Date()
  const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  return expenses.filter(
    (e) => e.status !== 'rejected' && e.incurred_on.startsWith(ym),
  )
}

const fmtEur = (cents) => `${(cents / 100).toFixed(2)} €`

export default function Expenses() {
  const user = useAuthStore((s) => s.user)
  const { data: expenses = [], isLoading, error } = useExpenses()
  const {
    isPremium,
    atExpenseLimit,
    expenseCount,
    expenseLimit,
  } = usePlanLimits()

  const [addOpen, setAddOpen] = useState(false)
  const [rejectingId, setRejectingId] = useState(null)
  const [editingExpense, setEditingExpense] = useState(null)

  const monthExpenses = currentMonthExpenses(expenses)
  const totalMonthCents = monthExpenses.reduce(
    (s, e) => s + e.amount_cents,
    0,
  )
  const balances = computeBalances(monthExpenses, user?.id)

  return (
    <div className="space-y-lg">
      <header>
        <h1 className="h-title">Dépenses</h1>
        <p className="text-body-md text-on-surface-variant mt-1">
          Dépenses partagées avec validation du second parent.
        </p>
      </header>

      <section className="card-elevated bg-tertiary-container text-on-tertiary p-lg space-y-md">
        <div>
          <p className="text-caption uppercase tracking-wide text-on-tertiary/80">
            Total des dépenses ce mois
          </p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-display text-display font-bold">
              {(totalMonthCents / 100).toFixed(2)}
            </span>
            <span className="text-body-lg font-semibold">€</span>
          </div>
        </div>

        <div className="space-y-1 text-body-md border-t border-on-tertiary/15 pt-md">
          <div className="flex items-center justify-between">
            <span className="text-on-tertiary/90">Tu as payé</span>
            <span className="font-semibold">{fmtEur(balances.paidByUser)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-on-tertiary/90">Ta part équitable</span>
            <span className="font-semibold">{fmtEur(balances.userShare)}</span>
          </div>
        </div>

        <div className="border-t border-on-tertiary/15 pt-md">
          {balances.coparentBalance === 0 ? (
            <p className="text-body-md text-on-tertiary/90">
              Comptes équilibrés ce mois-ci.
            </p>
          ) : balances.coparentBalance > 0 ? (
            <div>
              <p className="text-caption uppercase tracking-wide text-on-tertiary/80">
                Le co-parent te doit
              </p>
              <p className="font-display text-h2 font-bold mt-0.5">
                {fmtEur(balances.coparentBalance)}
              </p>
            </div>
          ) : (
            <div>
              <p className="text-caption uppercase tracking-wide text-on-tertiary/80">
                Tu dois au co-parent
              </p>
              <p className="font-display text-h2 font-bold mt-0.5">
                {fmtEur(-balances.coparentBalance)}
              </p>
            </div>
          )}
          <p className="text-caption text-on-tertiary/70 mt-1">
            Calculé sur les dépenses validées du mois en cours, en tenant
            compte du partage défini sur chaque ligne.
          </p>
        </div>
      </section>

      <YearlyExpenseChart />

      {!isPremium && (
        <p className="text-caption text-on-surface-variant text-center">
          Plan gratuit · {expenseCount} / {expenseLimit} dépenses ce mois-ci
        </p>
      )}

      <button
        onClick={() => setAddOpen(true)}
        disabled={atExpenseLimit}
        className="btn-primary w-full disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <Plus size={18} strokeWidth={2.5} />
        Ajouter une dépense
      </button>

      {atExpenseLimit && (
        <div className="card p-md bg-tertiary-fixed/50 border border-tertiary/20">
          <p className="text-body-md text-on-tertiary-fixed-variant">
            <Crown size={14} className="inline -mt-0.5 mr-1" strokeWidth={2} />
            Plan gratuit limité à {expenseLimit} dépenses par mois.{' '}
            <Link to="/profile" className="font-semibold underline">
              Passe en Premium
            </Link>{' '}
            pour lever la limite.
          </p>
        </div>
      )}

      <section className="space-y-sm">
        <h2 className="text-label-sm text-on-surface-variant uppercase tracking-wide px-sm">
          Récentes
        </h2>

        {isLoading && (
          <div className="card p-lg text-center text-on-surface-variant">
            Chargement…
          </div>
        )}

        {error && (
          <div className="card p-lg bg-error-container text-on-error-container">
            Erreur : {error.message}
          </div>
        )}

        {!isLoading && expenses.length === 0 && (
          <div className="card p-lg text-center text-on-surface-variant">
            Aucune dépense pour le moment. Ajoute la première !
          </div>
        )}

        <div className="space-y-sm">
          {expenses.map((e) => (
            <ExpenseRow
              key={e.id}
              expense={e}
              currentUserId={user?.id}
              onReject={() => setRejectingId(e.id)}
              onEdit={() => setEditingExpense(e)}
            />
          ))}
        </div>
      </section>

      <p className="text-caption text-on-surface-variant/70 text-center pt-md">
        Règle : le parent payeur ne peut pas valider sa propre dépense. Un refus doit
        être motivé.
      </p>

      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Nouvelle dépense"
      >
        <AddExpenseForm
          onSuccess={() => setAddOpen(false)}
          onCancel={() => setAddOpen(false)}
        />
      </Modal>

      <Modal
        open={!!rejectingId}
        onClose={() => setRejectingId(null)}
        title="Refuser la dépense"
      >
        {rejectingId && (
          <RejectExpenseForm
            expenseId={rejectingId}
            onSuccess={() => setRejectingId(null)}
            onCancel={() => setRejectingId(null)}
          />
        )}
      </Modal>

      <Modal
        open={!!editingExpense}
        onClose={() => setEditingExpense(null)}
        title="Modifier la dépense"
      >
        {editingExpense && (
          <AddExpenseForm
            expense={editingExpense}
            onSuccess={() => setEditingExpense(null)}
            onCancel={() => setEditingExpense(null)}
          />
        )}
      </Modal>
    </div>
  )
}

function ExpenseRow({ expense, currentUserId, onReject, onEdit }) {
  const validate = useValidateExpense()
  const CategoryIcon = CATEGORY_ICONS[expense.category] ?? Wallet
  const status = STATUS_META[expense.status]
  const StatusIcon = status.Icon

  const isMine = expense.payer_id === currentUserId
  const canValidate = expense.status === 'pending' && !isMine
  const amount = (expense.amount_cents / 100).toFixed(2)
  const date = new Date(expense.incurred_on).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
  })

  // Partage : libellé court à afficher en pill
  const split = expenseSplit(expense)
  const payerSide = isMine ? split.pct : 100 - split.pct
  const otherSide = 100 - payerSide
  let shareLabel = `${payerSide.toFixed(0)} / ${otherSide.toFixed(0)}`
  if (split.pct === 50) shareLabel = '50 / 50'
  else if (split.pct === 100) shareLabel = isMine ? '100 % toi' : '100 % co-parent'
  else if (split.pct === 0) shareLabel = isMine ? '100 % co-parent' : '100 % toi'

  return (
    <article className="card p-md">
      <div className="flex items-center gap-md">
        <div className="h-11 w-11 rounded-full bg-surface-container flex items-center justify-center text-primary flex-shrink-0">
          <CategoryIcon size={20} strokeWidth={2} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-body-md font-semibold text-on-surface truncate">
              {expense.description}
            </h3>
            <span className="text-body-md font-bold text-on-surface whitespace-nowrap">
              {amount} €
            </span>
          </div>
          <div className="flex items-center justify-between mt-1 gap-2 flex-wrap">
            <p className="text-caption text-on-surface-variant">
              {CATEGORY_LABELS[expense.category] ?? expense.category} ·{' '}
              {isMine ? 'Toi' : 'Co-parent'} · {date}
            </p>
            <div className="flex items-center gap-1 flex-wrap">
              <span
                className="text-caption font-semibold px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant"
                title={`Tu supportes ${payerSide.toFixed(0)}%, le co-parent ${otherSide.toFixed(0)}%`}
              >
                {shareLabel}
              </span>
              <span className={status.className}>
                <StatusIcon size={12} strokeWidth={2.5} />
                {status.label}
              </span>
            </div>
          </div>
        </div>
      </div>

      {expense.receipt_path && (
        <div className="mt-sm pl-[calc(2.75rem+1rem)]">
          <ReceiptLink path={expense.receipt_path} />
        </div>
      )}

      {expense.status === 'rejected' && expense.reject_reason && (
        <p className="mt-sm pl-[calc(2.75rem+1rem)] text-caption text-on-error-container bg-error-container rounded-md px-3 py-2">
          Motif : {expense.reject_reason}
        </p>
      )}

      {canValidate && (
        <div className="mt-md pl-[calc(2.75rem+1rem)] flex gap-sm">
          <button
            onClick={() => validate.mutate(expense.id)}
            disabled={validate.isPending}
            className="btn-primary flex-1"
          >
            <Check size={16} strokeWidth={2.5} />
            Valider
          </button>
          <button onClick={onReject} className="btn-secondary flex-1">
            <X size={16} strokeWidth={2.5} />
            Refuser
          </button>
        </div>
      )}

      <div className="mt-sm pl-[calc(2.75rem+1rem)]">
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex items-center gap-1 text-caption text-on-surface-variant font-semibold hover:text-on-surface hover:underline"
        >
          <Pencil size={12} strokeWidth={2.4} />
          Modifier
        </button>
      </div>
    </article>
  )
}

function ReceiptLink({ path }) {
  const [loading, setLoading] = useState(false)
  const open = async () => {
    try {
      setLoading(true)
      const url = await getReceiptSignedUrl(path)
      if (url) window.open(url, '_blank', 'noopener,noreferrer')
    } catch (err) {
      alert("Impossible d'ouvrir la facture : " + (err?.message ?? 'erreur'))
    } finally {
      setLoading(false)
    }
  }
  return (
    <button
      type="button"
      onClick={open}
      disabled={loading}
      className="inline-flex items-center gap-1 text-caption text-primary font-semibold hover:underline"
    >
      <Paperclip size={14} strokeWidth={2.2} />
      {loading ? 'Ouverture…' : 'Voir la facture'}
    </button>
  )
}
