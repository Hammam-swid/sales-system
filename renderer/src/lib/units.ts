import type { ProductUnit } from '../../../shared/catalog'
import { t } from '../i18n'

export function unitLabel(unit: string): string {
  return t.units[unit as ProductUnit] ?? unit
}
