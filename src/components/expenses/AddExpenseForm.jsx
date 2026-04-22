import { useState } from 'react'
import { useAddExpense, EXPENSE_CATEGORIES } from '../../hooks/useExpenses'
import { useChildren } from '../../hooks/useChildren'

const today = () => new Date().toISOString().slice(0, 10)

export default function AddExpenseForm({ onSuccess, onCancel }) {
  const addExpense = useAddExpense()
  const { data: children = [] } = useChildren()

  const [form, setForm] = useState({
    description: '',
    category: 'other',
    amount: '',
    incurred_on: today(),
    child_id: '',
  })
  const [error, setError] = useState(null)

  const update = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setError(null)

    const amount = Number(form.amount)
    if (!form.description.trim()) return setError('Donne un libellé à la dépense.')
    if (!amount || amount <= 0) return setError('Le montant doit être supérieur à 0.')

    try {
      await addExpense.mutateAsync(form)
      onSuccess?.()
    } catch (err) {
      setError(err.message || 'Impossible d\'enregistrer la dépense.')
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
