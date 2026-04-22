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
import { useMyProfile, getAvatarUrl } from '../../hooks/useProfile'
import { useUnreadMessagesCount } from '../../hooks/useMessages'
import { useExpenses } from '../../hooks/useExpenses'

const tabs = [
  { to: '/', label: 'Accueil', icon: LayoutDashboard, end: true },
  { to: '/calendar', label: 'Agenda', icon: CalendarDays },
  { to: '/expenses', label: 'Dépenses', icon: Wallet },
  { to: '/documents', label: 'Documents', icon: FolderOpen },
  { to: '/chat', label: 'Messagerie', icon: MessageCircle, badgeKey: 'unread' },
  { to: '/profile', label: 'Profil', icon: User },
]

export default function AppLayout() {
  const user = useAuthStore((s) => s.user)
  const { data: myProfile } = useMyProfile()
  const initial = (myProfile?.first_name?.[0] ?? user?.email?.[0] ?? 'P').toUpperCase()
  const avatarUrl = getAvatarUrl(myProfile?.avatar_path, myProfile?.updated_at)

  const { data: unreadCount = 0 } = useUnreadMessagesCount()
  const { data: expenses = [] } = useExpenses()
  const pendingForMe = expenses.filter(
    (e) => e.status === 'pending' && e.payer_id !== user?.id,
  ).length

  const badges = { unread: unreadCount }
  const totalNotifs = pendingForMe + unreadCount

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header sticky — avatar · logo · cloche */}
      <header className="sticky top-0 z-40 bg-surface-container-lowest/90 backdrop-blur-md border-b border-outline-variant/40">
        <div className="max-w-2xl mx-auto flex items-center justify-between px-4 h-16">
          <Link
            to="/profile"
            className="h-9 w-9 rounded-full overflow-hidden bg-primary-container flex items-center justify-center text-on-primary-container font-semibold text-label-sm"
            aria-label="Profil"
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              initial
            )}
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
          <Link
            to={pendingForMe > 0 ? '/expenses' : '/chat'}
            className={[
              'p-2 rounded-full active:scale-95 transition-all relative',
              totalNotifs > 0
                ? 'text-primary hover:bg-primary-container/20'
                : 'text-on-surface-variant hover:bg-surface-container-low',
            ].join(' ')}
            aria-label={
              totalNotifs > 0
                ? `${totalNotifs} notification${totalNotifs > 1 ? 's' : ''}`
                : 'Aucune notification'
            }
          >
            <Bell size={22} strokeWidth={2} />
            {totalNotifs > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-error text-on-error text-[10px] font-bold flex items-center justify-center leading-none">
                {totalNotifs > 9 ? '9+' : totalNotifs}
              </span>
            )}
          </Link>
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
          {tabs.map(({ to, label, icon: Icon, end, badgeKey }) => {
            const count = badgeKey ? badges[badgeKey] ?? 0 : 0
            return (
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
                    <div className="relative">
                      <Icon
                        size={22}
                        strokeWidth={isActive ? 2.25 : 2}
                        fill={isActive ? 'currentColor' : 'none'}
                        className={isActive ? 'opacity-90' : ''}
                      />
                      {count > 0 && !isActive && (
                        <span className="absolute -top-1 -right-2 min-w-[16px] h-[16px] px-1 rounded-full bg-error text-on-error text-[9px] font-bold flex items-center justify-center leading-none">
                          {count > 9 ? '9+' : count}
                        </span>
                      )}
                    </div>
                    <span className="leading-none">{label}</span>
                  </>
                )}
              </NavLink>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
