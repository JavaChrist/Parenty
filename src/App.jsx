import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import ProtectedRoute from './components/layout/ProtectedRoute'
import RequireFamily from './components/layout/RequireFamily'
import AppLayout from './components/layout/AppLayout'

// Pages
import SignIn from './pages/SignIn'
import SignUp from './pages/SignUp'
import OnboardingChild from './pages/OnboardingChild'
import OnboardingInvite from './pages/OnboardingInvite'
import AcceptInvite from './pages/AcceptInvite'
import Dashboard from './pages/Dashboard'
import Calendar from './pages/Calendar'
import Expenses from './pages/Expenses'
import Documents from './pages/Documents'
import Chat from './pages/Chat'
import Profile from './pages/Profile'

export default function App() {
  const init = useAuthStore((s) => s.init)
  const loading = useAuthStore((s) => s.loading)

  useEffect(() => {
    init()
  }, [init])

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-md bg-background">
        <img
          src="/icons/logo128.png"
          alt="Parenty"
          className="h-20 w-20 rounded-2xl shadow-soft animate-pulse"
          width="80"
          height="80"
        />
        <div className="text-on-surface-variant">Chargement…</div>
      </div>
    )
  }

  return (
    <Routes>
      {/* Routes publiques */}
      <Route path="/signin" element={<SignIn />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/invite" element={<AcceptInvite />} />

      {/* Routes protégées */}
      <Route element={<ProtectedRoute />}>
        {/* Onboarding : sans garde "famille" */}
        <Route path="/onboarding/child" element={<OnboardingChild />} />
        <Route path="/onboarding/invite" element={<OnboardingInvite />} />

        {/* App : nécessite une famille */}
        <Route element={<RequireFamily />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/expenses" element={<Expenses />} />
            <Route path="/documents" element={<Documents />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/profile" element={<Profile />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
