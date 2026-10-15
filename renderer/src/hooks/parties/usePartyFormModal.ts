import { useState, type FormEvent } from 'react'
import type { PartyDto } from '../../../../shared/parties'
import { errorText } from '../../lib/api'
import type { PartyKind } from '../../pages/parties/partyKinds'

interface Options {
  kind: PartyKind
  // Omit to create.
  party?: PartyDto
  onSaved: () => void
}

export function usePartyFormModal({ kind, party, onSaved }: Options) {
  const [name, setName] = useState(party?.name ?? '')
  const [phone, setPhone] = useState(party?.phone ?? '')
  const [address, setAddress] = useState(party?.address ?? '')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setError(null)
    const result = await kind.save({
      id: party?.id,
      name,
      phone: phone.trim() === '' ? null : phone.trim(),
      address: address.trim() === '' ? null : address.trim()
    })
    setSaving(false)
    if (result.ok) onSaved()
    else setError(errorText(result))
  }

  return { name, setName, phone, setPhone, address, setAddress, error, saving, submit }
}
