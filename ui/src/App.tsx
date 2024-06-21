import { useEffect } from "react"
import useNotifyStore from "./store/notifyStore"

function App() {
  const { notifications, fetchNotifications } = useNotifyStore()

  useEffect(() => {
    fetchNotifications()
  }, [])

  return (
    <div className='h-screen w-screen flex-col-center gap-2'>
      <h1 className="text-xl font-bold">It's Notify</h1>
      <p>Your notifications place!</p>
      <div className="flex-col-center grow gap-2">
        {notifications.map(({ process, notification }, i) => <div
          key={i}
          className="flex-col-center grow bg-orange/10 rounded p-2 gap-2"
        >
          <p>{process}</p>
          <p>{notification.title}</p>
          <p>{notification.body}</p>
        </div>)}
      </div>
    </div>
  )
}

export default App
