import { FaX } from "react-icons/fa6";
import useNotifyStore, { Notification } from "../store/notifyStore";

export default function NotifCard({ notification, i }: { notification: Notification, i?: number }) {
  const { clearNotification } = useNotifyStore()
  return <div
    key={i}
    className="flex flex-col self-stretch bg-orange/10 rounded p-2 gap-2 relative"
  >
    <p className="font-bold">{notification.title}</p>
    <p>{notification.body}</p>
    <button
      onClick={() => clearNotification(notification.id!)}
      className="icon clear absolute -top-2 -right-2"
    >
      <FaX />
    </button>
  </div>
}