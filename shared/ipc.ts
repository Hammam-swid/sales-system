// Contract between the renderer and the main process.
// Every IPC channel is declared here once, with its request and response types.

export interface TableInfo {
  name: string
  rows: number
}

export interface AppInfo {
  appVersion: string
  dbPath: string
  migrations: string[]
  tables: TableInfo[]
}

export interface IpcChannels {
  'app:info': { request: void; response: AppInfo }
}

export type IpcChannel = keyof IpcChannels

// Runtime allowlist used by the preload script.
export const IPC_CHANNELS: readonly IpcChannel[] = ['app:info']

export type IpcResult<T> = { ok: true; data: T } | { ok: false; error: string }

type IpcArgs<C extends IpcChannel> = IpcChannels[C]['request'] extends void
  ? []
  : [payload: IpcChannels[C]['request']]

export interface Api {
  invoke<C extends IpcChannel>(
    channel: C,
    ...args: IpcArgs<C>
  ): Promise<IpcResult<IpcChannels[C]['response']>>
}
