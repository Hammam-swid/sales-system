import type { PartyDto } from '../../../../shared/parties'
import { Card } from '../../components/ui/Card'
import { t } from '../../i18n'
import { formatMoney } from '../../lib/format'
import { useCurrency } from '../../store/settings'

interface BalanceTableProps {
  title: string
  empty: string
  parties: PartyDto[]
  total: number
}

export function BalanceTable({ title, empty, parties, total }: BalanceTableProps) {
  const currency = useCurrency()
  return (
    <Card className="overflow-x-auto">
      <div className="flex items-baseline justify-between gap-4 px-6 pt-5 pb-3">
        <h3 className="type-h4">{title}</h3>
        <p className="type-h3 tabular-nums">{formatMoney(total, currency)}</p>
      </div>
      {parties.length === 0 ? (
        <p className="type-body-sm px-6 pb-8 text-center text-ink-muted">{empty}</p>
      ) : (
        <table className="type-body-sm w-full">
          <thead className="type-label border-y border-border text-ink-muted">
            <tr>
              <th className="px-6 py-3 text-start">{t.parties.name}</th>
              <th className="px-6 py-3 text-start">{t.parties.phone}</th>
              <th className="px-6 py-3 text-end">{t.parties.balance}</th>
            </tr>
          </thead>
          <tbody>
            {parties.map((party) => (
              <tr key={party.id} className="border-b border-border last:border-0">
                <td className="type-label px-6 py-2 text-ink">{party.name}</td>
                <td dir="ltr" className="px-6 py-2 text-end tabular-nums">
                  {party.phone ?? '—'}
                </td>
                <td className="px-6 py-2 text-end font-medium tabular-nums">
                  {formatMoney(party.balance, currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  )
}
