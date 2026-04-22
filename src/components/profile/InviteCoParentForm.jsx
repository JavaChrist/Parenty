import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { useInviteCoParent } from '../../hooks/useInvitations'

export default function InviteCoParentForm({ onCancel }) {
  const invite = useInviteCoParent()
  const [email, setEmail] = useState('')
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [copied, setCopied] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError(null)
    try {
      const res = await invite.mutateAsync(email)
      setResult(res)
    } catch (err) {
      setError(err.message || 'Erreur lors de la création de l\'invitation.')
    }
  }

  const copy = async () => {
    if (!result?.inviteUrl) return
    try {
      await navigator.clipboard.writeText(result.inviteUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* ignore */
    }
  }

  if (result) {
    return (
      <div className="space-y-md">
        <p className="text-body-md text-on-surface">
          Invitation créée pour <strong>{result.invitation.email}</strong>.
        </p>
        <p className="text-body-md text-on-surface-variant">
          Envoie-lui ce lien (par SMS, email, WhatsApp…) pour qu'il rejoigne la famille :
        </p>

        <div className="flex items-stretch gap-sm">
          <input
            readOnly
            value={result.inviteUrl}
            className="input font-mono text-caption"
            onFocus={(e) => e.target.select()}
          />
          <button
            type="button"
            onClick={copy}
            className="btn-primary px-4"
            aria-label="Copier le lien"
          >
            {copied ? <Check size={18} /> : <Copy size={18} />}
          </button>
        </div>

        <p className="text-caption text-on-surface-variant">
          Valide 7 jours. Le lien n'est utilisable qu'une seule fois.
        </p>

        <button type="button" onClick={onCancel} className="btn-secondary w-full">
          Fermer
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="space-y-md">
      <p className="text-body-md text-on-surface-variant">
        Entre l'email de l'autre parent. Il recevra un lien pour créer son compte
        et rejoindre la famille.
      </p>

      <div>
        <label className="label" htmlFor="coparent_email">Email du co-parent</label>
        <input
          id="coparent_email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input"
          placeholder="parent@exemple.fr"
        />
      </div>

      {error && (
        <div className="text-body-md text-on-error-container bg-error-container rounded-md p-3">
          {error}
        </div>
      )}

      <div className="flex gap-md pt-sm">
        <button type="button" onClick={onCancel} className="btn-secondary flex-1">
          Annuler
        </button>
        <button type="submit" disabled={invite.isPending} className="btn-primary flex-1">
          {invite.isPending ? 'Envoi…' : 'Créer l\'invitation'}
        </button>
      </div>
    </form>
  )
}
