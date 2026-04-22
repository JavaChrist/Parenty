import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useFamilyId } from './useFamily'

/**
 * Liste les membres de la famille courante.
 * On ne peut pas accéder directement à auth.users depuis le client,
 * donc on remonte user_id + role + joined_at. Email récupéré côté auth pour le user courant.
 */
export function useFamilyMembers() {
  const familyId = useFamilyId()

  return useQuery({
    queryKey: ['family-members', familyId],
    enabled: !!familyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('family_members')
        .select('id, user_id, role, joined_at')
        .eq('family_id', familyId)
        .order('joined_at', { ascending: true })

      if (error) throw error
      return data
    },
  })
}
