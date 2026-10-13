import { getSettings } from '../services/settings.service'
import { handle } from './handle'

export function registerSettingsIpc(): void {
  // Any signed-in user needs the currency and tax rate to display prices.
  handle('settings:get', {}, () => getSettings())
}
