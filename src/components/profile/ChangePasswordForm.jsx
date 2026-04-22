import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../stores/authStore'

/**
 * Formulaire de changement de mot de passe.
 * - Vérifie le mot de passe actuel en le ré-authentifiant (signInWithPassword)
 * - Met à jour via supabase.auth.updateUser({ password })
 * - La session actuelle reste active
 */
export default function ChangePasswordForm({ onSuccess, onCancel }) {
  const user = useAuthStore((s) => s.user)

  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [show, setShow] = useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [info, setInfo] = useState(null)

  const submit = async (e) => {
    e.preventDefault()
    setError(null)
    setInfo(null)

    if (!user?.email) return setError('Session invalide, reconnecte-toi.')
    if (next.length < 8) return setError('Le nouveau mot de passe doit contenir au moins 8 caractères.')
    if (next !== confirm) return setError('Les mots de passe ne correspondent pas.')
    if (next === current) return setError('Le nouveau mot de passe doit être différent de l\'actuel.')

    setLoading(true)
    try {
      // 1) Vérification du mot de passe actuel (sans perdre la session)
      const { error: authErr } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: current,
      })
      if (authErr) {
        if (authErr.message === 'Invalid login credentials') {
          throw new Error('Mot de passe actuel incorrect.')
        }
        throw authErr
      }

      // 2) Mise à jour du mot de passe
      const { error: updateErr } = await supabase.auth.updateUser({
        password: next,
      })
      if (updateErr) throw updateErr

      setInfo('Mot de passe mis à jour.')
      setCurrent('')
      setNext('')
      setConfirm('')
      setTimeout(() => onSuccess?.(), 800)
    } catch (err) {
      setError(err.message || 'Impossible de changer le mot de passe.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-md">
      <PasswordField
        id="current"
        label="Mot de passe actuel"
        autoComplete="current-password"
        value={current}
        onChange={setCurrent}
        show={show}
        onToggleShow={() => setShow((v) => !v)}
      />
      <PasswordField
        id="next"
        label="Nouveau mot de passe"
        autoComplete="new-password"
        value={next}
        onChange={setNext}
        show={show}
        onToggleShow={() => setShow((v) => !v)}
        hint="Au moins 8 caractères."
      />
      <PasswordField
        id="confirm"
        label="Confirmer le nouveau mot de passe"
        autoComplete="new-password"
        value={confirm}
        onChange={setConfirm}
        show={show}
        onToggleShow={() => setShow((v) => !v)}
      />

      {error && (
        <div className="text-body-md text-on-error-container bg-error-container rounded-md p-3">
          {error}
        </div>
      )}
      {info && (
        <div className="text-body-md text-on-primary-container bg-primary-container rounded-md p-3">
          {info}
        </div>
      )}

      <div className="flex gap-md pt-sm">
        <button type="button" onClick={onCancel} className="btn-secondary flex-1">
          Annuler
        </button>
        <button type="submit" disabled={loading} className="btn-primary flex-1">
          {loading ? 'Mise à jour…' : 'Mettre à jour'}
        </button>
      </div>
    </form>
  )
}

function PasswordField({ id, label, value, onChange, show, onToggleShow, autoComplete, hint }) {
  return (
    <div>
      <label className="label" htmlFor={id}>{label}</label>
      <div className="relative">
        <input
          id={id}
          type={show ? 'text' : 'password'}
          autoComplete={autoComplete}
          required
          minLength={id === 'current' ? undefined : 8}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="input pr-11"
        />
        <button
          type="button"
          onClick={onToggleShow}
          className="absolute inset-y-0 right-0 flex items-center px-3 text-on-surface-variant hover:text-on-surface transition-colors"
          aria-label={show ? 'Masquer' : 'Afficher'}
          aria-pressed={show}
          tabIndex={-1}
        >
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
      {hint && <p className="text-caption text-on-surface-variant mt-1">{hint}</p>}
    </div>
  )
}
