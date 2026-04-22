import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import { useFamilyId } from './useFamily'

export const DOCUMENT_CATEGORIES = [
  { value: 'school', label: 'École' },
  { value: 'medical', label: 'Santé' },
  { value: 'admin', label: 'Administratif' },
  { value: 'legal', label: 'Légal' },
  { value: 'other', label: 'Autre' },
]

export function useDocuments() {
  const familyId = useFamilyId()
  return useQuery({
    queryKey: ['documents', familyId],
    enabled: !!familyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('documents')
        .select('id, title, category, storage_path, mime_type, size_bytes, uploaded_at, child_id, uploaded_by')
        .eq('family_id', familyId)
        .is('deleted_at', null)
        .order('uploaded_at', { ascending: false })
      if (error) throw error
      return data
    },
  })
}

export function useAddDocument() {
  const qc = useQueryClient()
  const familyId = useFamilyId()
  const user = useAuthStore((s) => s.user)

  return useMutation({
    mutationFn: async ({ file, title, category, child_id }) => {
      if (!familyId || !user) throw new Error('Famille introuvable')
      if (!file) throw new Error('Fichier requis')
      if (!title?.trim()) throw new Error('Titre requis')
      if (file.size > 20 * 1024 * 1024) {
        throw new Error('Fichier trop volumineux (20 Mo max).')
      }

      const ext = file.name.includes('.') ? file.name.split('.').pop() : 'bin'
      const uuid = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`
      const path = `${familyId}/${uuid}.${ext}`

      const { error: uploadErr } = await supabase.storage
        .from('documents')
        .upload(path, file, {
          contentType: file.type || 'application/octet-stream',
          upsert: false,
        })
      if (uploadErr) throw uploadErr

      const { data, error: dbErr } = await supabase
        .from('documents')
        .insert({
          family_id: familyId,
          child_id: child_id || null,
          title: title.trim(),
          category: category || 'other',
          storage_path: path,
          mime_type: file.type || null,
          size_bytes: file.size,
          uploaded_by: user.id,
        })
        .select()
        .single()

      if (dbErr) {
        await supabase.storage.from('documents').remove([path])
        throw dbErr
      }
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['documents'] })
    },
  })
}

export function useDeleteDocument() {
  const qc = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const familyId = useFamilyId()

  return useMutation({
    mutationFn: async (doc) => {
      const { error: dbErr } = await supabase
        .from('documents')
        .update({
          deleted_at: new Date().toISOString(),
          deleted_by: user?.id,
        })
        .eq('id', doc.id)
      if (dbErr) throw dbErr

      if (doc.storage_path) {
        await supabase.storage.from('documents').remove([doc.storage_path])
      }
      return true
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['documents', familyId] })
    },
  })
}

export async function getDocumentSignedUrl(path) {
  if (!path) return null
  const { data, error } = await supabase.storage
    .from('documents')
    .createSignedUrl(path, 60)
  if (error) throw error
  return data.signedUrl
}
