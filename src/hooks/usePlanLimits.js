import { useFamily } from './useFamily'
import { useChildren } from './useChildren'

/**
 * Règles simples du plan Parenty :
 *
 *   - Plan gratuit  : 1 enfant maximum (toutes les autres fonctionnalités
 *                     sont accessibles : agenda, dépenses, documents, chat,
 *                     invitation co-parent…).
 *   - Plan Premium  : illimité.
 *
 * Centralisé ici pour que l'UI (Profile, modales, banners) et les guards
 * côté composants partagent la même vérité. La DB applique la même règle
 * via le trigger enforce_free_plan_children_limit pour que le back-end
 * reste source de vérité.
 */
const FREE_PLAN_CHILD_LIMIT = 1

export function usePlanLimits() {
  const { data: familyData } = useFamily()
  const { data: children = [] } = useChildren()

  const status = familyData?.family?.subscription_status ?? 'free'
  const isPremium = status === 'active'
  const childCount = children.length

  const canAddChild = isPremium || childCount < FREE_PLAN_CHILD_LIMIT
  const childrenLimit = isPremium ? null : FREE_PLAN_CHILD_LIMIT
  const atChildLimit = !canAddChild

  return {
    isPremium,
    subscriptionStatus: status,
    childCount,
    childrenLimit,
    canAddChild,
    atChildLimit,
  }
}
