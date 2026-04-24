import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  CalendarDays,
  Wallet,
  FileText,
  Plus,
  Pencil,
  Ban,
  CheckCircle2,
  XCircle,
  History as HistoryIcon,
  ArrowLeft,
  Upload,
} from 'lucide-react'
import { useActivityFeed } from '../hooks/useActivityFeed'
import { useProfiles } from '../hooks/useProfile'
import { usePlanLimits } from '../hooks/usePlanLimits'
import { Crown } from 'lucide-react'

const SOURCE_META = {
  event: {
    label: 'Événement',
    icon: CalendarDays,
    color: 'bg-primary-container text-on-primary-container',
    to: '/calendar',
  },
  expense: {
    label: 'Dépense',
    icon: Wallet,
    color: 'bg-tertiary-fixed text-on-tertiary-fixed-variant',
    to: '/expenses',
  },
  document: {
    label: 'Document',
    icon: FileText,
    color: 'bg-surface-container-high text-on-surface',
    to: '/documents',
  },
}

const ACTION_LABEL = {
  created: { label: 'Créé', icon: Plus },
  updated: { label: 'Modifié', icon: Pencil },
  cancelled: { label: 'Annulé', icon: Ban },
  status_changed: { label: 'Statut changé', icon: CheckCircle2 },
  uploaded: { label: 'Ajouté', icon: Upload },
  deleted: { label: 'Supprimé', icon: XCircle },
}

const FILTERS = [
  { value: 'all', label: 'Tout' },
  { value: 'event', label: 'Événements' },
  { value: 'expense', label: 'Dépenses' },
  { value: 'document', label: 'Documents' },
]

function displayName(p) {
  if (!p) return null
  const full = [p.first_name, p.last_name].filter(Boolean).join(' ').trim()
  return full || null
}

function dayKey(iso) {
  const d = new Date(iso)
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}

