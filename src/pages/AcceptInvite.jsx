import { useEffect, useState } from 'react'
import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { Check, XCircle } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { useAcceptInvitation } from '../hooks/useInvitations'

export default function AcceptInvite() {
  const [params] = useSearchParams()
  const token = params.get('token')
  const user = useAuthStore((s) => s.user)
  const authLoading = useAuthStore((s) => s.loading)
  const navigate = useNavigate()
  const qc = useQueryClient()
  const accept = useAcceptInvitation()

  const [status, setStatus] = useState('idle') // idle | loading | success | error
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (authLoading) return
    if (!token) {
      setStatus('error')
      setMessage('Lien d\'invitation invalide.')
      return
    }
    if (!user) return // Affichage du CTA "Se connecter" plus bas

    setStatus('loading')
    accept
      .mutateAsync(token)
      .then((res) => {
        setStatus('success')
        setMessage(
          res?.alreadyMember
            ? 'Tu étais déjà membre de cette famille.'
            : 'Bienvenue dans la famille !',
        )
        qc.invalidateQueries() // refresh tout (family, children, expenses…)
        setTimeout(() => navigate('/', { replace: true }), 1500)
      })
      .catch((err) => {
        setStatus('error')
        setMessage(err.message || 'Impossible d\'accepter l\'invitation.')
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, user, authLoading])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <img
            src="/icons/logo128.png"
            alt="Parenty"
            className="mx-auto h-20 w-20 rounded-2xl shadow-soft"
            width="80"
            height="80"
          />
          <h1 className="font-display text-display text-primary mt-md">Parenty</h1>
          <p className="text-body-md text-on-surface-variant mt-1">
            Invitation familiale
          </p>
        </div>

        <div className="card-elevated p-lg text-center">
          {!user && !authLoading && (
            <>
              <p className="text-body-md text-on-surface mb-md">
                Pour rejoindre ta famille, connecte-toi ou crée un compte avec l'email qui a reçu l'invitation.
              </p>
              <div className="flex flex-col gap-sm">
                <Link
                  to={`/signin?redirect=/invite?token=${token ?? ''}`}
                  className="btn-primary w-full"
                >
                  Se connecter
                </Link>
                <Link to={`/signup`} className="btn-secondary w-full">
                  Créer un compte
                </Link>
              </div>
            </>
          )}

          {status === 'loading' && (
            <p className="text-body-md text-on-surface-variant">
              Association en cours…
            </p>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center gap-sm">
              <div className="h-12 w-12 rounded-full bg-primary-container/20 flex items-center justify-center text-primary">
                <Check size={28} strokeWidth={2.5} />
              </div>
              <h2 className="h-section text-h3">C'est fait !</h2>
              <p className="text-body-md text-on-surface-variant">{message}</p>
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center gap-sm">
              <div className="h-12 w-12 rounded-full bg-error-container flex items-center justify-center text-on-error-container">
                <XCircle size={28} strokeWidth={2.5} />
              </div>
              <h2 className="h-section text-h3 text-error">Échec</h2>
              <p className="text-body-md text-on-surface-variant">{message}</p>
              <Link to="/" className="btn-secondary mt-md">
                Retour à l'accueil
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
