import { useState } from 'react'
import {
  useAddCustodySchedule,
  RECURRENCE_OPTIONS,
  DAYS_OF_WEEK,
} from '../../hooks/useCustodySchedules'
import { useFamilyMembers } from '../../hooks/useFamilyMembers'
import { useProfiles } from '../../hooks/useProfile'
import { useAuthStore } from '../../stores/authStore'

function displayName(profile, fallback = 'Parent') {
  if (!profile) return fallback
  const full = [profile.first_name, profile.last_name]
    .filter(Boolean)
    .join(' ')
    .trim()
  return full || fallback
}

export default function CustodyScheduleForm({ onSuccess, onCancel }) {
  const user = useAuthStore((s) => s.user)
  const { data: members = [] } = useFamilyMembers()
  const parents = members.filter(
    (m) => m.role === 'owner' || m.role === 'parent',
  )
  const parentIds = parents.map((p) => p.user_id)
  const { data: profilesById = {} } = useProfiles(parentIds)
  const addSchedule = useAddCustodySchedule()

  const [form, setForm] = useState({
    parent_user_id: user?.id || '',
    label: '',
    start_day_of_week: 0,
    start_time: '17:00',
    end_day_of_week: 3,
    end_time: '10:00',
    recurrence: 'weekly',
    valid_from: '',
    valid_to: '',
  })
  const [error, setError] = useState(null)

  const update = (key) => (e) => {
    const value = e.target.type === 'number' ? Number(e.target.value) : e.target.value
    setForm((f) => ({ ...f, [key]: value }))
  }

  const submit = async (e) => {
    e.preventDefault()
    setError(null)
    if (!form.parent_user_id) return setError('Choisis quel parent a la garde.')
    try {
      await addSchedule.mutateAsync(form)
      onSuccess?.()
    } catch (err) {
      setError(err.message || 'Impossible de créer le schéma.')
    }
  }

  return (
    <form onSubmit={submit} className="space-y-md">
      <div>
        <label className="label" htmlFor="parent_user_id">
          Parent responsable
        </label>
        <select
          id="parent_user_id"
          value={form.parent_user_id}
          onChange={update('parent_user_id')}
          className="input"
          required
        >
          <option value="">— Choisir un parent —</option>
          {parents.map((p) => {
            const name = displayName(
              profilesById[p.user_id],
              p.user_id === user?.id ? 'Toi' : 'Co-parent',
            )
            return (
              <option key={p.user_id} value={p.user_id}>
                {name}
              </option>
            )
          })}
        </select>
      </div>

      <div>
        <label className="label" htmlFor="label">
          Libellé (optionnel)
        </label>
        <input
          id="label"
          type="text"
          placeholder="ex : Chez Papa"
          value={form.label}
          onChange={update('label')}
          className="input"
        />
      </div>

      <div className="grid grid-cols-2 gap-md">
        <div>
          <label className="label" htmlFor="start_day_of_week">Début — jour</label>
          <select
            id="start_day_of_week"
            value={form.start_day_of_week}
            onChange={update('start_day_of_week')}
            className="input"
          >
            {DAYS_OF_WEEK.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="start_time">Début — heure</label>
          <input
            id="start_time"
            type="time"
            required
            value={form.start_time}
            onChange={update('start_time')}
            className="input"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-md">
        <div>
          <label className="label" htmlFor="end_day_of_week">Fin — jour</label>
          <select
            id="end_day_of_week"
            value={form.end_day_of_week}
            onChange={update('end_day_of_week')}
            className="input"
          >
            {DAYS_OF_WEEK.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="end_time">Fin — heure</label>
          <input
            id="end_time"
            type="time"
            required
            value={form.end_time}
            onChange={update('end_time')}
            className="input"
          />
        </div>
      </div>

      <div>
        <label className="label" htmlFor="recurrence">Récurrence</label>
        <select
          id="recurrence"
          value={form.recurrence}
          onChange={update('recurrence')}
          className="input"
        >
          {RECURRENCE_OPTIONS.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
        <p className="text-caption text-on-surface-variant mt-1">
          Semaines paires / impaires = numéro ISO de la semaine dans l'année.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-md">
        <div>
          <label className="label" htmlFor="valid_from">Valide à partir du (optionnel)</label>
          <input
            id="valid_from"
            type="date"
            value={form.valid_from}
            onChange={update('valid_from')}
            className="input"
          />
        </div>
        <div>
          <label className="label" htmlFor="valid_to">Valide jusqu'au (optionnel)</label>
          <input
            id="valid_to"
            type="date"
            value={form.valid_to}
            onChange={update('valid_to')}
            className="input"
          />
        </div>
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
          disabled={addSchedule.isPending}
          className="btn-primary flex-1"
        >
          {addSchedule.isPending ? 'Création…' : 'Créer le schéma'}
        </button>
      </div>
    </form>
  )
}
