import CreateTestNotif from "./CreateTestNotif"
import NotifsList from "./NotifsList";

export default function Home() {
  return <div className="flex-col-center grow self-stretch">
    <h1 className="font-bold">It's Notify</h1>
    <p>Your notifications place!</p>
    <NotifsList />
    <CreateTestNotif />
  </div>
}