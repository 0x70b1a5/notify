import { useEffect, useState } from "react"
import useNotifyStore, { DEFAULT_SETTINGS } from "../store/notifyStore"
import { FaCheck, FaX } from "react-icons/fa6"

export default function Settings() {
  const { notifications, settings, setSettings, saveSettings, } = useNotifyStore()

  const [availableProcesses, setAvailableProcesses] = useState<string[]>([])

  useEffect(() => {
    setAvailableProcesses([...Object.keys(notifications), ...Object.keys(settings)].filter((process, i, a) => a.indexOf(process) === i))
  }, [notifications, settings])

  const updateSetting = (process: string, settingName: string, settingValue: any) => {
    const newSettings = { ...settings, [process]: { ...settings[process], [settingName]: settingValue } }
    setSettings(newSettings)
    saveSettings(process, newSettings[process])
  }

  return <div className="flex-col-center gap-2 grow self-stretch">
    <h1 className="font-bold">Settings</h1>
    <div className="flex-col-center gap-2">
      {availableProcesses.map((process) => (
        <div key={process} className="flex gap-8 bg-white/10 p-2 rounded-md">
          <h2>{process}</h2>
          {Object.entries(settings[process] || DEFAULT_SETTINGS).map(([settingName, settingValue]) => (
            <div key={settingName} className="flex-center gap-2">
              <h3 className="align-self-start">{settingName}</h3>
              {typeof settingValue === 'boolean' && <div className="flex-center">
                <button
                  className="icon clear"
                  onClick={() => {
                    updateSetting(process, settingName, !settingValue)
                  }}
                >
                  {settingValue && <FaCheck />}
                  {!settingValue && <FaX />}
                </button>
              </div>}
              {typeof settingValue === 'number' && <input
                type="number"
                value={settingValue}
                onChange={(e) => {
                  updateSetting(process, settingName, e.target.value)
                }}
              />}
              {typeof settingValue === 'string' && <input
                type="text"
                value={settingValue}
                onChange={(e) => {
                  updateSetting(process, settingName, e.target.value)
                }}
              />}
            </div>
          ))}
        </div>
      ))}
    </div>
  </div>
}