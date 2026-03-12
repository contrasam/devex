'use client'

import { useState, useEffect } from 'react'
import type { AppRole } from '@/types'

const STORAGE_KEY = 'devex_role'

export function useRole() {
  const [role, setRoleState] = useState<AppRole | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as AppRole | null
    setRoleState(stored)
    setReady(true)
  }, [])

  function setRole(r: AppRole) {
    localStorage.setItem(STORAGE_KEY, r)
    setRoleState(r)
  }

  function clearRole() {
    localStorage.removeItem(STORAGE_KEY)
    setRoleState(null)
  }

  return { role, ready, setRole, clearRole, isManager: role === 'manager' }
}
