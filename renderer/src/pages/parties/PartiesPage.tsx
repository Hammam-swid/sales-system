import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { Banknote, FileText, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import type { PartyDto } from '../../../../shared/parties'
import { Alert } from '../../components/ui/Alert'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { TextField } from '../../components/ui/Field'
import { IconButton } from '../../components/ui/IconButton'
import { Modal } from '../../components/ui/Modal'
import { t } from '../../i18n'
import { errorText } from '../../lib/api'
import { formatMoney, parseNumber } from '../../lib/format'
import { useCurrency } from '../../store/settings'
import type { PartyKind } from './partyKinds'
import { StatementModal } from './StatementModal'

const SEARCH_DEBOUNCE_MS = 250

type Dialog =
  | { kind: 'create' }
  | { kind: 'edit'; party: PartyDto }
  | { kind: 'pay'; party: PartyDto }
  | { kind: 'statement'; party: PartyDto }
  | { kind: 'delete'; party: PartyDto }
  | null

interface PartiesPageProps {
  kind: PartyKind
  // Without it the list is read-only (cashiers browsing customers).
  canManage: boolean
}

// One screen for both customers and suppliers.
export function PartiesPage({ kind, canManage }: PartiesPageProps) {
  const { labels } = kind
  const currency = useCurrency()
  const [searchInput, setSearchInput] = useState('')
  const [parties, setParties] = useState<PartyDto[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [dialog, setDialog] = useState<Dialog>(null)
  const requestId = useRef(0)

  const load = useCallback(
    async (search: string) => {
      const current = ++requestId.current
      const result = await kind.list(search)
      if (current !== requestId.current) return
      if (result.ok) {
        setParties(result.data)
        setError(null)
      } else {
        setError(errorText(result))
      }
    },
    [kind]
  )

  useEffect(() => {
    const timer = setTimeout(() => void load(searchInput.trim()), SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [searchInput, load])

  const refresh = () => void load(searchInput.trim())

  const finish = (message: string) => {
    setDialog(null)
    setNotice(message)
    refresh()
  }

  const removeParty = async (party: PartyDto) => {
    const result = await kind.remove(party.id)
    if (!result.ok) return errorText(result)
    finish(t.parties.deleted)
  }

  const totalBalance = (parties ?? []).reduce((sum, party) => sum + party.balance, 0)
  const columnCount = canManage ? 5 : 4

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <h2 className="type-h2">{labels.title}</h2>
          <p className="type-body text-ink-muted">{labels.subtitle}</p>
        </div>
        <Card className="px-6 py-3">
          <p className="type-caption text-ink-muted">{labels.totalBalance}</p>
          <p className="type-h3 tabular-nums">{formatMoney(totalBalance, currency)}</p>
        </Card>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-64 flex-1">
          <Search
            aria-hidden
            className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted"
          />
          <input
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder={labels.searchPlaceholder}
            aria-label={labels.searchPlaceholder}
            className="type-body-sm h-11 w-full rounded-sm border border-border-strong bg-bg ps-10 pe-3 text-ink placeholder:text-ink-muted"
            autoFocus
          />
        </div>
        {canManage && (
          <Button
            icon={<Plus aria-hidden className="size-4" />}
            onClick={() => setDialog({ kind: 'create' })}
          >
            {labels.add}
          </Button>
        )}
      </div>

      {notice && <Alert tone="success">{notice}</Alert>}
      {error && <Alert>{error}</Alert>}

      <Card className="overflow-x-auto">
        <table className="type-body-sm w-full">
          <thead className="type-label border-b border-border text-ink-muted">
            <tr>
              <th className="px-6 py-3 text-start">{t.parties.name}</th>
              <th className="px-6 py-3 text-start">{t.parties.phone}</th>
              <th className="px-6 py-3 text-start">{t.parties.address}</th>
              <th className="px-6 py-3 text-end">{labels.balanceLabel}</th>
              {canManage && <th className="px-6 py-3 text-end">{t.common.actions}</th>}
            </tr>
          </thead>
          <tbody>
            {parties === null && !error && (
              <tr>
                <td colSpan={columnCount} className="px-6 py-10 text-center text-ink-muted">
                  {t.common.loading}
                </td>
              </tr>
            )}
            {parties?.length === 0 && (
              <tr>
                <td colSpan={columnCount} className="px-6 py-10 text-center text-ink-muted">
                  {labels.empty}
                </td>
              </tr>
            )}
            {parties?.map((party) => (
              <tr key={party.id} className="border-b border-border last:border-0">
                <td className="type-label px-6 py-3 text-ink">{party.name}</td>
                <td dir="ltr" className="px-6 py-3 text-end tabular-nums">
                  {party.phone ?? '—'}
                </td>
                <td className="px-6 py-3 text-ink-muted">{party.address ?? '—'}</td>
                <td className="px-6 py-3 text-end">
                  {party.balance > 0 ? (
                    <Badge tone={kind.balanceTone}>{formatMoney(party.balance, currency)}</Badge>
                  ) : (
                    <span className="text-ink-muted tabular-nums">
                      {formatMoney(party.balance, currency)}
                    </span>
                  )}
                </td>
                {canManage && (
                  <td className="px-6 py-3">
                    <div className="flex justify-end">
                      <IconButton
                        icon={Banknote}
                        label={labels.pay}
                        disabled={party.balance <= 0}
                        onClick={() => setDialog({ kind: 'pay', party })}
                      />
                      <IconButton
                        icon={FileText}
                        label={t.parties.statement}
                        onClick={() => setDialog({ kind: 'statement', party })}
                      />
                      <IconButton
                        icon={Pencil}
                        label={t.parties.edit}
                        onClick={() => setDialog({ kind: 'edit', party })}
                      />
                      <IconButton
                        icon={Trash2}
                        label={t.parties.delete}
                        tone="danger"
                        onClick={() => setDialog({ kind: 'delete', party })}
                      />
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {(dialog?.kind === 'create' || dialog?.kind === 'edit') && (
        <PartyFormModal
          kind={kind}
          party={dialog.kind === 'edit' ? dialog.party : undefined}
          onClose={() => setDialog(null)}
          onSaved={() => finish(t.parties.saved)}
        />
      )}
      {dialog?.kind === 'pay' && (
        <PartyPaymentModal
          kind={kind}
          party={dialog.party}
          onClose={() => setDialog(null)}
          onSaved={() => finish(t.parties.paymentSaved)}
        />
      )}
      {dialog?.kind === 'statement' && (
        <StatementModal
          kind={kind}
          partyId={dialog.party.id}
          onChanged={refresh}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog?.kind === 'delete' && (
        <ConfirmDialog
          title={labels.deleteTitle}
          body={labels.deleteBody(dialog.party.name)}
          confirmLabel={t.parties.delete}
          onConfirm={() => removeParty(dialog.party)}
          onClose={() => setDialog(null)}
        />
      )}
    </div>
  )
}

interface PartyFormModalProps {
  kind: PartyKind
  // Omit to create.
  party?: PartyDto
  onClose: () => void
  onSaved: () => void
}

function PartyFormModal({ kind, party, onClose, onSaved }: PartyFormModalProps) {
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

interface PartyPaymentModalProps {
  kind: PartyKind
  party: PartyDto
  onClose: () => void
  onSaved: () => void
}

function PartyPaymentModal({ kind, party, onClose, onSaved }: PartyPaymentModalProps) {
  const currency = useCurrency()
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const value = parseNumber(amount)
  const exceeds = value !== null && value > party.balance

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (value === null || value <= 0 || exceeds) return
    setSaving(true)
    setError(null)
    const result = await kind.pay({
      id: party.id,
      amount: value,
      note: note.trim() === '' ? null : note.trim()
    })
    setSaving(false)
    if (result.ok) onSaved()
    else setError(errorText(result))
  }

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
        <Button variant="secondary" size="sm" onClick={() => setAmount(String(party.balance))}>
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
