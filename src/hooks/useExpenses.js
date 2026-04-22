import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import { useFamilyId } from './useFamily'

export const EXPENSE_CATEGORIES = [
  { value: 'school', label: 'École' },
  { value: 'medical', label: 'Santé' },
  { value: 'clothing', label: 'Vêtements' },
  { value: 'leisure', label: 'Loisirs' },
  { value: 'food', label: 'Alimentation' },
  { value: 'other', label: 'Autre' },
]

/**
 * Liste les dépenses de la famille, plus récentes d'abord.
 */
export function useExpenses() {
  const familyId = useFamilyId()

  return useQuery({
    queryKey: ['expenses', familyId],
    enabled: !!familyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expenses')
        .select(
          'id, description, category, amount_cents, currency, incurred_on, status, reject_reason, payer_id, validated_by, validated_at, created_at, child_id'
        )
        .eq('family_id', familyId)
        .order('incurred_on', { ascending: false })

      if (error) throw error
      return data
    },
  })
}

/**
 * Créer une dépense. Le payer est toujours l'utilisateur courant.
 */
export function useAddExpense() {
  const qc = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const familyId = useFamilyId()

  return useMutation({
    mutationFn: async (input) => {
      if (!familyId || !user) throw new Error('Famille introuvable')

      const payload = {
        family_id: familyId,
        child_id: input.child_id || null,
        description: input.description,
        category: input.category,
        amount_cents: Math.round(Number(input.amount) * 100),
        currency: 'EUR',
        incurred_on: input.incurred_on,
        payer_id: user.id,
        status: 'pending',
      }

      const { data, error } = await supabase
        .from('expenses')
        .insert(payload)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expenses', familyId] })
    },
  })
}

/**
 * Valider une dépense — uniquement par un membre qui n'est pas le payeur.
 * La contrainte DB refuse si validated_by = payer_id.
 */
export function useValidateExpense() {
  const qc = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const familyId = useFamilyId()

  return useMutation({
    mutationFn: async (expenseId) => {
      if (!user) throw new Error('Non authentifié')

      const { data, error } = await supabase
        .from('expenses')
        .update({
          status: 'approved',
          validated_by: user.id,
          validated_at: new Date().toISOString(),
          reject_reason: null,
        })
        .eq('id', expenseId)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expenses', familyId] })
    },
  })
}

/**
 * Refuser une dépense avec motif obligatoire.
 */
export function useRejectExpense() {
  const qc = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const familyId = useFamilyId()

  return useMutation({
    mutationFn: async ({ expenseId, reason }) => {
      if (!user) throw new Error('Non authentifié')
      if (!reason?.trim()) throw new Error('Un motif de refus est obligatoire')

      const { data, error } = await supabase
        .from('expenses')
        .update({
          status: 'rejected',
          validated_by: user.id,
          validated_at: new Date().toISOString(),
          reject_reason: reason.trim(),
        })
        .eq('id', expenseId)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expenses', familyId] })
    },
  })
}
