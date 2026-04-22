import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'

/**
 * Renvoie la famille du user courant (via family_members + families).
 * Retourne { family, familyMember } (rôle inclus).
 */
export function useFamily() {
  const user = useAuthStore((s) => s.user)

  return useQuery({
    queryKey: ['family', user?.id],
    enabled: !!user,
    queryFn: async () => {
      // Si l'utilisateur a plusieurs family_members (tests / historique),
      // on prend le plus récent.
      const { data, error } = await supabase
        .from('family_members')
        .select('id, role, joined_at, family:families(id, name, subscription_status)')
        .eq('user_id', user.id)
        .order('joined_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error) throw error
      if (!data) return { family: null, familyMember: null }
      return {
        family: data.family,
        familyMember: { id: data.id, role: data.role, joined_at: data.joined_at },
      }
    },
  })
}

/**
 * Retourne la family_id courante (raccourci).
 */
export function useFamilyId() {
  const { data } = useFamily()
  return data?.family?.id ?? null
}
