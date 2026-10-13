import { ipcMain } from 'electron'
import type { IpcChannel, IpcChannels, IpcResult } from '../../shared/ipc'
import { can, type Permission } from '../../shared/permissions'
import { getSession, type SessionUser } from '../auth/session'
import { AppError } from '../errors'

type Response<C extends IpcChannel> = IpcChannels[C]['response']

interface PublicOptions {
  public: true
}

interface ProtectedOptions {
  public?: false
  // Omit to allow any signed-in user.
  permission?: Permission
}

// Registers a typed handler. Channels require a signed-in user unless marked public,
// and thrown errors become an IpcResult so the renderer never parses Electron's wrapped messages.
export function handle<C extends IpcChannel>(
  channel: C,
  options: PublicOptions,
  handler: (payload: unknown) => Promise<Response<C>>
): void
export function handle<C extends IpcChannel>(
  channel: C,
  options: ProtectedOptions,
  handler: (payload: unknown, user: SessionUser) => Promise<Response<C>>
): void
export function handle<C extends IpcChannel>(
  channel: C,
  options: PublicOptions | ProtectedOptions,
  handler: (payload: unknown, user: SessionUser) => Promise<Response<C>>
): void {
  ipcMain.handle(channel, async (_event, payload: unknown): Promise<IpcResult<Response<C>>> => {
    try {
      const session = getSession()
      if (!options.public) {
        if (!session) throw new AppError('UNAUTHENTICATED')
        if (options.permission && !can(session.role, options.permission)) {
          throw new AppError('FORBIDDEN')
        }
      }
      // Public handlers ignore the second argument.
      return { ok: true, data: await handler(payload, session as SessionUser) }
    } catch (error) {
      if (error instanceof AppError) {
        return { ok: false, code: error.code, error: error.message }
      }
      console.error(`[ipc] ${channel} failed:`, error)
      return { ok: false, code: 'INTERNAL', error: 'Internal error' }
    }
  })
}
