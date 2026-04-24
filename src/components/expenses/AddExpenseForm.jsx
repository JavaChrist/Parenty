import { useRef, useState } from 'react'
import { Paperclip, X } from 'lucide-react'
import { useAddExpense, EXPENSE_CATEGORIES } from '../../hooks/useExpenses'
import { useChildren } from '../../hooks/useChildren'

const today = () => new Date().toISOString().slice(0, 10)
const MAX_FILE_MB = 10

export default function AddExpenseForm({ onSuccess, onCancel }) {
  const addExpense = useAddExpense()
  const { data: children = [] } = useChildren()
  const fileInputRef = useRef(null)

  const [form, setForm] = useState({
    description: '',
    category: 'other',
    amount: '',
    incurred_on: today(),
    child_id: '',
    share_payer_pct: 50,
  })
  const [shareMode, setShareMode] = useState('5050')
  const [receiptFile, setReceiptFile] = useState(null)
  const [error, setError] = useState(null)

  const update = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.value }))

  const selectShareMode = (mode) => {
    setShareMode(mode)
    if (mode === '5050') setForm((f) => ({ ...f, share_payer_pct: 50 }))
    else if (mode === 'all_me') setForm((f) => ({ ...f, share_payer_pct: 100 }))
    else if (mode === 'all_other') setForm((f) => ({ ...f, share_payer_pct: 0 }))
  }

  const updateCustomPct = (e) => {
    let v = Number(e.target.value)
    if (Number.isNaN(v)) v = 50
    v = Math.max(0, Math.min(100, v))
    setForm((f) => ({ ...f, share_payer_pct: v }))
  }

  // Aperçu du partage en temps réel
  const amountCents = Math.round(Number(form.amount || 0) * 100)
  const myCents = Math.round((amountCents * Number(form.share_payer_pct)) / 100)
  const otherCents = amountCents - myCents

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
    if (!form.description.trim()) return setError('Donne un libellé à la dépense.')
    if (!amount || amount <= 0) return setError('Le montant doit être supérieur à 0.')

    try {
      await addExpense.mutateAsync({ ...form, receipt_file: receiptFile })
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
          {[
            { id: '5050', label: '50 / 50' },
            { id: 'all_me', label: '100% à ma charge' },
            { id: 'all_other', label: '100% au co-parent' },
            { id: 'custom', label: 'Personnalisé' },
          ].map((opt) => (
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
        {shareMode === 'custom' && (
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
        {amountCents > 0 && (
          <p className="text-caption text-on-surface-variant mt-2">
            Toi : <strong>{(myCents / 100).toFixed(2)} €</strong>
            {' · '}
            Co-parent : <strong>{(otherCents / 100).toFixed(2)} €</strong>
          </p>
        )}
      </div>

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
          disabled={addExpense.isPending}
          className="btn-primary flex-1"
        >
          {addExpense.isPending ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </div>
    </form>
  )
}
