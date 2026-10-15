import { PRODUCT_UNITS, type ProductUnit } from '../../../shared/catalog'
import { t } from '../i18n'

export function unitLabel(unit: string): string {
  return t.units[unit as ProductUnit] ?? unit
}

export function isKnownUnit(unit: string): unit is ProductUnit {
  return (PRODUCT_UNITS as readonly string[]).includes(unit)
}
