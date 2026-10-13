import { exportExcel, exportPdf } from '../services/export.service'
import {
  balancesReport,
  productsReport,
  profitReport,
  salesReport
} from '../services/reports.service'
import { handle } from './handle'

export function registerReportsIpc(): void {
  const permission = 'reports.view'

  handle('reports:sales', { permission }, (payload) => salesReport(payload))
  handle('reports:profit', { permission }, (payload) => profitReport(payload))
  handle('reports:products', { permission }, (payload) => productsReport(payload))
  handle('reports:balances', { permission }, () => balancesReport())

  handle('export:excel', { permission }, (payload) => exportExcel(payload))
  handle('export:pdf', { permission }, (payload) => exportPdf(payload))
}
