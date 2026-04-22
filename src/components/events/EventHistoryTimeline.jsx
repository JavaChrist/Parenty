import { useMemo } from 'react'
import { Plus, Pencil, Ban, History as HistoryIcon } from 'lucide-react'
import { useEventHistory } from '../../hooks/useEvents'
import { useProfiles } from '../../hooks/useProfile'

const ACTION_META = {
  created: {
    label: 'Créé',
    icon: Plus,
    iconClass: 'bg-primary-container text-on-primary-container',
  },
  updated: {
    label: 'Modifié',
    icon: Pencil,
    iconClass: 'bg-surface-container-high text-on-surface',
  },
  cancelled: {
    label: 'Annulé',
    icon: Ban,
    iconClass: 'bg-surface-container text-on-surface-variant',
  },
}

const TRACKED_FIELDS = [
  { key: 'title', label: 'Titre' },
  { key: 'description', label: 'Description' },
  { key: 'kind', label: 'Type' },
  { key: 'starts_at', label: 'Début', isDate: true },
  { key: 'ends_at', label: 'Fin', isDate: true },
  { key: 'child_id', label: 'Enfant concerné' },
  { key: 'cancel_reason', label: "Raison d'annulation" },
]

function formatValue(value, isDate) {
  if (value === null || value === undefined || value === '') return '—'
  if (isDate) {
    return new Date(value).toLocaleString('fr-FR', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  }
  return String(value)
}

/**
 * Calcule les champs modifiés entre deux snapshots.
 * On se limite à un set restreint de champs "parlants" (TRACKED_FIELDS) pour
 * ne pas noyer l'utilisateur avec updated_at, created_by, etc.
 */
function diffSnapshots(prev, current) {
  if (!prev || !current) return []
  const diffs = []
  for (const field of TRACKED_FIELDS) {
    const a = prev[field.key]
    const b = current[field.key]
    if (a !== b && !(a == null && b == null)) {
      diffs.push({ ...field, from: a, to: b })
    }
  }
  return diffs
}

function formatDate(iso) {
  const d = new Date(iso)
  return d.toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('fr-FR', {
    hour: '2-digit', minute: '2-digit',
  })
}

export default function EventHistoryTimeline({ eventId }) {
  const { data: entries = [], isLoading, error } = useEventHistory(eventId)

  const authorIds = useMemo(
    () => [...new Set(entries.map((e) => e.changed_by).filter(Boolean))],
    [entries],
  )
  const { data: profilesById } = useProfiles(authorIds)

  // Entrées triées du plus récent au plus ancien (déjà trié en DB).
  // Pour calculer le diff d'une entrée "updated", on se base sur la version
  // chronologiquement précédente — donc l'entrée suivante dans la liste.
  const rows = useMemo(() => {
    return entries.map((entry, idx) => {
      const prev = entries[idx + 1]
      const diffs = entry.action === 'updated'
        ? diffSnapshots(prev?.snapshot, entry.snapshot)
        : []
      return { entry, diffs }
    })
  }, [entries])

  if (isLoading) {
    return (
      <p className="text-body-md text-on-surface-variant text-center py-md">
        Chargement de l'historique…
      </p>
    )
  }

  if (error) {
    return (
      <div className="text-body-md text-on-error-container bg-error-container rounded-md p-3">
        Impossible de charger l'historique : {error.message}
      </div>
    )
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-lg text-on-surface-variant">
        <HistoryIcon size={32} className="mx-auto mb-sm opacity-60" />
        <p className="text-body-md">Aucun historique pour cet événement.</p>
      </div>
    )
  }

  return (
    <ol className="relative space-y-md">
      {rows.map(({ entry, diffs }, idx) => {
        const meta = ACTION_META[entry.action] ?? ACTION_META.updated
        const Icon = meta.icon
        const authorName = (() => {
          const p = profilesById?.[entry.changed_by]
          if (!p) return null
          const full = [p.first_name, p.last_name].filter(Boolean).join(' ').trim()
          return full || null
        })()

        return (
          <li key={entry.id} className="flex gap-md">
            <div className="flex flex-col items-center flex-shrink-0">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center ${meta.iconClass}`}
              >
                <Icon size={16} strokeWidth={2.25} />
              </div>
              {idx < rows.length - 1 && (
                <div className="w-px flex-1 bg-outline-variant/50 my-1" />
              )}
            </div>

            <div className="flex-1 min-w-0 pb-md">
              <div className="flex items-baseline justify-between gap-2 flex-wrap">
                <p className="text-body-md text-on-surface">
                  <strong>{meta.label}</strong>
                  {authorName && <> par {authorName}</>}
                </p>
                <p className="text-caption text-on-surface-variant whitespace-nowrap">
                  {formatDate(entry.changed_at)} · {formatTime(entry.changed_at)}
                </p>
              </div>

              {entry.action === 'cancelled' && entry.snapshot?.cancel_reason && (
                <p className="text-body-md text-on-surface-variant mt-1">
                  <span className="text-caption text-on-surface-variant/80">Raison : </span>
                  {entry.snapshot.cancel_reason}
                </p>
              )}

              {diffs.length > 0 && (
                <ul className="mt-sm space-y-1">
                  {diffs.map((d) => (
                    <li
                      key={d.key}
                      className="text-caption text-on-surface-variant bg-surface-container-low rounded-md px-2 py-1"
                    >
                      <span className="font-medium text-on-surface">{d.label}</span>
                      {' : '}
                      <span className="line-through opacity-70">
                        {formatValue(d.from, d.isDate)}
                      </span>
                      {' → '}
                      <span className="text-on-surface">
                        {formatValue(d.to, d.isDate)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              {entry.action === 'updated' && diffs.length === 0 && (
                <p className="text-caption text-on-surface-variant/70 mt-1 italic">
                  Modification mineure
                </p>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
