import { useState } from 'react'
import { Plus, Trash2, Repeat, Pencil } from 'lucide-react'
import {
  useCustodySchedules,
  useDeleteCustodySchedule,
  DAYS_OF_WEEK,
  RECURRENCE_OPTIONS,
} from '../../hooks/useCustodySchedules'
import { useFamilyMembers } from '../../hooks/useFamilyMembers'
import { useProfiles } from '../../hooks/useProfile'
import { useAuthStore } from '../../stores/authStore'
import Modal from '../ui/Modal'
import CustodyScheduleForm from './CustodyScheduleForm'
import { custodyColorFor } from './custodyColors'

const dayLabel = (v) => DAYS_OF_WEEK.find((d) => d.value === v)?.short ?? '?'
const recurrenceLabel = (v) =>
  RECURRENCE_OPTIONS.find((r) => r.value === v)?.label ?? v

function parentName(profile, isMe) {
  if (profile) {
    const full = [profile.first_name, profile.last_name]
      .filter(Boolean)
      .join(' ')
      .trim()
    if (full) return full
  }
  return isMe ? 'Toi' : 'Co-parent'
}

export default function CustodySchedulesCard() {
  const user = useAuthStore((s) => s.user)
  const { data: schedules = [], isLoading } = useCustodySchedules()
  const { data: members = [] } = useFamilyMembers()
  const deleteSchedule = useDeleteCustodySchedule()
  const parentIds = members
    .filter((m) => m.role === 'owner' || m.role === 'parent')
    .map((m) => m.user_id)
  const { data: profilesById = {} } = useProfiles(parentIds)

  const [addOpen, setAddOpen] = useState(false)
  const [editing, setEditing] = useState(null)

  const onDelete = (s) => {
    if (
      confirm(
        `Supprimer le schéma "${s.label || 'Garde'}" ? Les événements virtuels disparaîtront du calendrier.`,
      )
    ) {
      deleteSchedule.mutate(s.id)
    }
  }

  return (
    <section className="card p-md space-y-sm">
      <header className="flex items-center justify-between gap-sm">
        <div className="flex items-center gap-sm">
          <Repeat size={18} className="text-primary" strokeWidth={2.2} />
          <h2 className="text-body-lg font-semibold text-on-surface">
            Schéma de garde
          </h2>
        </div>
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="text-label-sm font-semibold text-primary hover:underline inline-flex items-center gap-1"
        >
          <Plus size={14} strokeWidth={2.5} />
          Ajouter
        </button>
      </header>

      {isLoading ? (
        <p className="text-body-md text-on-surface-variant">Chargement…</p>
      ) : schedules.length === 0 ? (
        <p className="text-body-md text-on-surface-variant">
          Aucun schéma. Ajoute ta règle habituelle (ex : « Chez Papa du dimanche
          17h au mercredi 10h ») pour que les gardes s'affichent automatiquement
          dans le calendrier.
        </p>
      ) : (
        <ul className="divide-y divide-outline-variant/40 -mx-md">
          {schedules.map((s) => {
            const color = custodyColorFor(s.parent_user_id)
            const isMe = s.parent_user_id === user?.id
            const name = parentName(profilesById[s.parent_user_id], isMe)
            return (
              <li
                key={s.id}
                className="px-md py-sm flex items-start gap-sm"
              >
                <span
                  className={`mt-1 h-3 w-3 rounded-full flex-shrink-0 ${color.dot}`}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-body-md font-semibold text-on-surface truncate">
                    {s.label || `Chez ${name}`}
                  </p>
                  <p className="text-caption text-on-surface-variant">
                    {dayLabel(s.start_day_of_week)} {s.start_time.slice(0, 5)}
                    {' → '}
                    {dayLabel(s.end_day_of_week)} {s.end_time.slice(0, 5)}
                    {' · '}
                    {recurrenceLabel(s.recurrence)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditing(s)}
                  className="p-2 rounded-full text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors flex-shrink-0"
                  aria-label="Modifier le schéma"
                >
                  <Pencil size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(s)}
                  disabled={deleteSchedule.isPending}
                  className="p-2 rounded-full text-on-surface-variant hover:bg-error-container hover:text-on-error-container transition-colors flex-shrink-0"
                  aria-label="Supprimer le schéma"
                >
                  <Trash2 size={16} />
                </button>
              </li>
            )
          })}
        </ul>
      )}

      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Nouveau schéma de garde"
      >
        <CustodyScheduleForm
          onSuccess={() => setAddOpen(false)}
          onCancel={() => setAddOpen(false)}
        />
      </Modal>

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title="Modifier le schéma de garde"
      >
        {editing && (
          <CustodyScheduleForm
            schedule={editing}
            onSuccess={() => setEditing(null)}
            onCancel={() => setEditing(null)}
          />
        )}
      </Modal>
    </section>
  )
}
