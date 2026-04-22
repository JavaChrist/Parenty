import { Link } from 'react-router-dom'
import {
  CalendarDays,
  Wallet,
  FolderOpen,
  MessageCircle,
  ArrowRight,
  Baby,
  AlertCircle,
} from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { useExpenses } from '../hooks/useExpenses'
import { useDocuments } from '../hooks/useDocuments'
import { useChildren } from '../hooks/useChildren'
import { useUpcomingEvents } from '../hooks/useEvents'
import { useFamilyMembers } from '../hooks/useFamilyMembers'

const KIND_LABELS = {
  custody: 'Garde',
  vacation: 'Vacances',
  school: 'École',
  medical: 'Santé',
  other: 'Événement',
}

export default function Dashboard() {
  const user = useAuthStore((s) => s.user)
  const prenom = user?.email?.split('@')[0] ?? 'parent'

  const { data: expenses = [] } = useExpenses()
  const { data: documents = [] } = useDocuments()
  const { data: children = [] } = useChildren()
  const { data: upcoming = [] } = useUpcomingEvents(1)
  const { data: members = [] } = useFamilyMembers()

  // Stats
  const user_id = user?.id
  const pendingForMe = expenses.filter(
    (e) => e.status === 'pending' && e.payer_id !== user_id,
  ).length
  const nextEvent = upcoming[0]
  const coParentCount = members.filter((m) => m.user_id !== user_id).length

  return (
    <div className="space-y-lg">
      {/* Salutation */}
      <header className="pt-2">
        <p className="text-body-md text-on-surface-variant">Bonjour</p>
        <h1 className="h-title capitalize">{prenom}</h1>
      </header>

      {/* Prochain événement — carte hero */}
      <section className="card-elevated p-lg bg-gradient-to-br from-primary-container to-primary text-on-primary-container">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <span className="pill bg-white/20 text-on-primary backdrop-blur-sm">
              {nextEvent ? KIND_LABELS[nextEvent.kind] ?? 'Prochain événement' : 'Agenda'}
            </span>
            {nextEvent ? (
              <>
                <h2 className="font-display text-h3 mt-3 text-on-primary truncate">
                  {nextEvent.title}
                </h2>
                <p className="text-body-md text-on-primary/80 mt-1">
                  {new Date(nextEvent.starts_at).toLocaleString('fr-FR', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </>
            ) : (
              <>
                <h2 className="font-display text-h3 mt-3 text-on-primary">
                  Aucun événement à venir
                </h2>
                <p className="text-body-md text-on-primary/80 mt-1">
                  Crée ton premier événement dans l'agenda.
                </p>
              </>
            )}
          </div>
          <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center text-on-primary flex-shrink-0">
            <CalendarDays size={24} strokeWidth={2} />
          </div>
        </div>

        <Link
          to="/calendar"
          className="inline-flex items-center gap-1 mt-lg text-label-sm font-semibold text-on-primary hover:opacity-80"
        >
          Voir l'agenda <ArrowRight size={16} />
        </Link>
      </section>

      {/* Grille récap 2x2 */}
      <section className="grid grid-cols-2 gap-md">
        <StatCard
          to="/expenses"
          icon={Wallet}
          label="À valider"
          value={pendingForMe}
          hint={pendingForMe > 1 ? 'dépenses' : 'dépense'}
          accent={pendingForMe > 0}
        />
        <StatCard
          to="/documents"
          icon={FolderOpen}
          label="Documents"
          value={documents.length}
          hint="partagés"
        />
        <StatCard
          to="/chat"
          icon={MessageCircle}
          label="Messages"
          value="—"
          hint="bientôt"
        />
        <StatCard
          to="/profile"
          icon={Baby}
          label="Enfants"
          value={children.length}
          hint={coParentCount > 0 ? '+ co-parent' : '· seul·e'}
        />
      </section>

      {/* Activité récente */}
      <section className="card p-lg">
        <div className="flex items-center justify-between mb-md">
          <h2 className="h-section text-h3 font-semibold text-on-surface">
            Activité récente
          </h2>
          {pendingForMe > 0 ? (
            <span className="pill-warning">{pendingForMe} à valider</span>
          ) : (
            <span className="pill-neutral">À jour</span>
          )}
        </div>

        {expenses.length === 0 && documents.length === 0 && !nextEvent ? (
          <div className="flex flex-col items-center justify-center py-lg text-center gap-2">
            <div className="h-12 w-12 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant">
              <AlertCircle size={22} strokeWidth={2} />
            </div>
            <p className="text-body-md text-on-surface-variant">
              Rien à signaler pour l'instant.
            </p>
            <p className="text-caption text-on-surface-variant/70 max-w-xs">
              Les nouveautés (événements, dépenses, documents) apparaîtront ici.
            </p>
          </div>
        ) : (
          <ul className="space-y-sm">
            {expenses.slice(0, 3).map((e) => (
              <li
                key={e.id}
                className="flex items-center gap-md py-sm border-b last:border-0 border-outline-variant/40"
              >
                <div className="h-9 w-9 rounded-full bg-primary-container/20 flex items-center justify-center text-primary">
                  <Wallet size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-body-md font-semibold text-on-surface truncate">
                    {e.description}
                  </p>
                  <p className="text-caption text-on-surface-variant">
                    {(e.amount_cents / 100).toFixed(2)} € · {e.status}
                  </p>
                </div>
                <Link to="/expenses" className="text-caption text-primary font-semibold">
                  Voir
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function StatCard({ to, icon: Icon, label, value, hint, accent }) {
  return (
    <Link
      to={to}
      className="card p-md flex flex-col gap-2 hover:shadow-card-hover transition-shadow"
    >
      <div
        className={`h-10 w-10 rounded-full flex items-center justify-center ${
          accent
            ? 'bg-tertiary-fixed text-on-tertiary-fixed-variant'
            : 'bg-primary-container/20 text-primary'
        }`}
      >
        <Icon size={20} strokeWidth={2} />
      </div>
      <div>
        <p className="text-caption text-on-surface-variant uppercase tracking-wide">
          {label}
        </p>
        <div className="flex items-baseline gap-2 mt-0.5">
          <span className="font-display text-h3 font-bold text-on-surface">
            {value}
          </span>
          <span className="text-caption text-on-surface-variant">{hint}</span>
        </div>
      </div>
    </Link>
  )
}
