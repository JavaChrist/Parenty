import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useFamilyId } from './useFamily'

export function useDocuments() {
  const familyId = useFamilyId()
  return useQuery({
    queryKey: ['documents', familyId],
    enabled: !!familyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('documents')
        .select('id, title, category, storage_path, mime_type, size_bytes, uploaded_at, child_id')
        .eq('family_id', familyId)
        .is('deleted_at', null)
        .order('uploaded_at', { ascending: false })
      if (error) throw error
      return data
    },
  })
}
