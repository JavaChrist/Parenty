import { useState } from 'react'
import { Pencil, XOctagon, Clock, CalendarDays } from 'lucide-react'
import Modal from '../ui/Modal'
import AddEventForm from './AddEventForm'
import { EVENT_KINDS, useCancelEvent } from '../../hooks/useEvents'

const KIND_META = Object.fromEntries(EVENT_KINDS.map((k) => [k.value, k]))

const KIND_BG = {
  custody: 'bg-primary-container text-on-primary-container',
  vacation: 'bg-tertiary-fixed text-on-tertiary-fixed-variant',
  school: 'bg-surface-container-high text-on-surface',
  medical: 'bg-error-container text-on-error-container',
  other: 'bg-surface-container text-on-surface-variant',
}

function formatDateRange(start, end) {
  const s = new Date(start)
  const e = new Date(end)
  const sameDay =
    s.getFullYear() === e.getFullYear() &&
    s.getMonth() === e.getMonth() &&
    s.getDate() === e.getDate()

  const dateOpts = { weekday: 'long', day: 'numeric', month: 'long' }
  const timeOpts = { hour: '2-digit', minute: '2-digit' }

  if (sameDay) {
    return {
      date: s.toLocaleDateString('fr-FR', dateOpts),
      time: `${s.toLocaleTimeString('fr-FR', timeOpts)} → ${e.toLocaleTimeString('fr-FR', timeOpts)}`,
    }
  }
  return {
    date: `${s.toLocaleDateString('fr-FR', dateOpts)} → ${e.toLocaleDateString('fr-FR', dateOpts)}`,
    time: `${s.toLocaleTimeString('fr-FR', timeOpts)} → ${e.toLocaleTimeString('fr-FR', timeOpts)}`,
  }
}

/**
 * Modal affiché quand on clique sur un événement existant.
 *
 * États :
 *  - view   : vue détail (par défaut)
 *  - edit   : formulaire d'édition
 *  - cancel : confirmation d'annulation avec raison optionnelle
 */
export default function EventDetailModal({ event, open, onClose }) {
  const [mode, setMode] = useState('view')
  const [cancelReason, setCancelReason] = useState('')
  const [error, setError] = useState(null)
  const cancelEvent = useCancelEvent()

  const reset = () => {
    setMode('view')
    setCancelReason('')
    setError(null)
  }

  const handleClose = () => {
    reset()
    onClose?.()
  }

  const handleCancel = async () => {
    setError(null)
    try {
      await cancelEvent.mutateAsync({
        eventId: event.id,
        reason: cancelReason,
      })
      handleClose()
    } catch (err) {
      setError(err.message || "Erreur lors de l'annulation.")
    }
  }

  if (!event) return null

  const kindMeta = KIND_META[event.kind]
  const kindClass = KIND_BG[event.kind] ?? KIND_BG.other
  const range = formatDateRange(event.starts_at, event.ends_at)

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={
        mode === 'edit'
          ? "Modifier l'événement"
          : mode === 'cancel'
            ? "Annuler l'événement"
            : event.title
      }
    >
      {mode === 'view' && (
        <div className="space-y-md">
          <div className="flex items-start gap-md">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${kindClass}`}>
              <CalendarDays size={22} />
            </div>
            <div className="flex-1 min-w-0">
              <span className="pill-neutral">{kindMeta?.label ?? event.kind}</span>
              <p className="text-body-md text-on-surface mt-sm flex items-center gap-2 capitalize">
                <CalendarDays size={16} className="text-on-surface-variant" />
                {range.date}
              </p>
              <p className="text-body-md text-on-surface-variant mt-1 flex items-center gap-2">
                <Clock size={16} />
                {range.time}
              </p>
            </div>
          </div>

          {event.description && (
            <div className="card-flat p-md">
              <p className="text-body-md text-on-surface whitespace-pre-wrap">
                {event.description}
              </p>
            </div>
          )}

          <div className="flex gap-md pt-sm">
            <button
              type="button"
              onClick={() => setMode('cancel')}
              className="btn-danger flex-1"
            >
              <XOctagon size={16} strokeWidth={2.25} />
              Annuler
            </button>
            <button
              type="button"
              onClick={() => setMode('edit')}
              className="btn-primary flex-1"
            >
              <Pencil size={16} strokeWidth={2.25} />
              Modifier
            </button>
          </div>

          <p className="text-caption text-on-surface-variant/70 text-center">
            Les événements ne sont pas supprimés : une annulation reste historisée.
          </p>
        </div>
      )}

      {mode === 'edit' && (
        <AddEventForm
          event={event}
          onSuccess={handleClose}
          onCancel={() => setMode('view')}
        />
      )}

      {mode === 'cancel' && (
        <div className="space-y-md">
          <p className="text-body-md text-on-surface">
            Tu es sur le point d'annuler <strong>« {event.title} »</strong>.
            L'événement restera visible dans l'historique avec la raison ci-dessous.
          </p>

          <div>
            <label className="label" htmlFor="cancel-reason">Raison (optionnel)</label>
            <textarea
              id="cancel-reason"
              rows={3}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="input resize-none"
              placeholder="ex : rendez-vous reporté au lundi suivant"
            />
          </div>

          {error && (
            <div className="text-body-md text-on-error-container bg-error-container rounded-md p-3">
              {error}
            </div>
          )}

          <div className="flex gap-md pt-sm">
            <button
              type="button"
              onClick={() => setMode('view')}
              className="btn-secondary flex-1"
              disabled={cancelEvent.isPending}
            >
              Retour
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="btn-danger flex-1"
              disabled={cancelEvent.isPending}
            >
              {cancelEvent.isPending ? 'Annulation…' : "Confirmer l'annulation"}
            </button>
          </div>
        </div>
      )}
    </Modal>
  )
}
