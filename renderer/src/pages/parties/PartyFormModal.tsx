import type { PartyDto } from '../../../../shared/parties'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { TextField } from '../../components/ui/Field'
import { Modal } from '../../components/ui/Modal'
import { usePartyFormModal } from '../../hooks/parties/usePartyFormModal'
import { t } from '../../i18n'
import type { PartyKind } from './partyKinds'

interface PartyFormModalProps {
  kind: PartyKind
  // Omit to create.
  party?: PartyDto
  onClose: () => void
  onSaved: () => void
}

export function PartyFormModal({ kind, party, onClose, onSaved }: PartyFormModalProps) {
  const { name, setName, phone, setPhone, address, setAddress, error, saving, submit } =
    usePartyFormModal({ kind, party, onSaved })

  return (
    <Modal title={party ? kind.labels.editTitle : kind.labels.add} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        {error && <Alert>{error}</Alert>}
        <TextField
          label={t.parties.name}
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={100}
          autoFocus
          required
        />
        <TextField
          label={t.parties.phone}
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          maxLength={30}
          type="tel"
          dir="ltr"
          className="text-start"
        />
        <TextField
          label={t.parties.address}
          value={address}
          onChange={(event) => setAddress(event.target.value)}
          maxLength={200}
        />
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>
            {t.common.cancel}
          </Button>
          <Button type="submit" loading={saving}>
            {party ? t.common.save : t.common.add}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
