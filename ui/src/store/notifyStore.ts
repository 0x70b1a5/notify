import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

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
  notifications: NotificationWithProcess[]
  fetchNotifications: () => Promise<void>
}

const useNotifyStore = create<NotifyStore>()(
  persist(
    (set, get) => ({
      get,
      set,
      notifications: [],

      fetchNotifications: async () => {
        const res = await fetch(`${BASE_URL}/notifs`)
        const notifications = await res.json()
        set(() => ({ notifications }))
      }
    }),
    {
      name: 'notify_store', // unique name
      storage: createJSONStorage(() => sessionStorage), // (optional) by default, 'localStorage' is used
    }
  )
)

export default useNotifyStore
