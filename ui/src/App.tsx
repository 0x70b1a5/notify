import { useEffect, useState } from "react"
import useNotifyStore from "./store/notifyStore"
import KinodeEncryptorApi from '@kinode/client-api'
import TabBar from "./components/TabBar"
import Home from "./components/Home"
import Settings from "./components/Settings"

let inited = false

function App() {
  const { notifications, setApi, handleWsMessage, activeTab } = useNotifyStore()

  const [connected, setConnected] = useState(false)

  const BASE_URL = import.meta.env.BASE_URL;
  const PROXY_TARGET = `${(import.meta.env.VITE_NODE_URL || "http://localhost:8080")}${BASE_URL}`;
  const WEBSOCKET_URL = import.meta.env.DEV
    ? `${PROXY_TARGET.replace('http', 'ws')}`
    : undefined;


  useEffect(() => {
    if (!inited && (window as any).our) {
      inited = true
      console.log((window as any).our)

      const newApi = new KinodeEncryptorApi({
        uri: WEBSOCKET_URL,
        nodeId: (window as any).our?.node,
        processId: 'notify:notify:gloria-in-excelsis-deo.os',
        onMessage: handleWsMessage,
      });

      setApi(newApi);
    }
  }, [connected])

  useEffect(() => {
    const ourChecker = setInterval(() => {
      if ((window as any).our) {
        fetch('/our').then(() => {
          setConnected(true)
          clearInterval(ourChecker)
        }).catch(() => { })
      }
    }, 1000)
  }, [])

  console.log({ notifications })

  return (
    <div className='h-screen w-screen flex-col-center gap-2 relative'>
      <TabBar />
      {activeTab === 'home' && <Home />}
      {activeTab === 'settings' && <Settings />}
      {!connected && <p className="absolute bottom-2 bg-black rounded p-2">Connecting to the node...</p>}
    </div>
  )
}

export default App
