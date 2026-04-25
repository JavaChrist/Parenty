import { useRef, useState } from 'react'
import { Paperclip, X } from 'lucide-react'
import {
  useAddExpense,
  useUpdateExpense,
  EXPENSE_CATEGORIES,
} from '../../hooks/useExpenses'
import { useChildren } from '../../hooks/useChildren'

const today = () => new Date().toISOString().slice(0, 10)
const MAX_FILE_MB = 10

const SHARE_MODES = [
  { id: '5050', label: '50 / 50' },
  { id: 'all_me', label: '100% à ma charge' },
  { id: 'all_other', label: '100% au co-parent' },
  { id: 'custom_pct', label: '% personnalisé' },
  { id: 'custom_amount', label: '€ personnalisé' },
]

/**
 * Détecte le mode de partage initial à partir d'une dépense existante.
 * Mappe vers un des SHARE_MODES.id pour pré-sélectionner le bouton.
 */
function detectShareMode(expense) {
  if (!expense) return '5050'
  if (expense.share_payer_cents != null) return 'custom_amount'
  const pct = Number(expense.share_payer_pct ?? 50)
  if (pct === 50) return '5050'
  if (pct === 100) return 'all_me'
  if (pct === 0) return 'all_other'
  return 'custom_pct'
}

/**
 * Formulaire dual création / édition d'une dépense.
 *
 *  - Si `expense` est fourni → mode édition (update). Le payeur est immuable.
 *  - Sinon → mode création (insert).
 *
 * Le partage peut être saisi en %, en € absolu, ou via 3 raccourcis.
 */
