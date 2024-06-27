import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import KinodeApi from '@kinode/client-api'

const BASE_URL = (import.meta as any).env.BASE_URL; // eslint-disable-line

interface Notification {
  to: string[]
  data?: string
  title?: string
  body?: string
  ttl?: number
  expiration?: number
  priority?: 'high' | 'low'
  subtitle?: string
  sound?: string
  badge?: number
  channelId?: string
  categoryId?: string
  mutableContent?: boolean
}

interface ProcessNotifConfig {
  allow: boolean,
}

export const DEFAULT_SETTINGS: ProcessNotifConfig = {
  allow: true
}

type Settings = Record<string, ProcessNotifConfig>
type TabName = 'home' | 'settings'

export interface NotifyStore {
  get: () => NotifyStore
  set: (partial: NotifyStore | Partial<NotifyStore>) => void
  notifications: Record<string, Notification[]>
  setNotifications: (notifications: Record<string, Notification[]>) => void
  pushNotification: (notification: Notification) => void
  api: KinodeApi | null
  setApi: (api: KinodeApi) => void
  handleWsMessage: (json: string | Blob) => void
  settings: Settings
  setSettings: (settings: Settings) => void
  saveSettings: (process: string, settings: ProcessNotifConfig) => void
  tabs: TabName[]
  activeTab: TabName
  setActiveTab: (tab: TabName) => void
  infoMessage: string
  setInfoMessage: (message: string) => void
  setInfoMessageWithTimeout: (message: string, timeout: number) => void
}

export interface NotifyState {
  archive: Record<string, Notification[]>
  config: Settings
}

type WsMessage =
  | { kind: 'history', data: Record<string, Notification[]> }
  | { kind: 'push', data: undefined }
  | { kind: 'state', data: NotifyState }
  | { kind: 'settings-updated', data: Settings }

const useNotifyStore = create<NotifyStore>()(
  persist(
    (set, get) => ({
      get,
      set,
      setNotifications: (notifications) => set({ notifications }),
      notifications: {},
      api: null,
      setApi: (api) => set({ api }),
      settings: {},
      setSettings: (settings) => set({ settings }),
      tabs: ['home', 'settings'],
      activeTab: 'home',
      setActiveTab: (tab) => set({ activeTab: tab }),

      infoMessage: '',
      setInfoMessage: (message: string) => set({ infoMessage: message }),
      setInfoMessageWithTimeout: (message: string, timeout: number) => {
        set({ infoMessage: message })
        setTimeout(() => {
          set({ infoMessage: '' })
        }, timeout)
      },

      handleWsMessage: (json: string | Blob) => {
        if (typeof json === 'string') {
          try {
            console.log('WS: GOT MESSAGE', json)
            const { kind, data } = JSON.parse(json) as WsMessage;
            if (kind === 'state') {
              set({
                notifications: data.archive,
                settings: data.config,
              })
            } else if (kind === 'settings-updated') {
              set({
                settings: data,
              })
              get().setInfoMessageWithTimeout('Settings updated', 2000)
            }
          } catch (error) {
            console.error("Error parsing WebSocket message", error);
          }
        } else {
          console.log('WS: GOT BLOB', json)
        }
      },

      pushNotification: async (notification: Notification) => {
        const { api } = get()
        if (api) {
          api.send({
            data: {
              Push: notification
            }
          })
        }
      },

      saveSettings: (process: string, settings: ProcessNotifConfig) => {
        const { api } = get()
        if (api) {
          api.send({
            data: {
              UpdateSettings: {
                process,
                settings
              }
            }
          })
        }
      }

    }),
    {
      name: 'notify_store', // unique name
      storage: createJSONStorage(() => sessionStorage), // (optional) by default, 'localStorage' is used
    }
  )
)

export default useNotifyStore
