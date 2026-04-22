import { useState } from 'react'
import { useRejectExpense } from '../../hooks/useExpenses'

export default function RejectExpenseForm({ expenseId, onSuccess, onCancel }) {
  const reject = useRejectExpense()
  const [reason, setReason] = useState('')
  const [error, setError] = useState(null)

  const submit = async (e) => {
    e.preventDefault()
    setError(null)
    if (!reason.trim()) {
      setError('Un motif de refus est obligatoire.')
      return
    }
    try {
      await reject.mutateAsync({ expenseId, reason })
      onSuccess?.()
    } catch (err) {
      setError(err.message || 'Erreur lors du refus.')
    }
  }

  return (
    <form onSubmit={submit} className="space-y-md">
      <p className="text-body-md text-on-surface-variant">
        Explique pourquoi tu refuses cette dépense. Le co-parent pourra voir ton motif.
      </p>

      <div>
        <label className="label" htmlFor="reason">
          Motif de refus
        </label>
        <textarea
          id="reason"
          required
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="input resize-none"
          placeholder="ex : Dépense non prévue dans notre accord…"
        />
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
        <button type="submit" disabled={reject.isPending} className="btn-danger flex-1">
          {reject.isPending ? 'Envoi…' : 'Refuser'}
        </button>
      </div>
    </form>
  )
}
