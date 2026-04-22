import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useFamilyId } from './useFamily'
import { useAuthStore } from '../stores/authStore'

export function useAddChild() {
  const qc = useQueryClient()
  const familyId = useFamilyId()
  const user = useAuthStore((s) => s.user)

  return useMutation({
    mutationFn: async ({ first_name, birth_date }) => {
      if (!familyId) throw new Error('Famille introuvable')
      const { data, error } = await supabase
        .from('children')
        .insert({
          family_id: familyId,
          first_name,
          birth_date,
          created_by: user?.id,
        })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['children', familyId] })
    },
  })
}

/**
 * Soft-delete d'un enfant (set deleted_at).
 */
export function useRemoveChild() {
  const qc = useQueryClient()
  const familyId = useFamilyId()

  return useMutation({
    mutationFn: async (childId) => {
      const { data, error } = await supabase
        .from('children')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', childId)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['children', familyId] })
    },
  })
}
