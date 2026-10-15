import type { PartyDto } from '../../../../shared/parties'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { TextField } from '../../components/ui/Field'
import { Modal } from '../../components/ui/Modal'
import { usePartyPaymentModal } from '../../hooks/parties/usePartyPaymentModal'
import { t } from '../../i18n'
import { formatMoney } from '../../lib/format'
import type { PartyKind } from './partyKinds'

interface PartyPaymentModalProps {
  kind: PartyKind
  party: PartyDto
  onClose: () => void
  onSaved: () => void
}

export function PartyPaymentModal({ kind, party, onClose, onSaved }: PartyPaymentModalProps) {
  const { currency, amount, setAmount, payAll, note, setNote, exceeds, error, saving, submit } =
    usePartyPaymentModal({ kind, party, onSaved })

  return (
    <Modal title={kind.labels.payTitle(party.name)} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        {error && <Alert>{error}</Alert>}
        <dl className="type-body-sm flex items-center justify-between rounded-md bg-surface px-4 py-3">
          <dt className="text-ink-muted">{kind.labels.currentBalance}</dt>
          <dd className="type-label-strong tabular-nums">{formatMoney(party.balance, currency)}</dd>
        </dl>
        <TextField
          label={`${t.parties.amount} (${currency})`}
          type="number"
          min={0}
          step="any"
          dir="ltr"
          className="text-start"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          error={exceeds ? t.errors.PAYMENT_EXCEEDS : undefined}
          autoFocus
          required
        />
        <Button variant="secondary" size="sm" onClick={payAll}>
          {t.parties.payAll}
        </Button>
        <TextField
          label={t.parties.noteOptional}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          maxLength={200}
        />
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>
            {t.common.cancel}
          </Button>
          <Button type="submit" loading={saving} disabled={exceeds}>
            {kind.labels.pay}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
