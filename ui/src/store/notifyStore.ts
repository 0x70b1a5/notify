import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import KinodeApi from '@kinode/client-api'

const BASE_URL = (import.meta as any).env.BASE_URL; // eslint-disable-line

export interface Notification {
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
  id?: string
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
  clearNotification: (id: string) => void
  pushTokens: string[]
  setPushTokens: (tokens: string[]) => void
  removePushToken: (token: string) => void
}

export interface NotifyState {
  archive: Record<string, Notification[]>
  config: Settings
  push_tokens: string[],
}

type WsMessage =
  | { kind: 'history', data: Record<string, Notification[]> }
  | { kind: 'push', data: undefined }
  | { kind: 'state', data: NotifyState }
  | { kind: 'settings-updated', data: Settings }
  | { kind: 'delete', data: string }
  | { kind: 'error', data: string }

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

      pushTokens: [],
      setPushTokens: (tokens: string[]) => set({ pushTokens: tokens }),

      handleWsMessage: (json: string | Blob) => {
        if (typeof json === 'string') {
          try {
            console.log('WS: GOT MESSAGE', json)
            const { kind, data } = JSON.parse(json) as WsMessage;
            const { setInfoMessageWithTimeout, notifications } = get()
            if (kind === 'state') {
              set({
                notifications: data.archive,
                settings: data.config,
                pushTokens: data.push_tokens,
              })
            } else if (kind === 'settings-updated') {
              set({
                settings: data,
              })
              setInfoMessageWithTimeout('Settings updated', 2000)
            } else if (kind === 'delete') {
              const newNotifications = { ...notifications }
              for (const process in newNotifications) {
                newNotifications[process] = newNotifications[process].filter((notification) => notification.id !== data)
              }
              set({
                notifications: newNotifications
              })
              setInfoMessageWithTimeout('Notification cleared', 2000)
            } else if (kind === 'error') {
              setInfoMessageWithTimeout(data, 2000);
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
      },

      removePushToken: (token: string) => {
        const { api } = get()
        if (api) {
          api.send({
            data: {
              DeleteToken: token
            }
          })
        }
      },

      clearNotification: (id: string) => {
        const { api } = get()
        if (api) {
          api.send({
            data: {
              Delete: id
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
