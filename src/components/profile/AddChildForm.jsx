import { useState } from 'react'
import { useAddChild } from '../../hooks/useChildrenMutations'

export default function AddChildForm({ onSuccess, onCancel }) {
  const addChild = useAddChild()
  const [firstName, setFirstName] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [error, setError] = useState(null)

  const submit = async (e) => {
    e.preventDefault()
    setError(null)
    if (!firstName.trim()) return setError('Le prénom est requis.')
    if (!birthDate) return setError('La date de naissance est requise.')
    try {
      await addChild.mutateAsync({ first_name: firstName.trim(), birth_date: birthDate })
      onSuccess?.()
    } catch (err) {
      setError(err.message || 'Erreur lors de l\'ajout.')
    }
  }

  return (
    <form onSubmit={submit} className="space-y-md">
      <div>
        <label className="label" htmlFor="first_name">Prénom</label>
        <input
          id="first_name"
          type="text"
          required
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          className="input"
        />
      </div>
      <div>
        <label className="label" htmlFor="birth_date">Date de naissance</label>
        <input
          id="birth_date"
          type="date"
          required
          value={birthDate}
          onChange={(e) => setBirthDate(e.target.value)}
          className="input"
        />
      </div>

      {error && (
        <div className="text-body-md text-on-error-container bg-error-container rounded-md p-3">
          {error}
        </div>
      )}

      <div className="flex gap-md pt-sm">
        <button type="button" onClick={onCancel} className="btn-secondary flex-1">
          Annuler
        </button>
        <button type="submit" disabled={addChild.isPending} className="btn-primary flex-1">
          {addChild.isPending ? 'Ajout…' : 'Ajouter'}
        </button>
      </div>
    </form>
  )
}
