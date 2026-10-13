import type { Api, ErrorCode, IpcResult } from '../../../shared/ipc'
import { t } from '../i18n'
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

// For these codes the main process sends the product name as the error detail.
const CODES_WITH_SUBJECT: readonly ErrorCode[] = [
  'INSUFFICIENT_STOCK',
  'PRODUCT_UNAVAILABLE',
  'RETURN_EXCEEDS'
]

export function errorText(result: Extract<IpcResult<unknown>, { ok: false }>): string {
  const message = t.errors[result.code] ?? t.errors.INTERNAL
  const hasSubject = CODES_WITH_SUBJECT.includes(result.code) && result.error !== result.code
  return hasSubject ? `${result.error}: ${message}` : message
}
