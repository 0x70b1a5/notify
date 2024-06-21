import { useEffect } from "react"
import useNotifyStore from "./store/notifyStore"
import KinodeEncryptorApi from '@kinode/client-api'

let inited = false

function App() {
  const { notifications, setApi, handleWsMessage } = useNotifyStore()

  const BASE_URL = import.meta.env.BASE_URL;
  const PROXY_TARGET = `${(import.meta.env.VITE_NODE_URL || "http://localhost:8080")}${BASE_URL}`;
  const WEBSOCKET_URL = import.meta.env.DEV
    ? `${PROXY_TARGET.replace('http', 'ws')}`
    : undefined;

  if ((window as any).our) (window as any).our.process = BASE_URL?.replace("/", "")

  useEffect(() => {
    if (!inited) {
      inited = true

      const api = new KinodeEncryptorApi({
        uri: WEBSOCKET_URL,
        nodeId: (window as any).our.node,
        processId: (window as any).our.process,
        onMessage: handleWsMessage
      });

      setApi(api);
    }
  }, [])

  return (
    <div className='h-screen w-screen flex-col-center gap-2'>
      <h1 className="text-xl font-bold">It's Notify</h1>
      <p>Your notifications place!</p>
      <div className="flex-col-center grow gap-2">
        {Object.entries(notifications).length === 0 && <p>You don't have any notifications yet.</p>}
        {Object.entries(notifications).map(([process, notifications], i) => <div
          key={i}
          className="flex-col-center grow bg-orange/10 rounded p-2 gap-2"
        >
          <p>{process}</p>
          {notifications.map(({ notification }, i) => <div
            key={i}
            className="flex-col-center grow bg-orange/10 rounded p-2 gap-2"
          >
            <p>{notification.title}</p>
            <p>{notification.body}</p>
          </div>)}
        </div>)}
      </div>
    </div>
  )
}

export default App
