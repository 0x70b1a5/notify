import useNotifyStore from "../store/notifyStore"

import classNames from 'classnames'

export default function TabBar() {
  const { tabs, activeTab, setActiveTab } = useNotifyStore()
  return <div className="flex-center self-stretch">
    {tabs.map((tab) => (
      <button
        key={tab}
        onClick={() => setActiveTab(tab)}
        className={classNames(
          'flex-center grow self-stretch clear !rounded-0 !border-2 !border-b',
          { ' !border-b-orange': tab === activeTab }
        )}
      >
        {tab}
      </button>
    ))}
  </div>
}