import { ipcMain } from 'electron'
import type { IpcChannel, IpcChannels, IpcResult } from '../../shared/ipc'
import { registerAppIpc } from './app.ipc'

type Handler<C extends IpcChannel> = (
  payload: IpcChannels[C]['request']
) => Promise<IpcChannels[C]['response']> | IpcChannels[C]['response']

// Registers a typed handler and converts thrown errors into an IpcResult,
// so the renderer never has to parse Electron's wrapped error messages.
export function handle<C extends IpcChannel>(channel: C, handler: Handler<C>): void {
  ipcMain.handle(channel, async (_event, payload): Promise<IpcResult<IpcChannels[C]['response']>> => {
    try {
      return { ok: true, data: await handler(payload) }
    } catch (error) {
      console.error(`[ipc] ${channel} failed:`, error)
      return { ok: false, error: error instanceof Error ? error.message : String(error) }
    }
  })
}

export function registerIpcHandlers(): void {
  registerAppIpc()
}