export default function AddExpenseForm({ expense, onSuccess, onCancel }) {
  const isEdit = !!expense
  const addExpense = useAddExpense()
  const updateExpense = useUpdateExpense()
  const { data: children = [] } = useChildren()
  const fileInputRef = useRef(null)

  const initialAmount = expense
    ? (expense.amount_cents / 100).toFixed(2)
    : ''
  const initialPct = expense
    ? Number(expense.share_payer_pct ?? 50)
    : 50
  const initialShareAmount =
    expense?.share_payer_cents != null
      ? (expense.share_payer_cents / 100).toFixed(2)
      : ''

  const [form, setForm] = useState({
    description: expense?.description ?? '',
    category: expense?.category ?? 'other',
    amount: initialAmount,
    incurred_on: expense?.incurred_on ?? today(),
    child_id: expense?.child_id ?? '',
    share_payer_pct: initialPct,
    share_payer_amount: initialShareAmount,
  })
  const [shareMode, setShareMode] = useState(detectShareMode(expense))
  const [receiptFile, setReceiptFile] = useState(null)
  const [error, setError] = useState(null)

  const update = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.value }))

  const selectShareMode = (mode) => {
    setShareMode(mode)
    setForm((f) => {
      if (mode === '5050') return { ...f, share_payer_pct: 50 }
      if (mode === 'all_me') return { ...f, share_payer_pct: 100 }
      if (mode === 'all_other') return { ...f, share_payer_pct: 0 }
      return f
    })
  }

  const updateCustomPct = (e) => {
    let v = Number(e.target.value)
    if (Number.isNaN(v)) v = 50
    v = Math.max(0, Math.min(100, v))
    setForm((f) => ({ ...f, share_payer_pct: v }))
  }

  const updateCustomAmount = (e) => {
    setForm((f) => ({ ...f, share_payer_amount: e.target.value }))
  }

  // Aperçu du partage en temps réel (centimes)
  const amountCents = Math.round(Number(form.amount || 0) * 100)
  let myCents = 0
  if (shareMode === 'custom_amount') {
    myCents = Math.round(Number(form.share_payer_amount || 0) * 100)
    if (myCents < 0) myCents = 0
    if (myCents > amountCents) myCents = amountCents
  } else {
    myCents = Math.round((amountCents * Number(form.share_payer_pct)) / 100)
  }
  const otherCents = Math.max(0, amountCents - myCents)

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      setError(`Fichier trop volumineux (${MAX_FILE_MB} Mo max).`)
      e.target.value = ''
      return
    }
    setError(null)
    setReceiptFile(file)
  }

  const removeFile = () => {
    setReceiptFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const submit = async (e) => {
    e.preventDefault()
    setError(null)

    const amount = Number(form.amount)
    if (!form.description.trim())
      return setError('Donne un libellé à la dépense.')
    if (!amount || amount <= 0)
      return setError('Le montant doit être supérieur à 0.')

    const payload = {
      description: form.description,
      category: form.category,
      amount: form.amount,
      incurred_on: form.incurred_on,
      child_id: form.child_id,
      share_mode: shareMode === 'custom_amount' ? 'amount' : 'pct',
      share_payer_pct: form.share_payer_pct,
      share_payer_amount: form.share_payer_amount,
    }

    try {
      if (isEdit) {
        await updateExpense.mutateAsync({ id: expense.id, patch: payload })
      } else {
        await addExpense.mutateAsync({ ...payload, receipt_file: receiptFile })
      }
      onSuccess?.()
    } catch (err) {
      const msg = err?.message || "Impossible d'enregistrer la dépense."
      if (msg.includes('free_plan_limit_expenses')) {
        setError(
          'Plan gratuit limité à 10 dépenses par mois. Passe en Premium pour lever la limite.',
        )
      } else {
        setError(msg)
      }
    }
  }

  const isPending = isEdit ? updateExpense.isPending : addExpense.isPending

  return (
    <form onSubmit={submit} className="space-y-md">
      <div>
        <label className="label" htmlFor="description">
          Libellé
        </label>
        <input
          id="description"
          type="text"
          required
          placeholder="ex : Consultation orthodontiste"
          value={form.description}
          onChange={update('description')}
          className="input"
        />
      </div>

      <div className="grid grid-cols-2 gap-md">
        <div>
          <label className="label" htmlFor="amount">
            Montant (€)
          </label>
          <input
            id="amount"
            type="number"
            step="0.01"
            min="0.01"
            required
            placeholder="0,00"
            value={form.amount}
            onChange={update('amount')}
            className="input"
            inputMode="decimal"
          />
        </div>

        <div>
          <label className="label" htmlFor="incurred_on">
            Date
          </label>
          <input
            id="incurred_on"
            type="date"
            required
            value={form.incurred_on}
            onChange={update('incurred_on')}
            className="input"
          />
        </div>
      </div>

      <div>
        <label className="label" htmlFor="category">
          Catégorie
        </label>
        <select
          id="category"
          value={form.category}
          onChange={update('category')}
          className="input"
        >
          {EXPENSE_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      {children.length > 0 && (
        <div>
          <label className="label" htmlFor="child_id">
            Enfant concerné (optionnel)
          </label>
          <select
            id="child_id"
            value={form.child_id}
            onChange={update('child_id')}
            className="input"
          >
            <option value="">Toute la fratrie</option>
            {children.map((c) => (
              <option key={c.id} value={c.id}>
                {c.first_name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <span className="label">Partage avec le co-parent</span>
        <div className="grid grid-cols-2 gap-1 mt-1">
          {SHARE_MODES.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => selectShareMode(opt.id)}
              className={[
                'px-3 py-2 rounded-md text-label-sm font-semibold border transition-colors',
                shareMode === opt.id
                  ? 'bg-primary text-on-primary border-primary'
                  : 'bg-surface-container-lowest border-outline-variant text-on-surface hover:bg-surface-container-low',
              ].join(' ')}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {shareMode === 'custom_pct' && (
          <div className="mt-sm flex items-center gap-md">
            <label
              htmlFor="share_payer_pct"
              className="text-body-md text-on-surface-variant whitespace-nowrap"
            >
              Ma part :
            </label>
            <input
              id="share_payer_pct"
              type="number"
              min="0"
              max="100"
              step="1"
              value={form.share_payer_pct}
              onChange={updateCustomPct}
              className="input w-24"
              inputMode="numeric"
            />
            <span className="text-body-md text-on-surface-variant">%</span>
          </div>
        )}

        {shareMode === 'custom_amount' && (
          <div className="mt-sm flex items-center gap-md">
            <label
              htmlFor="share_payer_amount"
              className="text-body-md text-on-surface-variant whitespace-nowrap"
            >
              Ma part :
            </label>
            <input
              id="share_payer_amount"
              type="number"
              min="0"
              step="0.01"
              placeholder="0,00"
              value={form.share_payer_amount}
              onChange={updateCustomAmount}
              className="input w-32"
              inputMode="decimal"
            />
            <span className="text-body-md text-on-surface-variant">€</span>
          </div>
        )}

        {amountCents > 0 && (
          <p className="text-caption text-on-surface-variant mt-2">
            Toi : <strong>{(myCents / 100).toFixed(2)} €</strong>
            {' · '}
            Co-parent : <strong>{(otherCents / 100).toFixed(2)} €</strong>
          </p>
        )}
      </div>

      {!isEdit && (
        <div>
          <span className="label">Facture ou justificatif (optionnel)</span>
          <input
            ref={fileInputRef}
            id="receipt_file"
            type="file"
            accept="image/*,application/pdf"
            onChange={handleFileChange}
            className="sr-only"
          />
          {!receiptFile ? (
            <label
              htmlFor="receipt_file"
              className="flex items-center gap-sm p-md border border-dashed border-outline rounded-md text-body-md text-on-surface-variant cursor-pointer hover:bg-surface-container-low transition-colors"
            >
              <Paperclip size={18} strokeWidth={2} />
              Ajouter une facture (PDF ou image, {MAX_FILE_MB} Mo max)
            </label>
          ) : (
            <div className="flex items-center gap-sm p-md border border-outline rounded-md bg-surface-container-low">
              <Paperclip size={18} className="text-primary flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-body-md font-semibold text-on-surface truncate">
                  {receiptFile.name}
                </p>
                <p className="text-caption text-on-surface-variant">
                  {(receiptFile.size / 1024).toFixed(0)} Ko
                </p>
              </div>
              <button
                type="button"
                onClick={removeFile}
                className="p-1 rounded-full text-on-surface-variant hover:bg-surface-container"
                aria-label="Retirer la facture"
              >
                <X size={18} />
              </button>
            </div>
          )}
        </div>
      )}

      {isEdit && expense.receipt_path && (
        <p className="text-caption text-on-surface-variant">
          Une facture est déjà attachée. La modification de la pièce jointe
          n'est pas encore disponible.
        </p>
      )}

      {error && (
        <div className="text-body-md text-on-error-container bg-error-container rounded-md p-3">
          {error}
        </div>
      )}

      <div className="flex gap-md pt-sm">
        <button type="button" onClick={onCancel} className="btn-secondary flex-1">
          Annuler
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="btn-primary flex-1"
        >
          {isPending
            ? isEdit
              ? 'Enregistrement…'
              : 'Création…'
            : isEdit
              ? 'Enregistrer'
              : 'Créer la dépense'}
        </button>
      </div>
    </form>
  )
}
