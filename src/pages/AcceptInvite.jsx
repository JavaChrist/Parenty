import { useEffect, useState } from 'react'
import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { Check, XCircle } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { useAcceptInvitation } from '../hooks/useInvitations'
import {
  setPendingInviteToken,
  clearPendingInviteToken,
} from '../lib/pendingInvite'

export default function AcceptInvite() {
  const [params] = useSearchParams()
  const token = params.get('token')
  const user = useAuthStore((s) => s.user)
  const authLoading = useAuthStore((s) => s.loading)
  const navigate = useNavigate()
  const qc = useQueryClient()
  const accept = useAcceptInvitation()

  const [status, setStatus] = useState('idle') // idle | loading | success | error | conflict
  const [message, setMessage] = useState('')
  const [conflictReason, setConflictReason] = useState(null)

  const runAccept = (force = false) => {
    setStatus('loading')
    accept
      .mutateAsync(force ? { token, force: true } : token)
      .then((res) => {
        clearPendingInviteToken()
        setStatus('success')
        setMessage(
          res?.alreadyMember
            ? 'Tu étais déjà membre de cette famille.'
            : 'Bienvenue dans la famille !',
        )
        qc.invalidateQueries()
        setTimeout(() => navigate('/', { replace: true }), 1500)
      })
      .catch((err) => {
        // Conflit : déjà dans une autre famille → on propose de la quitter
        if (err.reason === 'already_in_other_family') {
          setStatus('conflict')
          setConflictReason('already_in_other_family')
          setMessage(err.message)
          return
        }
        // Conflit non résolvable côté user
        if (err.reason === 'family_has_other_members') {
          setStatus('error')
          setConflictReason('family_has_other_members')
          setMessage(err.message)
          return
        }
        setStatus('error')
        setMessage(err.message || "Impossible d'accepter l'invitation.")
      })
  }

  // Dès qu'un token arrive dans l'URL, on le persiste en localStorage.
  // Il servira à reprendre le flow après signup + confirmation email.
  useEffect(() => {
    if (token) setPendingInviteToken(token)
  }, [token])

  useEffect(() => {
    if (authLoading) return
    if (!token) {
      setStatus('error')
      setMessage("Lien d'invitation invalide.")
      return
    }
    if (!user) return // Affichage du CTA "Se connecter" plus bas
    runAccept(false)
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
                <Link
                  to={`/signup?invite=${token ?? ''}`}
                  className="btn-secondary w-full"
                >
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

          {status === 'conflict' && conflictReason === 'already_in_other_family' && (
            <div className="flex flex-col items-center gap-sm">
              <div className="h-12 w-12 rounded-full bg-warning-container flex items-center justify-center text-on-warning-container">
                <XCircle size={28} strokeWidth={2.5} />
              </div>
              <h2 className="h-section text-h3">Famille existante</h2>
              <p className="text-body-md text-on-surface-variant">
                {message}
              </p>
              <p className="text-caption text-on-surface-variant/80 mt-2">
                Toutes les données de ta famille actuelle (enfants, dépenses,
                événements…) seront supprimées définitivement.
              </p>
              <div className="flex flex-col gap-sm w-full mt-md">
                <button
                  type="button"
                  onClick={() => runAccept(true)}
                  className="btn-primary w-full"
                  disabled={accept.isPending}
                >
                  {accept.isPending
                    ? 'Migration en cours…'
                    : 'Quitter et rejoindre cette famille'}
                </button>
                <Link to="/" className="btn-secondary w-full">
                  Annuler
                </Link>
              </div>
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
