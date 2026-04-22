import { useState } from 'react'
import { useAddEvent, useUpdateEvent, EVENT_KINDS } from '../../hooks/useEvents'
import { useChildren } from '../../hooks/useChildren'

// Helpers pour produire "YYYY-MM-DDTHH:mm" au format input datetime-local
const pad = (n) => String(n).padStart(2, '0')
const toLocalInput = (d) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`

/**
 * Formulaire dual création / édition d'un événement.
 *
 * - Si `event` est fourni → mode édition (update)
 * - Sinon → mode création (insert)
 */
export default function AddEventForm({ initialDate, event, onSuccess, onCancel }) {
  const isEdit = !!event
  const addEvent = useAddEvent()
  const updateEvent = useUpdateEvent()
  const { data: children = [] } = useChildren()

  const defaultStart = event?.starts_at
    ? new Date(event.starts_at)
    : initialDate
      ? new Date(initialDate)
      : new Date()
  if (!event) defaultStart.setMinutes(0, 0, 0)

  const defaultEnd = event?.ends_at
    ? new Date(event.ends_at)
    : (() => {
        const d = new Date(defaultStart)
        d.setHours(defaultStart.getHours() + 1)
        return d
      })()

  const [form, setForm] = useState({
    title: event?.title ?? '',
    kind: event?.kind ?? 'custody',
    starts_at: toLocalInput(defaultStart),
    ends_at: toLocalInput(defaultEnd),
    description: event?.description ?? '',
    child_id: event?.child_id ?? '',
  })
  const [error, setError] = useState(null)

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setError(null)
    try {
      if (isEdit) {
        await updateEvent.mutateAsync({ eventId: event.id, patch: form })
      } else {
        await addEvent.mutateAsync(form)
      }
      onSuccess?.()
    } catch (err) {
      setError(err.message || (isEdit ? 'Erreur lors de la modification.' : 'Erreur lors de la création.'))
    }
  }

  const isPending = isEdit ? updateEvent.isPending : addEvent.isPending

  return (
    <form onSubmit={submit} className="space-y-md">
      <div>
        <label className="label" htmlFor="title">Titre</label>
        <input
          id="title"
          type="text"
          required
          placeholder="ex : Garde semaine paire"
          value={form.title}
          onChange={update('title')}
          className="input"
        />
      </div>

      <div>
        <label className="label" htmlFor="kind">Type</label>
        <select id="kind" value={form.kind} onChange={update('kind')} className="input">
          {EVENT_KINDS.map((k) => (
            <option key={k.value} value={k.value}>{k.label}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-md">
        <div>
          <label className="label" htmlFor="starts_at">Début</label>
          <input
            id="starts_at"
            type="datetime-local"
            required
            value={form.starts_at}
            onChange={update('starts_at')}
            className="input"
          />
        </div>
        <div>
          <label className="label" htmlFor="ends_at">Fin</label>
          <input
            id="ends_at"
            type="datetime-local"
            required
            value={form.ends_at}
            onChange={update('ends_at')}
            className="input"
          />
        </div>
      </div>

      {children.length > 0 && (
        <div>
          <label className="label" htmlFor="child_id">Enfant concerné (optionnel)</label>
          <select id="child_id" value={form.child_id} onChange={update('child_id')} className="input">
            <option value="">Toute la fratrie</option>
            {children.map((c) => (
              <option key={c.id} value={c.id}>{c.first_name}</option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="label" htmlFor="description">Note (optionnel)</label>
        <textarea
          id="description"
          rows={2}
          value={form.description}
          onChange={update('description')}
          className="input resize-none"
          placeholder="ex : passage chez le dentiste à 16h"
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
        <button type="submit" disabled={isPending} className="btn-primary flex-1">
          {isPending
            ? (isEdit ? 'Enregistrement…' : 'Création…')
            : (isEdit ? 'Enregistrer' : 'Créer')}
        </button>
      </div>
    </form>
  )
}
