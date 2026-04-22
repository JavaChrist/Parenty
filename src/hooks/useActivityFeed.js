import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useFamilyId } from './useFamily'

/**
 * Flux d'activité global de la famille, agrégé depuis plusieurs sources :
 *  - event_history   → tout changement sur les événements
 *  - expense_history → tout changement sur les dépenses
 *  - documents       → upload + soft delete (basé sur uploaded_at / deleted_at)
 *
 * Chaque entrée est normalisée en :
 *   { id, source, action, at, actorId, ref: { id, label }, snapshot }
 *
 * La page /history se charge du filtrage et du regroupement par date.
 * On limite chaque source pour éviter de tout charger d'un coup — TODO pagination
 * si le volume devient important.
 */
const PER_SOURCE_LIMIT = 100

export function useActivityFeed() {
  const familyId = useFamilyId()

  return useQuery({
    queryKey: ['activity-feed', familyId],
    enabled: !!familyId,
    queryFn: async () => {
      // La RLS filtre naturellement par family_id (policies "Family members can read …").
      // Pas besoin de filtre explicite sur family_id côté client.
      const [eventsRes, expensesRes, documentsRes] = await Promise.all([
        supabase
          .from('event_history')
          .select(`
            id, action, snapshot, changed_at, changed_by,
            event:events ( id, title )
          `)
          .order('changed_at', { ascending: false })
          .limit(PER_SOURCE_LIMIT),
        supabase
          .from('expense_history')
          .select(`
            id, action, snapshot, changed_at, changed_by,
            expense:expenses ( id, description )
          `)
          .order('changed_at', { ascending: false })
          .limit(PER_SOURCE_LIMIT),
        supabase
          .from('documents')
          .select('id, title, uploaded_at, uploaded_by, deleted_at, deleted_by')
          .order('uploaded_at', { ascending: false })
          .limit(PER_SOURCE_LIMIT),
      ])

      if (eventsRes.error) throw eventsRes.error
      if (expensesRes.error) throw expensesRes.error
      if (documentsRes.error) throw documentsRes.error

      const entries = []

      for (const row of eventsRes.data ?? []) {
        entries.push({
          id: `event-${row.id}`,
          source: 'event',
          action: row.action,
          at: row.changed_at,
          actorId: row.changed_by,
          ref: {
            id: row.event?.id,
            label: row.snapshot?.title ?? row.event?.title ?? 'Événement',
          },
          snapshot: row.snapshot,
        })
      }

      for (const row of expensesRes.data ?? []) {
        entries.push({
          id: `expense-${row.id}`,
          source: 'expense',
          action: row.action,
          at: row.changed_at,
          actorId: row.changed_by,
          ref: {
            id: row.expense?.id,
            label: row.snapshot?.description ?? row.expense?.description ?? 'Dépense',
          },
          snapshot: row.snapshot,
        })
      }

      // Note : la RLS policy SELECT sur documents exclut les deleted_at non-null.
      // Donc seuls les uploads (documents encore visibles) apparaissent ici.
      for (const row of documentsRes.data ?? []) {
        entries.push({
          id: `document-upload-${row.id}`,
          source: 'document',
          action: 'uploaded',
          at: row.uploaded_at,
          actorId: row.uploaded_by,
          ref: { id: row.id, label: row.title },
          snapshot: null,
        })
      }

      entries.sort((a, b) => new Date(b.at) - new Date(a.at))
      return entries
    },
  })
}
