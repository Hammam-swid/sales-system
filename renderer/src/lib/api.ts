import type { Api, IpcResult } from '../../../shared/ipc'
import { t } from '../i18n/ar'
import { useAuthStore } from '../store/auth'

// Same signature as window.api.invoke, plus one cross-cutting rule:
// if the main process says the session is gone, drop back to the login screen.
export const api: Api['invoke'] = async (channel, ...args) => {
  const result = await window.api.invoke(channel, ...args)
  if (!result.ok && result.code === 'UNAUTHENTICATED') {
    useAuthStore.getState().clear()
  }
  return result
}

export function errorText(result: Extract<IpcResult<unknown>, { ok: false }>): string {
  return t.errors[result.code] ?? t.errors.INTERNAL
}
