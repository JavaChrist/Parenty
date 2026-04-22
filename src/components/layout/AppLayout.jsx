import { Outlet, NavLink, Link } from 'react-router-dom'
import {
  LayoutDashboard,
  CalendarDays,
  Wallet,
  FolderOpen,
  MessageCircle,
  User,
  Bell,
} from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'

const tabs = [
  { to: '/', label: 'Accueil', icon: LayoutDashboard, end: true },
  { to: '/calendar', label: 'Agenda', icon: CalendarDays },
  { to: '/expenses', label: 'Dépenses', icon: Wallet },
  { to: '/documents', label: 'Documents', icon: FolderOpen },
  { to: '/chat', label: 'Messagerie', icon: MessageCircle, badge: true },
  { to: '/profile', label: 'Profil', icon: User },
]

export default function AppLayout() {
  const user = useAuthStore((s) => s.user)
  const initial = (user?.email?.[0] ?? 'P').toUpperCase()

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header sticky — avatar · logo · cloche */}
      <header className="sticky top-0 z-40 bg-surface-container-lowest/90 backdrop-blur-md border-b border-outline-variant/40">
        <div className="max-w-2xl mx-auto flex items-center justify-between px-4 h-16">
          <Link
            to="/profile"
            className="h-9 w-9 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container font-semibold text-label-sm"
            aria-label="Profil"
          >
            {initial}
          </Link>
          <Link
            to="/"
            className="flex items-center gap-2 font-display text-h3 font-extrabold tracking-tight text-primary"
            aria-label="Accueil Parenty"
          >
            <img
              src="/icons/logo64.png"
              alt=""
              className="h-8 w-8 rounded-lg"
              width="32"
              height="32"
            />
            <span>Parenty</span>
          </Link>
          <button
            className="p-2 rounded-full text-on-surface-variant hover:bg-surface-container-low active:scale-95 transition-all relative"
            aria-label="Notifications"
          >
            <Bell size={22} strokeWidth={2} />
            {/* Petit point de notif */}
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-tertiary-container" />
          </button>
        </div>
      </header>

      {/* Contenu */}
      <main className="flex-1 pb-28 max-w-2xl w-full mx-auto px-4 py-6">
        <Outlet />
      </main>

      {/* Bottom nav arrondie — style PWA mobile */}
      <nav
        className="fixed bottom-0 inset-x-0 z-50 bg-surface-container-lowest border-t border-outline-variant/40 rounded-t-3xl shadow-nav
                   pb-[env(safe-area-inset-bottom)]"
      >
        <div className="max-w-2xl mx-auto grid grid-cols-6 px-2 pt-3 pb-2">
          {tabs.map(({ to, label, icon: Icon, end, badge }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                [
                  'relative flex flex-col items-center justify-center gap-1',
                  'px-1 py-1.5 rounded-2xl text-caption font-semibold',
                  'transition-all active:scale-95',
                  isActive
                    ? 'bg-primary-container/15 text-primary'
                    : 'text-on-surface-variant hover:text-primary',
                ].join(' ')
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    size={22}
                    strokeWidth={isActive ? 2.25 : 2}
                    fill={isActive ? 'currentColor' : 'none'}
                    className={isActive ? 'opacity-90' : ''}
                  />
                  <span className="leading-none">{label}</span>
                  {badge && !isActive && (
                    <span className="absolute top-1 right-1/4 w-2 h-2 rounded-full bg-tertiary-container" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
