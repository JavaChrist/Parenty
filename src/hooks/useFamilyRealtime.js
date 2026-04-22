import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useFamilyId } from './useFamily'

/**
 * Abonnement Realtime global aux tables partagées de la famille courante.
 *
 * Sans ça, un parent ne voit les créations/modifs de l'autre parent qu'après
 * un reload manuel. On invalide simplement les caches React Query à chaque
 * event Postgres — la simplicité prime ici sur l'optimisation fine.
 *
 * Appelé une seule fois dans `AppLayout` pour couvrir toute l'app.
 *
 * Prérequis Supabase : la réplication Realtime doit être activée sur les
 * tables `events`, `expenses`, `documents` (onglet Database → Replication).
 */
export function useFamilyRealtime() {
  const familyId = useFamilyId()
  const qc = useQueryClient()

  useEffect(() => {
    if (!familyId) return

    const channel = supabase
      .channel(`family-${familyId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'events',
          filter: `family_id=eq.${familyId}`,
        },
        () => {
          qc.invalidateQueries({ queryKey: ['events'] })
          qc.invalidateQueries({ queryKey: ['activity-feed'] })
        },
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'expenses',
          filter: `family_id=eq.${familyId}`,
        },
        () => {
          qc.invalidateQueries({ queryKey: ['expenses'] })
          qc.invalidateQueries({ queryKey: ['activity-feed'] })
        },
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'documents',
          filter: `family_id=eq.${familyId}`,
        },
        () => {
          qc.invalidateQueries({ queryKey: ['documents'] })
          qc.invalidateQueries({ queryKey: ['activity-feed'] })
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [familyId, qc])
}
