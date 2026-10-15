import type { StatementEntryKind } from '../../../../shared/parties'
import { Alert } from '../../components/ui/Alert'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { useStatementModal } from '../../hooks/parties/useStatementModal'
import { t } from '../../i18n'
import { formatDateTime } from '../../lib/format'
import type { PartyKind } from './partyKinds'

const KIND_TONE: Record<StatementEntryKind, 'brand' | 'success' | 'neutral'> = {
  invoice: 'brand',
  payment: 'success',
  return_credit: 'neutral'
}

interface StatementModalProps {
  kind: PartyKind
  partyId: number
  // Called when a recalculation changes the stored balance.
  onChanged: () => void
  onClose: () => void
}

// Full history for one customer or supplier, with a running balance, plus a check
// that the stored balance matches what the history adds up to.
export function StatementModal({ kind, partyId, onChanged, onClose }: StatementModalProps) {
  const { money, statement, error, notice, fixing, recalculate, mismatch, rows } =
    useStatementModal({ kind, partyId, onChanged })

  return (
    <Modal
      title={statement ? t.parties.statementFor(statement.party.name) : t.parties.statement}
      size="lg"
      onClose={onClose}
    >
      <div className="space-y-4">
        {error && <Alert>{error}</Alert>}
        {notice && <Alert tone="success">{notice}</Alert>}
        {!statement && !error && (
          <p className="type-body-sm py-6 text-center text-ink-muted">{t.common.loading}</p>
        )}

        {statement && (
          <>
            <div className="flex items-center justify-between gap-4 rounded-md bg-surface px-4 py-3">
              <div>
                <p className="type-caption text-ink-muted">{kind.labels.currentBalance}</p>
                <p className="type-h3 tabular-nums">{money(statement.party.balance)}</p>
              </div>
              {!mismatch && <p className="type-caption text-success">{t.parties.verified}</p>}
            </div>

            {mismatch && (
              <div className="type-body-sm flex flex-wrap items-center justify-between gap-3 rounded-md bg-warning-tint px-4 py-3 text-warning">
                <span>
                  {t.parties.mismatch(
                    money(statement.party.balance),
                    money(statement.computedBalance)
                  )}
                </span>
                <Button variant="secondary" size="sm" loading={fixing} onClick={recalculate}>
                  {t.parties.recalculate}
                </Button>
              </div>
            )}

            {rows.length === 0 ? (
              <p className="type-body-sm py-6 text-center text-ink-muted">{t.parties.noEntries}</p>
            ) : (
              <div className="max-h-[50vh] overflow-y-auto rounded-md border border-border">
                <table className="type-body-sm w-full">
                  <thead className="type-label sticky top-0 border-b border-border bg-surface text-ink-muted">
                    <tr>
                      <th className="px-4 py-2 text-start">{t.parties.date}</th>
                      <th className="px-4 py-2 text-start">{t.parties.entry}</th>
                      <th className="px-4 py-2 text-end">{t.parties.invoiceTotal}</th>
                      <th className="px-4 py-2 text-end">{t.parties.change}</th>
                      <th className="px-4 py-2 text-end">{t.parties.balanceAfter}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((entry, index) => (
                      <tr key={index} className="border-b border-border last:border-0">
                        <td className="px-4 py-2 whitespace-nowrap text-ink-muted tabular-nums">
                          {formatDateTime(entry.date)}
                        </td>
                        <td className="px-4 py-2">
                          <span className="flex flex-wrap items-center gap-2">
                            <Badge tone={KIND_TONE[entry.kind]}>
                              {t.parties.entryKind[entry.kind]}
                            </Badge>
                            {entry.reference && (
                              <span dir="ltr" className="tabular-nums">
                                {entry.reference}
                              </span>
                            )}
                            {entry.note && <span className="text-ink-muted">{entry.note}</span>}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-end tabular-nums">
                          {entry.total === null ? '—' : money(entry.total)}
                        </td>
                        <td dir="ltr" className="px-4 py-2 text-start font-medium tabular-nums">
                          {entry.change > 0 ? '+' : entry.change < 0 ? '−' : ''}
                          {money(Math.abs(entry.change))}
                        </td>
                        <td className="px-4 py-2 text-end tabular-nums">
                          {money(entry.balanceAfter)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  )
}
