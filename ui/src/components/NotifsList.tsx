import { useEffect, useState } from "react";
import useNotifyStore from "../store/notifyStore";
import NotifCard from "./NotifCard";

export default function NotifsList() {
  const { notifications } = useNotifyStore()

  const [notifsCount, setNotifsCount] = useState(0)

  useEffect(() => {
    setNotifsCount(Object.entries(notifications).reduce((acc, [_, notifications]) => acc + notifications.length, 0))
  }, [notifications])

  return <div className="flex-col-center grow gap-2 overflow-y-auto max-h-[90vh]">
    {notifsCount === 0 && <p>You don't have any notifications yet.</p>}
    {Object.entries(notifications)
      .filter(([_, ns]) => ns.length > 0)
      .map(([process, notifications], i) => <div
        key={i}
        className="flex-col-center grow bg-orange/10 rounded p-2 gap-2"
      >
        <p>{process}</p>
        {notifications.map((notification, i) => <NotifCard key={i} notification={notification} />)}
      </div>)}
  </div>
}