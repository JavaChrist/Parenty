import { useState } from 'react'
import {
  useAddCustodySchedule,
  useUpdateCustodySchedule,
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

// Les valeurs `time` peuvent venir du DB en `HH:MM:SS` mais l'input HTML
// veut `HH:MM`. On tronque proprement à 5 caractères.
const trimTime = (t) => (t ? String(t).slice(0, 5) : '')

/**
 * Formulaire dual création / édition d'un schéma de garde.
 *
 * - Si `schedule` est fourni → mode édition (update)
 * - Sinon → mode création (insert)
 */
export default function CustodyScheduleForm({ schedule, onSuccess, onCancel }) {
  const isEdit = !!schedule
  const user = useAuthStore((s) => s.user)
  const { data: members = [] } = useFamilyMembers()
  const parents = members.filter(
    (m) => m.role === 'owner' || m.role === 'parent',
  )
  const parentIds = parents.map((p) => p.user_id)
  const { data: profilesById = {} } = useProfiles(parentIds)
  const addSchedule = useAddCustodySchedule()
  const updateSchedule = useUpdateCustodySchedule()

  const [form, setForm] = useState({
    parent_user_id: schedule?.parent_user_id ?? user?.id ?? '',
    label: schedule?.label ?? '',
    start_day_of_week: schedule?.start_day_of_week ?? 0,
    start_time: trimTime(schedule?.start_time) || '17:00',
    end_day_of_week: schedule?.end_day_of_week ?? 3,
    end_time: trimTime(schedule?.end_time) || '10:00',
    recurrence: schedule?.recurrence ?? 'weekly',
    valid_from: schedule?.valid_from ?? '',
    valid_to: schedule?.valid_to ?? '',
  })
  const [error, setError] = useState(null)

  const update = (key) => (e) => {
    const value =
      e.target.type === 'number' ? Number(e.target.value) : e.target.value
    setForm((f) => ({ ...f, [key]: value }))
  }

  const submit = async (e) => {
    e.preventDefault()
    setError(null)
    if (!form.parent_user_id) return setError('Choisis quel parent a la garde.')
    try {
      if (isEdit) {
        await updateSchedule.mutateAsync({ id: schedule.id, patch: form })
      } else {
        await addSchedule.mutateAsync(form)
      }
      onSuccess?.()
    } catch (err) {
      setError(
        err.message ||
          (isEdit
            ? 'Impossible de mettre à jour le schéma.'
            : 'Impossible de créer le schéma.'),
      )
    }
  }

  const isPending = isEdit ? updateSchedule.isPending : addSchedule.isPending

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

      <div>
        <p className="label mb-2">Période de validité (optionnel)</p>
        <div className="grid grid-cols-2 gap-md">
          <div>
            <label className="text-caption text-on-surface-variant" htmlFor="valid_from">
              À partir du
            </label>
            <input
              id="valid_from"
              type="date"
              value={form.valid_from}
              onChange={update('valid_from')}
              className="input mt-1"
            />
          </div>
          <div>
            <label className="text-caption text-on-surface-variant" htmlFor="valid_to">
              Jusqu'au
            </label>
            <input
              id="valid_to"
              type="date"
              value={form.valid_to}
              onChange={update('valid_to')}
              className="input mt-1"
            />
          </div>
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
          disabled={isPending}
          className="btn-primary flex-1"
        >
          {isPending
            ? isEdit
              ? 'Enregistrement…'
              : 'Création…'
            : isEdit
              ? 'Enregistrer'
              : 'Créer le schéma'}
        </button>
      </div>
    </form>
  )
}
