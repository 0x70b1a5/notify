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
  settings: Record<string, ProcessNotifConfig>
  setSettings: (settings: Record<string, ProcessNotifConfig>) => void
  tabs: TabName[]
  activeTab: TabName
  setActiveTab: (tab: TabName) => void
}

export interface NotifyState {
  archive: Record<string, Notification[]>
  config: Record<string, ProcessNotifConfig>
}

type WsMessage =
  | { kind: 'history', data: Record<string, Notification[]> }
  | { kind: 'push', data: undefined }
  | { kind: 'state', data: NotifyState }

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

    }),
    {
      name: 'notify_store', // unique name
      storage: createJSONStorage(() => sessionStorage), // (optional) by default, 'localStorage' is used
    }
  )
)

export default useNotifyStore
