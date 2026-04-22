import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { resizeImage } from '../lib/image'
import { useAuthStore } from '../stores/authStore'

const PROFILE_FIELDS = 'id, first_name, last_name, phone, avatar_path, updated_at'

/**
 * URL publique d'un avatar (bucket "avatars" est public).
 * Un ?v=timestamp est ajouté pour casser le cache navigateur après un upload.
 */
export function getAvatarUrl(path, version) {
  if (!path) return null
  const { data } = supabase.storage.from('avatars').getPublicUrl(path)
  if (!data?.publicUrl) return null
  return version ? `${data.publicUrl}?v=${version}` : data.publicUrl
}

/**
 * Profil de l'utilisateur courant.
 */
export function useMyProfile() {
  const user = useAuthStore((s) => s.user)
  return useQuery({
    queryKey: ['profile', 'me', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select(PROFILE_FIELDS)
        .eq('id', user.id)
        .maybeSingle()
      if (error) throw error
      return data
    },
  })
}

/**
 * Profils d'une liste d'utilisateurs (co-parents, etc.).
 */
export function useProfiles(userIds) {
  const ids = (userIds ?? []).filter(Boolean)
  const key = [...ids].sort().join(',')
  return useQuery({
    queryKey: ['profiles', key],
    enabled: ids.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select(PROFILE_FIELDS)
        .in('id', ids)
      if (error) throw error
      const byId = {}
      for (const p of data ?? []) byId[p.id] = p
      return byId
    },
  })
}

/**
 * Mise à jour du profil (first_name, last_name, phone, avatar_path).
 */
export function useUpdateProfile() {
  const qc = useQueryClient()
  const user = useAuthStore((s) => s.user)

  return useMutation({
    mutationFn: async (patch) => {
      if (!user) throw new Error('Non authentifié')
      const allowed = {}
      for (const k of ['first_name', 'last_name', 'phone', 'avatar_path']) {
        if (k in patch) allowed[k] = patch[k]
      }
      const { data, error } = await supabase
        .from('profiles')
        .update(allowed)
        .eq('id', user.id)
        .select(PROFILE_FIELDS)
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      qc.setQueryData(['profile', 'me', user?.id], data)
      qc.invalidateQueries({ queryKey: ['profiles'] })
    },
  })
}

/**
 * Upload d'une photo de profil dans le bucket "avatars".
 * - Validation format/taille côté client
 * - Recadrage + redimensionnement en 512×512 JPEG avant upload
 * - Path = `<user_id>/avatar-<timestamp>.<ext>` (timestamp = anti-cache CDN)
 * La mutation renvoie le nouveau path — à enregistrer via useUpdateProfile.
 */
export function useUploadAvatar() {
  const qc = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const MAX_SIZE = 5 * 1024 * 1024 // 5 Mo à l'upload utilisateur
  const ACCEPTED = ['image/png', 'image/jpeg', 'image/webp', 'image/gif']

  return useMutation({
    mutationFn: async (file) => {
      if (!user) throw new Error('Non authentifié')
      if (!file) throw new Error('Fichier manquant')
      if (!ACCEPTED.includes(file.type)) {
        throw new Error('Format non supporté (PNG, JPG, WEBP, GIF).')
      }
      if (file.size > MAX_SIZE) {
        throw new Error('Image trop volumineuse (5 Mo max).')
      }

      const processed = await resizeImage(file, { maxSize: 512, quality: 0.9, square: true })
      const ext = processed.type === 'image/gif'
        ? 'gif'
        : processed.type === 'image/jpeg'
          ? 'jpg'
          : (file.name.split('.').pop() || 'jpg').toLowerCase()
      const path = `${user.id}/avatar-${Date.now()}.${ext}`

      const { error: uploadErr } = await supabase.storage
        .from('avatars')
        .upload(path, processed, {
          contentType: processed.type,
          upsert: false,
          cacheControl: '3600',
        })
      if (uploadErr) throw uploadErr

      return path
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['profile', 'me', user?.id] })
    },
  })
}

/**
 * Supprime l'avatar courant (fichier storage + avatar_path = null).
 */
export function useRemoveAvatar() {
  const qc = useQueryClient()
  const user = useAuthStore((s) => s.user)

  return useMutation({
    mutationFn: async (currentPath) => {
      if (!user) throw new Error('Non authentifié')
      if (currentPath) {
        await supabase.storage.from('avatars').remove([currentPath])
      }
      const { data, error } = await supabase
        .from('profiles')
        .update({ avatar_path: null })
        .eq('id', user.id)
        .select(PROFILE_FIELDS)
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      qc.setQueryData(['profile', 'me', user?.id], data)
      qc.invalidateQueries({ queryKey: ['profiles'] })
    },
  })
}
