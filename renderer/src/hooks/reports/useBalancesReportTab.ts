import { useEffect } from 'react'
import type { PartyDto } from '../../../../shared/parties'
import type { ExportSheet } from '../../../../shared/reports'
import { t } from '../../i18n'
import { api } from '../../lib/api'
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

// Who owes the shop, and whom the shop owes, as of now.
export function useBalancesReportTab(onSheets: (sheets: ExportSheet[] | null) => void) {
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

  return { data, error }
}
