import { useRef, useState } from 'react'

export function useSaving() {
  const [saving, setSaving] = useState(false)
  const inFlight = useRef(false)

  async function run<T>(fn: () => Promise<T>): Promise<T | undefined> {
    if (inFlight.current) return
    inFlight.current = true
    setSaving(true)
    try {
      return await fn()
    } finally {
      inFlight.current = false
      setSaving(false)
    }
  }

  return { saving, run }
}
