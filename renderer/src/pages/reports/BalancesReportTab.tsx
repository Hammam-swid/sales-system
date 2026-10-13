import { useEffect } from 'react'
import type { PartyDto } from '../../../../shared/parties'
import type { ExportSheet } from '../../../../shared/reports'
import { Alert } from '../../components/ui/Alert'
import { Card } from '../../components/ui/Card'
import { t } from '../../i18n/ar'
import { api } from '../../lib/api'
import { formatMoney } from '../../lib/format'
import { useCurrency } from '../../store/settings'
import { useReport } from './useReport'

function partySheet(name: string, parties: PartyDto[], total: number): ExportSheet {
  return {
    name,
    columns: [
      { header: t.parties.name, width: 30 },
      { header: t.parties.phone, width: 18 },
      { header: t.parties.balance, money: true }
    ],
    rows: [
      ...parties.map((party) => [party.name, party.phone ?? '', party.balance]),
      [t.reports.total, '', total]
    ]
  }
}

interface BalanceTableProps {
  title: string
  empty: string
  parties: PartyDto[]
  total: number
}

function BalanceTable({ title, empty, parties, total }: BalanceTableProps) {
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

// Who owes the shop, and whom the shop owes, as of now.
export function BalancesReportTab({ onSheets }: { onSheets: (sheets: ExportSheet[] | null) => void }) {
  const { data, error } = useReport(() => api('reports:balances'), 'balances')

  useEffect(() => {
    onSheets(
      data
        ? [
            partySheet(t.reports.customerDebts, data.customers, data.customerTotal),
            partySheet(t.reports.supplierDebts, data.suppliers, data.supplierTotal)
          ]
        : null
    )
  }, [data, onSheets])

  if (error) return <Alert>{error}</Alert>
  if (!data) return <p className="type-body-sm py-10 text-center text-ink-muted">{t.common.loading}</p>

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <BalanceTable
        title={t.reports.customerDebts}
        empty={t.reports.noCustomerDebts}
        parties={data.customers}
        total={data.customerTotal}
      />
      <BalanceTable
        title={t.reports.supplierDebts}
        empty={t.reports.noSupplierDebts}
        parties={data.suppliers}
        total={data.supplierTotal}
      />
    </div>
  )
}
