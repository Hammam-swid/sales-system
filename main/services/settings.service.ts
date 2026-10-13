import type { AppSettings } from '../../shared/catalog'
import { getDataSource } from '../database/data-source'
import { Setting } from '../database/entities'

export async function getSettings(): Promise<AppSettings> {
  const rows = await getDataSource().getRepository(Setting).find()
  const values = new Map(rows.map((row) => [row.key, row.value ?? '']))
  const taxRate = Number(values.get('tax_rate'))

  return {
    storeName: values.get('store_name') ?? '',
    currency: values.get('currency') || 'USD',
    taxRate: Number.isFinite(taxRate) ? taxRate : 0,
    language: values.get('language') || 'ar'
  }
}
