import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useSettingsStore } from '../../store/settings'
import { ErrorBoundary } from '../ErrorBoundary'
import { PrintHost } from '../PrintHost'
import { Header } from './Header'
import { Sidebar } from './Sidebar'

// Frame for every signed-in screen: sidebar at the start edge (the right, in Arabic),
// header on top, and the routed page in the scrolling main area.
export function AppShell() {
  const loadSettings = useSettingsStore((state) => state.load)
  const { pathname } = useLocation()

  useEffect(() => {
    void loadSettings()
  }, [loadSettings])

  return (
    // app-shell / app-main / no-print are hooks for the print stylesheet.
    <div className="app-shell flex h-full bg-bg text-ink">
      <div className="no-print flex shrink-0">
        <Sidebar />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="no-print">
          <Header />
        </div>
        <main className="app-main flex-1 overflow-y-auto p-8">
          {/* Keyed by route, so moving to another section clears a failed screen. */}
          <ErrorBoundary key={pathname}>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
      <PrintHost />
    </div>
  )
}
