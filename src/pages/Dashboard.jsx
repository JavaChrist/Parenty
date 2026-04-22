import { Link } from 'react-router-dom'
import {
  CalendarDays,
  Wallet,
  FolderOpen,
  MessageCircle,
  ArrowRight,
  Baby,
  AlertCircle,
  FileText,
  Sparkles,
  ChevronRight,
  History as HistoryIcon,
} from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { useExpenses } from '../hooks/useExpenses'
import { useDocuments } from '../hooks/useDocuments'
import { useChildren } from '../hooks/useChildren'
import { useUpcomingEvents } from '../hooks/useEvents'
import { useFamilyMembers } from '../hooks/useFamilyMembers'
import { useMyProfile } from '../hooks/useProfile'

function greeting() {
  const h = new Date().getHours()
  if (h < 5) return 'Bonne nuit'
  if (h < 12) return 'Bonjour'
  if (h < 18) return 'Bon après-midi'
  return 'Bonsoir'
}

const KIND_LABELS = {
  custody: 'Garde',
  vacation: 'Vacances',
  school: 'École',
  medical: 'Santé',
  other: 'Événement',
}

const EXPENSE_STATUS_LABELS = {
  pending: 'En attente',
  approved: 'Validée',
  rejected: 'Refusée',
}

const EXPENSE_STATUS_PILL = {
  pending: 'pill-warning',
  approved: 'pill-success',
  rejected: 'pill-danger',
}

function timeAgo(isoDate) {
  const diff = Date.now() - new Date(isoDate).getTime()
  const min = Math.round(diff / 60000)
  if (min < 1) return "à l'instant"
  if (min < 60) return `il y a ${min} min`
  const h = Math.round(min / 60)
  if (h < 24) return `il y a ${h} h`
  const d = Math.round(h / 24)
  if (d < 7) return `il y a ${d} j`
  return new Date(isoDate).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
  })
}

export default function Dashboard() {
  const user = useAuthStore((s) => s.user)
  const { data: myProfile } = useMyProfile()
  const prenom =
    myProfile?.first_name?.trim() || user?.email?.split('@')[0] || 'parent'
  const hello = greeting()

  const { data: expenses = [] } = useExpenses()
  const { data: documents = [] } = useDocuments()
  const { data: children = [] } = useChildren()
  // On charge 5 upcoming : 1 pour la carte hero, jusqu'à 5 pour le feed
  // d'activité récente (sinon le feed n'a qu'un seul événement max).
  const { data: upcoming = [] } = useUpcomingEvents(5)
  const { data: members = [] } = useFamilyMembers()

  // Stats
  const user_id = user?.id
  const pendingForMe = expenses.filter(
    (e) => e.status === 'pending' && e.payer_id !== user_id,
  ).length
  const nextEvent = upcoming[0]
  const coParentCount = members.filter((m) => m.user_id !== user_id).length

  // Feed d'activité unifié : on mélange events/expenses/docs, trié par date desc
  const feed = [
    ...expenses.map((e) => ({
      kind: 'expense',
      id: `expense-${e.id}`,
      date: e.created_at ?? e.incurred_on,
      title: e.description,
      subtitle: `${(e.amount_cents / 100).toFixed(2)} €`,
      status: e.status,
      to: '/expenses',
    })),
    ...documents.map((d) => ({
      kind: 'document',
      id: `document-${d.id}`,
      date: d.uploaded_at,
      title: d.title,
      subtitle: 'Nouveau document',
      to: '/documents',
    })),
    ...upcoming.slice(0, 5).map((ev) => ({
      kind: 'event',
      id: `event-${ev.id}`,
      date: ev.starts_at,
      title: ev.title,
      subtitle: KIND_LABELS[ev.kind] ?? 'Événement',
      to: '/calendar',
    })),
  ]
    .filter((x) => x.date)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5)

  return (
    <div className="space-y-lg">
      {/* Salutation */}
      <header className="pt-2">
        <h1 className="h-title">
          {hello},{' '}
          <span className="capitalize text-primary">{prenom}</span>
        </h1>
        <p className="text-body-md text-on-surface-variant mt-1">
          Voici ton tableau de bord familial.
        </p>
      </header>

      {/* Bandeau "Complète ton profil" — uniquement tant que le prénom est vide */}
      {myProfile && !myProfile.first_name && (
        <Link
          to="/profile?edit=personal"
          className="card-elevated p-md flex items-center gap-md bg-gradient-to-br from-tertiary-fixed to-primary-container/60 hover:shadow-card-hover transition-shadow"
        >
          <div className="h-10 w-10 rounded-full bg-white/50 flex items-center justify-center text-primary flex-shrink-0">
            <Sparkles size={20} strokeWidth={2} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-body-md font-semibold text-on-surface">
              Complète ton profil
            </p>
            <p className="text-caption text-on-surface-variant">
              Ajoute ton prénom et une photo pour personnaliser l'espace familial.
            </p>
          </div>
          <ChevronRight size={18} className="text-on-surface-variant flex-shrink-0" />
        </Link>
      )}

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

        {feed.length === 0 ? (
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
          <ul className="divide-y divide-outline-variant/40 -mx-1">
            {feed.map((item) => (
              <FeedItem key={item.id} item={item} />
            ))}
          </ul>
        )}

        <Link
          to="/history"
          className="mt-md flex items-center justify-center gap-1.5 text-caption text-on-surface-variant hover:text-on-surface transition-colors"
        >
          <HistoryIcon size={14} />
          Voir tout l'historique
        </Link>
      </section>
    </div>
  )
}

const FEED_ICON = {
  expense: Wallet,
  document: FileText,
  event: CalendarDays,
}

function FeedItem({ item }) {
  const Icon = FEED_ICON[item.kind]
  return (
    <li className="flex items-center gap-md py-sm px-1">
      <div className="h-9 w-9 rounded-full bg-primary-container/20 flex items-center justify-center text-primary flex-shrink-0">
        <Icon size={16} strokeWidth={2} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-body-md font-semibold text-on-surface truncate">
          {item.title}
        </p>
        <p className="text-caption text-on-surface-variant">
          {item.subtitle} · {timeAgo(item.date)}
        </p>
      </div>
      {item.kind === 'expense' && item.status && (
        <span className={`${EXPENSE_STATUS_PILL[item.status] ?? 'pill-neutral'} flex-shrink-0`}>
          {EXPENSE_STATUS_LABELS[item.status] ?? item.status}
        </span>
      )}
      <Link
        to={item.to}
        className="text-caption text-primary font-semibold flex-shrink-0"
      >
        Voir
      </Link>
    </li>
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
