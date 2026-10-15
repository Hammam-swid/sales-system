import { useEffect, useRef, useState } from 'react'
import type { IpcResult } from '../../../../shared/ipc'
import { errorText } from '../../lib/api'

// Loads a report whenever its inputs change, ignoring responses that arrive out of order.
// `key` must change exactly when `load` would return different data.
export function useReport<T>(
  load: () => Promise<IpcResult<T>>,
  key: string
): { data: T | null; error: string | null } {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  const requestId = useRef(0)
  const loadRef = useRef(load)
  loadRef.current = load

  useEffect(() => {
    const current = ++requestId.current
    void loadRef.current().then((result) => {
      if (current !== requestId.current) return
      if (result.ok) {
        setData(result.data)
        setError(null)
      } else {
        setData(null)
        setError(errorText(result))
      }
    })
  }, [key])

  return { data, error }
}
