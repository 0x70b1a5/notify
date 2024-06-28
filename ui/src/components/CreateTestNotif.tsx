import { useState } from "react"
import useNotifyStore from "../store/notifyStore"

export default function CreateTestNotif() {
  const { pushNotification } = useNotifyStore()

  const [nTitle, setNTitle] = useState("")
  const [nBody, setNBody] = useState("")

  const handleSubmit = () => {
    if (nTitle === "" || nBody === "") {
      return
    }
    pushNotification({
      to: ['Test'],
      title: nTitle,
      body: nBody,
    })
    setNTitle("")
    setNBody("")
  }

  return (
    <div className="flex-col-center gap-2 absolute right-2 bottom-2 bg-white/10 rounded-md p-2">
      <h2 className="font-bold">Create Test Notification</h2>
      <input
        type="text"
        onChange={(e) => setNTitle(e.target.value || '')}
        value={nTitle || ''}
        placeholder="Title"
      />
      <input
        type="text"
        onChange={(e) => setNBody(e.target.value || '')}
        value={nBody || ''}
        placeholder="Body"
      />
      <button
        onClick={handleSubmit}
      >
        Submit
      </button>
    </div>
  )
}