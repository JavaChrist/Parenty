import { useEffect, useRef, useState } from 'react'
import { Camera, Trash2, User } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../stores/authStore'
import {
  useMyProfile,
  useUpdateProfile,
  useUploadAvatar,
  useRemoveAvatar,
  getAvatarUrl,
} from '../../hooks/useProfile'

/**
 * Formulaire « Informations personnelles ».
 * - Photo de profil (bucket storage "avatars")
 * - Prénom / nom / téléphone (table public.profiles)
 * - Email (auth.users — déclenche un mail de confirmation)
 */
export default function PersonalInfoForm({ onSuccess, onCancel }) {
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)

  const { data: profile } = useMyProfile()
  const updateProfile = useUpdateProfile()
  const uploadAvatar = useUploadAvatar()
  const removeAvatar = useRemoveAvatar()

  const [firstName, setFirstName] = useState(profile?.first_name ?? '')
  const [lastName, setLastName] = useState(profile?.last_name ?? '')
  const [phone, setPhone] = useState(profile?.phone ?? '')
  const [email, setEmail] = useState(user?.email ?? '')

  // Avatar : preview locale avant upload
  const [pendingAvatarFile, setPendingAvatarFile] = useState(null)
  const [avatarRemoved, setAvatarRemoved] = useState(false)
  const fileInputRef = useRef(null)

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [info, setInfo] = useState(null)

  useEffect(() => {
    if (!profile) return
    setFirstName((v) => v || profile.first_name || '')
    setLastName((v) => v || profile.last_name || '')
    setPhone((v) => v || profile.phone || '')
  }, [profile])

  const [localPreview, setLocalPreview] = useState(null)
  useEffect(() => {
    if (!pendingAvatarFile) {
      setLocalPreview(null)
      return
    }
    const url = URL.createObjectURL(pendingAvatarFile)
    setLocalPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [pendingAvatarFile])

  const previewUrl = localPreview
    ?? (avatarRemoved ? null : getAvatarUrl(profile?.avatar_path, profile?.updated_at))

  const initial = (firstName?.[0] || user?.email?.[0] || 'P').toUpperCase()

  const onPickAvatar = (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    if (!['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(f.type)) {
      setError('Format non supporté (PNG, JPG, WEBP, GIF).')
      return
    }
    if (f.size > 5 * 1024 * 1024) {
      setError('Image trop volumineuse (5 Mo max).')
      return
    }
    setError(null)
    setPendingAvatarFile(f)
    setAvatarRemoved(false)
  }

  const onRemoveAvatar = () => {
    setPendingAvatarFile(null)
    setAvatarRemoved(true)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const submit = async (e) => {
    e.preventDefault()
    setError(null)
    setInfo(null)

    const trimmedFirst = firstName.trim()
    const trimmedLast = lastName.trim()
    const trimmedPhone = phone.trim()
    const trimmedEmail = email.trim()

    if (!trimmedFirst) return setError('Le prénom est requis.')
    if (!trimmedEmail) return setError("L'email est requis.")

    setSaving(true)
    try {
      // 1) Avatar : upload, suppression ou no-op
      let nextAvatarPath = profile?.avatar_path ?? null
      if (pendingAvatarFile) {
        nextAvatarPath = await uploadAvatar.mutateAsync(pendingAvatarFile)
        if (profile?.avatar_path && profile.avatar_path !== nextAvatarPath) {
          await supabase.storage.from('avatars').remove([profile.avatar_path])
        }
      } else if (avatarRemoved && profile?.avatar_path) {
        await removeAvatar.mutateAsync(profile.avatar_path)
        nextAvatarPath = null
      }

      // 2) Profil (table public.profiles)
      await updateProfile.mutateAsync({
        first_name: trimmedFirst,
        last_name: trimmedLast || null,
        phone: trimmedPhone || null,
        avatar_path: nextAvatarPath,
      })

      // 3) Email (auth.users)
      const emailChanged = trimmedEmail.toLowerCase() !== (user?.email ?? '').toLowerCase()
      if (emailChanged) {
        const { data, error: emailErr } = await supabase.auth.updateUser({
          email: trimmedEmail,
        })
        if (emailErr) throw emailErr
        if (data?.user) setUser(data.user)
        setInfo(
          "Un email de confirmation a été envoyé à ta nouvelle adresse. Le changement sera effectif après validation.",
        )
        return
      }

      onSuccess?.()
    } catch (err) {
      setError(err.message || 'Impossible de mettre à jour le profil.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-md">
      {/* Avatar */}
      <div className="flex flex-col items-center gap-sm">
        <div className="relative">
          <div className="h-24 w-24 rounded-full overflow-hidden bg-primary-container flex items-center justify-center text-on-primary-container font-display text-h2 font-bold">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Avatar"
                className="h-full w-full object-cover"
              />
            ) : firstName || user?.email ? (
              initial
            ) : (
              <User size={36} strokeWidth={2} />
            )}
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute -bottom-1 -right-1 h-9 w-9 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-soft hover:brightness-110 transition"
            aria-label="Changer la photo"
          >
            <Camera size={16} strokeWidth={2.5} />
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="hidden"
          onChange={onPickAvatar}
        />

        {previewUrl && (
          <button
            type="button"
            onClick={onRemoveAvatar}
            className="inline-flex items-center gap-1 text-caption text-error font-semibold"
          >
            <Trash2 size={14} /> Retirer la photo
          </button>
        )}
        <p className="text-caption text-on-surface-variant">
          PNG, JPG, WEBP — 5 Mo max
        </p>
      </div>

      {/* Identité */}
      <div className="grid grid-cols-2 gap-md">
        <div>
          <label className="label" htmlFor="first_name">Prénom</label>
          <input
            id="first_name"
            type="text"
            autoComplete="given-name"
            required
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="input"
          />
        </div>
        <div>
          <label className="label" htmlFor="last_name">Nom</label>
          <input
            id="last_name"
            type="text"
            autoComplete="family-name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="input"
          />
        </div>
      </div>

      <div>
        <label className="label" htmlFor="phone">Téléphone</label>
        <input
          id="phone"
          type="tel"
          autoComplete="tel"
          placeholder="+33 6 12 34 56 78"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="input"
        />
      </div>

      <div>
        <label className="label" htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input"
        />
        <p className="text-caption text-on-surface-variant mt-1">
          Un changement d'email nécessite une confirmation par mail.
        </p>
      </div>

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
        <button type="submit" disabled={saving} className="btn-primary flex-1">
          {saving ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </div>
    </form>
  )
}
