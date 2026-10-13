import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { useSettingsStore } from '../../store/settings'
import { Header } from './Header'
import { Sidebar } from './Sidebar'

// Frame for every signed-in screen: sidebar at the start edge (the right, in Arabic),
// header on top, and the routed page in the scrolling main area.
export function AppShell() {
  const loadSettings = useSettingsStore((state) => state.load)

  useEffect(() => {
    void loadSettings()
  }, [loadSettings])

  return (
    <div className="flex h-full bg-bg text-ink">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header />
        <main className="flex-1 overflow-y-auto p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
