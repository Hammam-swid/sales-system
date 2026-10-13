import {
  checkout,
  discardHeldSale,
  getSale,
  holdSale,
  listHeldSales,
  listSales,
  resumeHeldSale,
  returnSale
} from '../services/sales.service'
import { handle } from './handle'

export function registerSalesIpc(): void {
  handle('sales:checkout', { permission: 'pos.sell' }, (payload, user) => checkout(payload, user))
  handle('sales:hold', { permission: 'pos.sell' }, (payload, user) => holdSale(payload, user))
  handle('sales:held', { permission: 'pos.sell' }, (_payload, user) => listHeldSales(user))
  handle('sales:resumeHeld', { permission: 'pos.sell' }, (payload, user) =>
    resumeHeldSale(payload, user)
  )
  handle('sales:discardHeld', { permission: 'pos.sell' }, (payload, user) =>
    discardHeldSale(payload, user)
  )

  handle('sales:list', { permission: 'sales.view' }, (payload, user) => listSales(payload, user))
  handle('sales:get', { permission: 'sales.view' }, (payload, user) => getSale(payload, user))
  handle('sales:return', { permission: 'sales.return' }, (payload, user) =>
    returnSale(payload, user)
  )
}
