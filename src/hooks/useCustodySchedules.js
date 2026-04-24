import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import { useFamilyId } from './useFamily'

/**
 * Un enregistrement de custody_schedules représente un bloc de garde
 * récurrent (hebdomadaire ou bimensuel pair/impair) sur un intervalle
 * jour-de-semaine+heure.
 *
 * Ex : parent_user_id = Papa, du dimanche 17:00 au mercredi 10:00,
 *      recurrence = 'weekly'.
 */
export const RECURRENCE_OPTIONS = [
  { value: 'weekly', label: 'Chaque semaine' },
  { value: 'biweekly_even', label: 'Semaines paires' },
  { value: 'biweekly_odd', label: 'Semaines impaires' },
]

export const DAYS_OF_WEEK = [
  { value: 1, label: 'Lundi', short: 'Lun' },
  { value: 2, label: 'Mardi', short: 'Mar' },
  { value: 3, label: 'Mercredi', short: 'Mer' },
  { value: 4, label: 'Jeudi', short: 'Jeu' },
  { value: 5, label: 'Vendredi', short: 'Ven' },
  { value: 6, label: 'Samedi', short: 'Sam' },
  { value: 0, label: 'Dimanche', short: 'Dim' },
]

export function useCustodySchedules() {
  const familyId = useFamilyId()
  return useQuery({
    queryKey: ['custody_schedules', familyId],
    enabled: !!familyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('custody_schedules')
        .select(
          'id, family_id, parent_user_id, label, start_day_of_week, start_time, end_day_of_week, end_time, recurrence, valid_from, valid_to, created_by, created_at',
        )
        .eq('family_id', familyId)
        .is('deleted_at', null)
        .order('created_at', { ascending: true })
      if (error) throw error
      return data
    },
  })
}

export function useAddCustodySchedule() {
  const qc = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const familyId = useFamilyId()

  return useMutation({
    mutationFn: async (input) => {
      if (!user || !familyId) throw new Error('Famille introuvable')
      const payload = {
        family_id: familyId,
        parent_user_id: input.parent_user_id,
        label: input.label?.trim() || null,
        start_day_of_week: Number(input.start_day_of_week),
        start_time: input.start_time,
        end_day_of_week: Number(input.end_day_of_week),
        end_time: input.end_time,
        recurrence: input.recurrence || 'weekly',
        valid_from: input.valid_from || null,
        valid_to: input.valid_to || null,
        created_by: user.id,
      }
      const { data, error } = await supabase
        .from('custody_schedules')
        .insert(payload)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['custody_schedules', familyId] })
    },
  })
}

export function useUpdateCustodySchedule() {
  const qc = useQueryClient()
  const familyId = useFamilyId()

  return useMutation({
    mutationFn: async ({ id, patch }) => {
      if (!id) throw new Error('Identifiant manquant')
      const payload = {
        parent_user_id: patch.parent_user_id,
        label: patch.label?.trim() || null,
        start_day_of_week: Number(patch.start_day_of_week),
        start_time: patch.start_time,
        end_day_of_week: Number(patch.end_day_of_week),
        end_time: patch.end_time,
        recurrence: patch.recurrence || 'weekly',
        valid_from: patch.valid_from || null,
        valid_to: patch.valid_to || null,
      }
      const { data, error } = await supabase
        .from('custody_schedules')
        .update(payload)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['custody_schedules', familyId] })
    },
  })
}

export function useDeleteCustodySchedule() {
  const qc = useQueryClient()
  const familyId = useFamilyId()

  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase
        .from('custody_schedules')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
      return true
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['custody_schedules', familyId] })
    },
  })
}

// ---------------------------------------------------------------------
// Expansion en événements virtuels pour un mois donné
// ---------------------------------------------------------------------

/**
 * Indice ISO 8601 de la semaine (numéro de semaine dans l'année).
 * On s'en sert pour déterminer "semaine paire" vs "semaine impaire".
 */
function isoWeek(date) {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  )
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7)
}

function matchesWeek(recurrence, date) {
  if (recurrence === 'weekly') return true
  const week = isoWeek(date)
  if (recurrence === 'biweekly_even') return week % 2 === 0
  if (recurrence === 'biweekly_odd') return week % 2 === 1
  return false
}

function withTime(date, hhmm) {
  const [h, m] = (hhmm || '00:00').split(':').map(Number)
  const d = new Date(date)
  d.setHours(h, m, 0, 0)
  return d
}

/**
 * Étend un schedule en intervalles {starts_at, ends_at} concrets
 * qui chevauchent la fenêtre [from, to].
 *
 * Pour chaque "semaine candidate" (lundi de référence), on calcule la
 * date de début (start_day_of_week + start_time) puis la date de fin
 * (end_day_of_week + end_time), en ajoutant 7 jours si end_day tombe
 * avant start_day ou si c'est le même jour avec end_time <= start_time.
 */
export function expandSchedule(schedule, from, to) {
  const items = []
  // On élargit d'une semaine de chaque côté pour couvrir les chevauchements.
  const cursor = new Date(from)
  cursor.setDate(cursor.getDate() - 7)
  const endWindow = new Date(to)
  endWindow.setDate(endWindow.getDate() + 7)

  // Recentre le curseur sur le start_day_of_week le plus proche avant.
  const targetDow = schedule.start_day_of_week
  while (cursor.getDay() !== targetDow) {
    cursor.setDate(cursor.getDate() - 1)
  }

  const validFrom = schedule.valid_from ? new Date(schedule.valid_from) : null
  const validTo = schedule.valid_to ? new Date(schedule.valid_to) : null

  while (cursor <= endWindow) {
    const weekDate = new Date(cursor)
    if (matchesWeek(schedule.recurrence, weekDate)) {
      const starts = withTime(weekDate, schedule.start_time)

      // Calcul du jour de fin : on avance jusqu'au end_day_of_week.
      let diff = (schedule.end_day_of_week - schedule.start_day_of_week + 7) % 7
      if (
        diff === 0 &&
        schedule.end_time <= schedule.start_time
      ) {
        diff = 7
      }
      const endDate = new Date(weekDate)
      endDate.setDate(endDate.getDate() + diff)
      const ends = withTime(endDate, schedule.end_time)

      const withinValid =
        (!validFrom || ends >= validFrom) &&
        (!validTo || starts <= validTo)

      if (withinValid && ends >= from && starts <= to) {
        items.push({
          id: `custody-${schedule.id}-${starts.toISOString()}`,
          schedule_id: schedule.id,
          kind: 'custody',
          title: schedule.label || 'Garde',
          starts_at: starts.toISOString(),
          ends_at: ends.toISOString(),
          parent_user_id: schedule.parent_user_id,
          is_virtual: true,
        })
      }
    }
    cursor.setDate(cursor.getDate() + 7)
  }
  return items
}

/**
 * Hook : retourne les événements virtuels issus des schedules pour une
 * fenêtre [from, to].
 */
export function useExpandedCustodyEvents(from, to) {
  const { data: schedules = [] } = useCustodySchedules()
  if (!from || !to) return []
  const out = []
  for (const s of schedules) {
    out.push(...expandSchedule(s, from, to))
  }
  return out
}
