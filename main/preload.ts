import { contextBridge, ipcRenderer } from 'electron'
import { IPC_CHANNELS, type Api, type IpcChannel } from '../shared/ipc'

const api: Api = {
  invoke(channel: IpcChannel, ...args: unknown[]) {
    if (!IPC_CHANNELS.includes(channel)) {
      return Promise.reject(new Error(`IPC channel not allowed: ${String(channel)}`))
    }
    return ipcRenderer.invoke(channel, ...args)
  }
}

contextBridge.exposeInMainWorld('api', api)