function formatDayHeader(iso) {
  const d = new Date(iso)
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)

  const sameDay = (a, b) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()

  if (sameDay(d, today)) return "Aujourd'hui"
  if (sameDay(d, yesterday)) return 'Hier'
  return d.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: d.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
  })
}

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function History() {
  const [filter, setFilter] = useState('all')
  const { data: entries = [], isLoading, error } = useActivityFeed()
  const { isPremium, historyMinDate, historyDays } = usePlanLimits()

  const filtered = useMemo(() => {
    let list = entries
    // Plan gratuit : tronquer à 1 an glissant.
    if (!isPremium && historyMinDate) {
      const cutoff = historyMinDate.getTime()
      list = list.filter((e) => new Date(e.at).getTime() >= cutoff)
    }
    if (filter === 'all') return list
    return list.filter((e) => e.source === filter)
  }, [entries, filter, isPremium, historyMinDate])

  const hiddenCount = useMemo(() => {
    if (isPremium || !historyMinDate) return 0
    const cutoff = historyMinDate.getTime()
    return entries.filter((e) => new Date(e.at).getTime() < cutoff).length
  }, [entries, isPremium, historyMinDate])

  const actorIds = useMemo(
    () => [...new Set(filtered.map((e) => e.actorId).filter(Boolean))],
    [filtered],
  )
  const { data: profilesById } = useProfiles(actorIds)

  // Regroupement par jour
  const groups = useMemo(() => {
    const map = new Map()
    for (const entry of filtered) {
      const k = dayKey(entry.at)
      if (!map.has(k)) map.set(k, { at: entry.at, items: [] })
      map.get(k).items.push(entry)
    }
    return Array.from(map.values())
  }, [filtered])

  return (
    <div className="space-y-lg pb-lg">
      <header className="pt-2">
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-caption text-on-surface-variant hover:text-on-surface mb-sm transition-colors"
        >
          <ArrowLeft size={14} />
          Retour au tableau de bord
        </Link>
        <h1 className="h-title flex items-center gap-2">
          <HistoryIcon size={24} className="text-primary" />
          Historique
        </h1>
        <p className="text-body-md text-on-surface-variant mt-1">
          Journal factuel de toutes les modifications au sein de la famille.
        </p>
      </header>

      {/* Filtres */}
      <div className="flex gap-1 overflow-x-auto -mx-1 px-1 pb-1">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            className={[
              'px-3 py-1.5 rounded-full text-label-sm font-medium whitespace-nowrap transition-colors',
              filter === f.value
                ? 'bg-primary text-on-primary'
                : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container',
            ].join(' ')}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading && (
        <p className="text-body-md text-on-surface-variant text-center py-lg">
          Chargement de l'activité…
        </p>
      )}

      {error && (
        <div className="text-body-md text-on-error-container bg-error-container rounded-md p-3">
          Impossible de charger l'historique : {error.message}
        </div>
      )}

      {!isLoading && !error && filtered.length === 0 && (
        <div className="card p-lg text-center">
          <HistoryIcon size={32} className="mx-auto mb-sm opacity-60 text-on-surface-variant" />
          <p className="text-body-md text-on-surface-variant">
            Aucune activité pour ce filtre.
          </p>
        </div>
      )}

      {!isPremium && hiddenCount > 0 && (
        <div className="card p-md bg-tertiary-fixed/50 border border-tertiary/20">
          <p className="text-body-md text-on-tertiary-fixed-variant">
            <Crown size={14} className="inline -mt-0.5 mr-1" strokeWidth={2} />
            Plan gratuit : historique visible sur {historyDays} jours (
            {hiddenCount} entrée{hiddenCount > 1 ? 's' : ''} plus ancienne
            {hiddenCount > 1 ? 's' : ''} masquée{hiddenCount > 1 ? 's' : ''}).{' '}
            <Link to="/profile" className="font-semibold underline">
              Passe en Premium
            </Link>{' '}
            pour tout voir.
          </p>
        </div>
      )}

      {groups.map((group) => (
        <section key={group.at} className="space-y-sm">
          <h2 className="text-caption tracking-wide text-on-surface-variant font-semibold first-letter:uppercase">
            {formatDayHeader(group.at)}
          </h2>
          <ul className="card divide-y divide-outline-variant/40 overflow-hidden">
            {group.items.map((entry) => {
              const source = SOURCE_META[entry.source]
              const action = ACTION_LABEL[entry.action] ?? {
                label: entry.action,
                icon: Pencil,
              }
              const SourceIcon = source.icon
              const ActionIcon = action.icon
              const actorName = displayName(profilesById?.[entry.actorId])

              const content = (
                <div className="flex items-start gap-md p-md w-full text-left">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${source.color}`}
                  >
                    <SourceIcon size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2 flex-wrap">
                      <p className="text-body-md font-semibold text-on-surface truncate">
                        {entry.ref.label}
                      </p>
                      <p className="text-caption text-on-surface-variant whitespace-nowrap">
                        {formatTime(entry.at)}
                      </p>
                    </div>
                    <p className="text-caption text-on-surface-variant mt-0.5 flex items-center gap-1">
                      <ActionIcon size={12} strokeWidth={2.25} />
                      <span>{source.label}</span>
                      <span>·</span>
                      <span>{action.label}</span>
                      {actorName && (
                        <>
                          <span>·</span>
                          <span>par {actorName}</span>
                        </>
                      )}
                    </p>
                    {entry.action === 'cancelled' && entry.snapshot?.cancel_reason && (
                      <p className="text-caption text-on-surface-variant mt-1 italic">
                        « {entry.snapshot.cancel_reason} »
                      </p>
                    )}
                  </div>
                </div>
              )

              return (
                <li key={entry.id}>
                  <Link
                    to={source.to}
                    className="block hover:bg-surface-container-low transition-colors"
                  >
                    {content}
                  </Link>
                </li>
              )
            })}
          </ul>
        </section>
      ))}
    </div>
  )
}
