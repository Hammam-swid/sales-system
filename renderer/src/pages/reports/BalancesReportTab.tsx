import type { ExportSheet } from '../../../../shared/reports'
import { Alert } from '../../components/ui/Alert'
import { useBalancesReportTab } from '../../hooks/reports/useBalancesReportTab'
import { t } from '../../i18n'
import { BalanceTable } from './BalanceTable'

// Who owes the shop, and whom the shop owes, as of now.
export function BalancesReportTab({ onSheets }: { onSheets: (sheets: ExportSheet[] | null) => void }) {
  const { data, error } = useBalancesReportTab(onSheets)

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
