import { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import ProtectedRoute from './components/layout/ProtectedRoute'
import RequireFamily from './components/layout/RequireFamily'
import AppLayout from './components/layout/AppLayout'
import UpdatePrompt from './components/layout/UpdatePrompt'
import { resetApp } from './lib/resetApp'

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
import History from './pages/History'
import Install from './pages/Install'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import MentionsLegales from './pages/legal/MentionsLegales'
import Privacy from './pages/legal/Privacy'
import CGU from './pages/legal/CGU'
import CGV from './pages/legal/CGV'

export default function App() {
  const init = useAuthStore((s) => s.init)
  const loading = useAuthStore((s) => s.loading)
  const [showRescue, setShowRescue] = useState(false)

  useEffect(() => {
    init()
  }, [init])

  // Si on reste bloqué > 5 s sur le splash (SW corrompu, réseau KO, Supabase
  // injoignable…), on propose à l'utilisateur de réinitialiser l'appli
  // (unregister SW + clear caches + reload). Sans ça, une PWA installée peut
  // rester coincée indéfiniment sur "Chargement…".
  useEffect(() => {
    if (!loading) return
    const t = setTimeout(() => setShowRescue(true), 5000)
    return () => clearTimeout(t)
  }, [loading])

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-md bg-background px-4">
        <img
          src="/icons/logo128.png"
          alt="Parenty"
          className="h-20 w-20 rounded-2xl shadow-soft animate-pulse"
          width="80"
          height="80"
        />
        <div className="text-on-surface-variant">Chargement…</div>
        {showRescue && (
          <div className="mt-lg max-w-sm text-center space-y-sm">
            <p className="text-caption text-on-surface-variant">
              Le chargement prend plus de temps que prévu. Si le problème
              persiste, tu peux réinitialiser l'appli (tu seras déconnecté·e).
            </p>
            <button
              type="button"
              onClick={resetApp}
              className="btn-secondary !py-2 !text-label-sm"
            >
              Réinitialiser l'appli
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      <UpdatePrompt />
      <Routes>
      {/* Routes publiques */}
      <Route path="/signin" element={<SignIn />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/invite" element={<AcceptInvite />} />

      {/* Pages légales — accessibles sans authentification (LCEN/RGPD) */}
      <Route path="/mentions-legales" element={<MentionsLegales />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/cgu" element={<CGU />} />
      <Route path="/cgv" element={<CGV />} />

      {/* Page publique d'installation — QR code + tuto Android/iOS */}
      <Route path="/install" element={<Install />} />

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
            <Route path="/history" element={<History />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}
