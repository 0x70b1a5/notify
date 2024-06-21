import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import KinodeApi from '@kinode/client-api'

const BASE_URL = (import.meta as any).env.BASE_URL; // eslint-disable-line

interface NotificationWithProcess {
  process: string
  notification: {
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
}

export interface NotifyStore {
  get: () => NotifyStore
  set: (partial: NotifyStore | Partial<NotifyStore>) => void
  notifications: Record<string, NotificationWithProcess[]>
  api: KinodeApi | null
  setApi: (api: KinodeApi) => void
  handleWsMessage: (json: string | Blob) => void
}

type WsMessage =
  | { kind: 'history', data: Record<string, NotificationWithProcess[]> }
  | { kind: 'push', data: undefined }

const useNotifyStore = create<NotifyStore>()(
  persist(
    (set, get) => ({
      get,
      set,
      notifications: {},
      api: null,
      setApi: (api) => set({ api }),

      handleWsMessage: (json: string | Blob) => {
        if (typeof json === 'string') {
          try {
            console.log('WS: GOT MESSAGE', json)
            const { kind, data } = JSON.parse(json) as WsMessage;
            if (kind === 'history') {
              set({ notifications: data })
            }
          } catch (error) {
            console.error("Error parsing WebSocket message", error);
          }
        } else {
          console.log('WS: GOT BLOB', json)
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
