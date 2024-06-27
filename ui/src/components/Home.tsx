import useNotifyStore from "../store/notifyStore"
import CreateTestNotif from "./CreateTestNotif"

export default function Home() {
  const { notifications } = useNotifyStore();

  return <div className="flex-col-center grow self-stretch">
    <h1 className="font-bold">It's Notify</h1>
    <p>Your notifications place!</p>
    <div className="flex-col-center grow gap-2 overflow-y-auto max-h-[90vh]">
      {Object.entries(notifications).length === 0 && <p>You don't have any notifications yet.</p>}
      {Object.entries(notifications).map(([process, notifications], i) => <div
        key={i}
        className="flex-col-center grow bg-orange/10 rounded p-2 gap-2"
      >
        <p>{process}</p>
        {notifications.map((notification, i) => <div
          key={i}
          className="flex flex-col grow bg-orange/10 rounded p-2 gap-2"
        >
          <p className="font-bold">{notification.title}</p>
          <p>{notification.body}</p>
        </div>)}
      </div>)}
      <CreateTestNotif />
    </div>
  </div>
}