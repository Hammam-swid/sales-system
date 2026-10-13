import { registerAppIpc } from './app.ipc'
import { registerAuthIpc } from './auth.ipc'
import { registerProductsIpc } from './products.ipc'
import { registerSalesIpc } from './sales.ipc'
import { registerSettingsIpc } from './settings.ipc'
import { registerUsersIpc } from './users.ipc'

export function registerIpcHandlers(): void {
  registerAppIpc()
  registerAuthIpc()
  registerUsersIpc()
  registerSettingsIpc()
  registerProductsIpc()
  registerSalesIpc()
}
