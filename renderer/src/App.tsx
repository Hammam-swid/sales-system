import { useEffect, useState } from 'react'
import type { AppInfo } from '../../shared/ipc'

// Placeholder screen for phases 1–2: proves the window, the IPC bridge and the database all work.
export default function App() {
  const [info, setInfo] = useState<AppInfo | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    window.api
      .invoke('app:info')
      .then((result) => (result.ok ? setInfo(result.data) : setError(result.error)))
      .catch((err: unknown) => setError(String(err)))
  }, [])

  return (
    <main className="min-h-full bg-slate-50 p-8 text-slate-800">
      <div className="mx-auto max-w-3xl space-y-6">
        <header>
          <h1 className="text-2xl font-bold">نظام المبيعات</h1>
          <p className="text-sm text-slate-500">
            {info ? `الإصدار ${info.appVersion}` : 'جاري التحميل…'}
          </p>
        </header>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            تعذر الاتصال بقاعدة البيانات: <span dir="ltr">{error}</span>
          </div>
        )}

        {info && (
          <>
            <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="mb-2 font-semibold">قاعدة البيانات</h2>
              <dl className="space-y-1 text-sm">
                <div className="flex gap-2">
                  <dt className="text-slate-500">المسار:</dt>
                  <dd dir="ltr" className="break-all font-mono text-xs">
                    {info.dbPath}
                  </dd>
                </div>
                <div className="flex gap-2">
                  <dt className="text-slate-500">الترحيلات المنفذة:</dt>
                  <dd dir="ltr" className="font-mono text-xs">
                    {info.migrations.join(', ') || '—'}
                  </dd>
                </div>
              </dl>
            </section>

            <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-200 bg-slate-100 text-slate-600">
                  <tr>
                    <th className="px-4 py-2 text-start font-medium">الجدول</th>
                    <th className="px-4 py-2 text-end font-medium">عدد السجلات</th>
                  </tr>
                </thead>
                <tbody>
                  {info.tables.map((table) => (
                    <tr key={table.name} className="border-b border-slate-100 last:border-0">
                      <td dir="ltr" className="px-4 py-2 text-end font-mono text-xs">
                        {table.name}
                      </td>
                      <td className="px-4 py-2 text-end tabular-nums">{table.rows}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          </>
        )}
      </div>
    </main>
  )
}
