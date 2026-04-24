import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import { useFamilyId } from './useFamily'

export const EXPENSE_CATEGORIES = [
  { value: 'school', label: 'École' },
  { value: 'school_trip', label: 'Sortie scolaire' },
  { value: 'medical', label: 'Santé' },
  { value: 'clothing', label: 'Vêtements' },
  { value: 'food', label: 'Alimentation' },
  { value: 'leisure', label: 'Loisirs' },
  { value: 'sport', label: 'Sport' },
  { value: 'vacation', label: 'Vacances' },
  { value: 'transport', label: 'Transport' },
  { value: 'gifts', label: 'Cadeaux' },
  { value: 'childcare', label: "Garde d'enfants" },
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
          'id, description, category, amount_cents, currency, incurred_on, status, reject_reason, payer_id, validated_by, validated_at, created_at, child_id, receipt_path',
        )
        .eq('family_id', familyId)
        .order('incurred_on', { ascending: false })

      if (error) throw error
      return data
    },
  })
}

/**
 * URL signée (5 min) pour consulter/télécharger une facture jointe.
 */
export async function getReceiptSignedUrl(path) {
  if (!path) return null
  const { data, error } = await supabase.storage
    .from('documents')
    .createSignedUrl(path, 300)
  if (error) throw error
  return data?.signedUrl ?? null
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

      // Upload facture (optionnel) dans le bucket documents.
      // Convention de path : <family_id>/receipts/<uuid>.<ext> pour rester
      // aligné avec la policy RLS du bucket (1er segment = family_id).
      let receiptPath = null
      if (input.receipt_file instanceof File) {
        const file = input.receipt_file
        const ext = (file.name.split('.').pop() || 'bin').toLowerCase()
        const uuid = crypto.randomUUID()
        const path = `${familyId}/receipts/${uuid}.${ext}`
        const { error: upErr } = await supabase.storage
          .from('documents')
          .upload(path, file, {
            cacheControl: '3600',
            contentType: file.type || 'application/octet-stream',
            upsert: false,
          })
        if (upErr) throw upErr
        receiptPath = path
      }

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
        receipt_path: receiptPath,
      }

      const { data, error } = await supabase
        .from('expenses')
        .insert(payload)
        .select()
        .single()

      if (error) {
        // Si l'insert DB échoue, supprimer le fichier uploadé pour ne pas
        // laisser d'orphelin dans Storage.
        if (receiptPath) {
          await supabase.storage.from('documents').remove([receiptPath])
        }
        throw error
      }
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
