import useNotifyStore from "../store/notifyStore"

export default function Settings() {
  const { settings, setSettings } = useNotifyStore()
  return <div className="bg-black rounded-md flex-col-center gap-2">
    <h1 className="font-bold">Settings</h1>
    <div className="flex-col-center gap-2">
      {Object.entries(settings).map(([process, config]) => (
        <div key={process} className="flex-center gap-2">
          <h2>{process}</h2>
          {Object.entries(config).map(([settingName, settingValue]) => (
            <div key={settingName} className="flex-center gap-2">
              <h3>{settingName}</h3>
              <input
                type="checkbox"
                checked={settingValue}
                onChange={(e) => setSettings({
                  ...settings,
                  [process]: {
                    ...config,
                    [settingName]: { ...settingValue, allow: e.target.checked }
                  }
                })}
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  </div>
}