import { Banknote, FileText, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { Alert } from '../../components/ui/Alert'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { IconButton } from '../../components/ui/IconButton'
import { usePartiesPage } from '../../hooks/parties/usePartiesPage'
import { t } from '../../i18n'
import { formatMoney } from '../../lib/format'
import type { PartyKind } from './partyKinds'
import { PartyFormModal } from './PartyFormModal'
import { PartyPaymentModal } from './PartyPaymentModal'
import { StatementModal } from './StatementModal'

interface PartiesPageProps {
  kind: PartyKind
  // Without it the list is read-only (cashiers browsing customers).
  canManage: boolean
}

// One screen for both customers and suppliers.
export function PartiesPage({ kind, canManage }: PartiesPageProps) {
  const { labels } = kind
  const {
    currency,
    searchInput,
    setSearchInput,
    parties,
    error,
    notice,
    dialog,
    openDialog,
    closeDialog,
    refresh,
    finish,
    removeParty,
    totalBalance,
    columnCount
  } = usePartiesPage(kind, canManage)

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
            onClick={() => openDialog({ kind: 'create' })}
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
                        onClick={() => openDialog({ kind: 'pay', party })}
                      />
                      <IconButton
                        icon={FileText}
                        label={t.parties.statement}
                        onClick={() => openDialog({ kind: 'statement', party })}
                      />
                      <IconButton
                        icon={Pencil}
                        label={t.parties.edit}
                        onClick={() => openDialog({ kind: 'edit', party })}
                      />
                      <IconButton
                        icon={Trash2}
                        label={t.parties.delete}
                        tone="danger"
                        onClick={() => openDialog({ kind: 'delete', party })}
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
          onClose={() => closeDialog()}
          onSaved={() => finish(t.parties.saved)}
        />
      )}
      {dialog?.kind === 'pay' && (
        <PartyPaymentModal
          kind={kind}
          party={dialog.party}
          onClose={() => closeDialog()}
          onSaved={() => finish(t.parties.paymentSaved)}
        />
      )}
      {dialog?.kind === 'statement' && (
        <StatementModal
          kind={kind}
          partyId={dialog.party.id}
          onChanged={refresh}
          onClose={() => closeDialog()}
        />
      )}
      {dialog?.kind === 'delete' && (
        <ConfirmDialog
          title={labels.deleteTitle}
          body={labels.deleteBody(dialog.party.name)}
          confirmLabel={t.parties.delete}
          onConfirm={() => removeParty(dialog.party)}
          onClose={() => closeDialog()}
        />
      )}
    </div>
  )
}
