import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useFamily, useFamilyId } from './useFamily'
import { useChildren } from './useChildren'

/**
 * Règles du plan Parenty :
 *
 *   Plan gratuit :
 *     - 1 enfant maximum
 *     - 10 documents actifs maximum
 *     - 10 dépenses par mois calendaire maximum
 *     - Historique visible : 1 an glissant
 *
 *   Plan Premium : illimité sur tout.
 *
 * La source de vérité est la DB (triggers enforce_free_plan_*_limit). Ce
 * hook sert à l'UI : désactiver les boutons, afficher des banners, filtrer
 * l'historique dans /history.
 */
const FREE_LIMITS = {
  children: 1,
  documents: 10,
  expensesPerMonth: 10,
  historyDays: 365,
}

export function usePlanLimits() {
  const { data: familyData } = useFamily()
  const familyId = useFamilyId()
  const { data: children = [] } = useChildren()

  const status = familyData?.family?.subscription_status ?? 'free'
  const isPremium = status === 'active'

  // Comptage documents actifs (léger : on ne sélectionne que l'id).
  // Le préfixe ['documents', familyId, …] permet d'être invalidé par les
  // mutations existantes (useAddDocument, useDeleteDocument).
  const docCountQuery = useQuery({
    queryKey: ['documents', familyId, 'active-count'],
    enabled: !!familyId && !isPremium,
    queryFn: async () => {
      const { count, error } = await supabase
        .from('documents')
        .select('id', { count: 'exact', head: true })
        .eq('family_id', familyId)
        .is('deleted_at', null)
      if (error) throw error
      return count ?? 0
    },
  })

  // Comptage dépenses du mois courant (non refusées).
  const expenseCountQuery = useQuery({
    queryKey: ['expenses', familyId, 'current-month-count'],
    enabled: !!familyId && !isPremium,
    queryFn: async () => {
      const now = new Date()
      const first = new Date(now.getFullYear(), now.getMonth(), 1)
        .toISOString()
        .slice(0, 10)
      const nextFirst = new Date(now.getFullYear(), now.getMonth() + 1, 1)
        .toISOString()
        .slice(0, 10)
      const { count, error } = await supabase
        .from('expenses')
        .select('id', { count: 'exact', head: true })
        .eq('family_id', familyId)
        .neq('status', 'rejected')
        .gte('incurred_on', first)
        .lt('incurred_on', nextFirst)
      if (error) throw error
      return count ?? 0
    },
  })

  const historyMinDate = useMemo(() => {
    if (isPremium) return null
    const d = new Date()
    d.setDate(d.getDate() - FREE_LIMITS.historyDays)
    return d
  }, [isPremium])

  const childCount = children.length
  const docCount = docCountQuery.data ?? 0
  const expenseCount = expenseCountQuery.data ?? 0

  return {
    isPremium,
    subscriptionStatus: status,

    // Enfants
    childCount,
    childrenLimit: isPremium ? null : FREE_LIMITS.children,
    canAddChild: isPremium || childCount < FREE_LIMITS.children,
    atChildLimit: !isPremium && childCount >= FREE_LIMITS.children,

    // Documents
    docCount,
    docLimit: isPremium ? null : FREE_LIMITS.documents,
    canAddDocument: isPremium || docCount < FREE_LIMITS.documents,
    atDocLimit: !isPremium && docCount >= FREE_LIMITS.documents,

    // Dépenses mois courant
    expenseCount,
    expenseLimit: isPremium ? null : FREE_LIMITS.expensesPerMonth,
    canAddExpense: isPremium || expenseCount < FREE_LIMITS.expensesPerMonth,
    atExpenseLimit:
      !isPremium && expenseCount >= FREE_LIMITS.expensesPerMonth,

    // Historique
    historyDays: isPremium ? null : FREE_LIMITS.historyDays,
    historyMinDate,
  }
}
