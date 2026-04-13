import { useState, useCallback, useMemo, useEffect, useRef } from 'react'

// --- localStorage helpers ---

function editStateKey(orgId) {
  return `lions-edit-state-${orgId}`
}

function loadEditState(orgId) {
  try {
    const raw = localStorage.getItem(editStateKey(orgId))
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function saveEditState(orgId, state) {
  try {
    localStorage.setItem(editStateKey(orgId), JSON.stringify(state))
  } catch {
    // ignore storage errors
  }
}

function clearEditState(orgId) {
  try {
    localStorage.removeItem(editStateKey(orgId))
  } catch {
    // ignore storage errors
  }
}

/**
 * Manages all edit-mode state for the customer table:
 * - dirtyMap (contact field changes)
 * - validationErrors
 * - pendingPersonEdits / pendingPersonAdds / pendingPersonDeletes
 * - localStorage persistence (auto-save on change, auto-load on mount)
 *
 * @param {string} orgId — used to namespace the localStorage key
 */
export function useEditState(orgId) {
  // dirtyMap: { [contactId]: { [columnId]: newValue } }
  const [dirtyMap, setDirtyMap] = useState(
    () => loadEditState(orgId)?.dirtyMap ?? {}
  )

  // validationErrors: { [contactId]: { [columnId]: errorString } }
  const [validationErrors, setValidationErrors] = useState({})

  // { [contactId]: { [personId]: { [field]: newValue } } }
  const [pendingPersonEdits, setPendingPersonEdits] = useState(
    () => loadEditState(orgId)?.pendingPersonEdits ?? {}
  )
  // { [contactId]: Array<{ _tempId, first_name, last_name, email, phone, mobile }> }
  const [pendingPersonAdds, setPendingPersonAdds] = useState(
    () => loadEditState(orgId)?.pendingPersonAdds ?? {}
  )
  // { [contactId]: personId[] }
  const [pendingPersonDeletes, setPendingPersonDeletes] = useState(
    () => loadEditState(orgId)?.pendingPersonDeletes ?? {}
  )

  // Persist edit state to localStorage whenever it changes.
  // Skip the initial render to avoid a redundant write on load.
  const isFirstRender = useRef(true)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    const isEmpty =
      Object.keys(dirtyMap).length === 0 &&
      Object.keys(pendingPersonEdits).length === 0 &&
      Object.keys(pendingPersonAdds).length === 0 &&
      Object.keys(pendingPersonDeletes).length === 0
    if (isEmpty) {
      clearEditState(orgId)
    } else {
      saveEditState(orgId, {
        dirtyMap,
        pendingPersonEdits,
        pendingPersonAdds,
        pendingPersonDeletes,
      })
    }
  }, [
    orgId,
    dirtyMap,
    pendingPersonEdits,
    pendingPersonAdds,
    pendingPersonDeletes,
  ])

  // --- dirtyMap helpers ---

  const markDirty = useCallback((contactId, columnId, value) => {
    setDirtyMap((prev) => ({
      ...prev,
      [contactId]: { ...(prev[contactId] ?? {}), [columnId]: value },
    }))
  }, [])

  const clearDirty = useCallback((contactId, columnId) => {
    setDirtyMap((prev) => {
      const contactFields = { ...(prev[contactId] ?? {}) }
      delete contactFields[columnId]
      const next = { ...prev }
      if (Object.keys(contactFields).length === 0) {
        delete next[contactId]
      } else {
        next[contactId] = contactFields
      }
      return next
    })
  }, [])

  const clearRowDirty = useCallback((contactId) => {
    setDirtyMap((prev) => {
      const next = { ...prev }
      delete next[contactId]
      return next
    })
    setValidationErrors((prev) => {
      const next = { ...prev }
      delete next[contactId]
      return next
    })
  }, [])

  const clearColumnDirty = useCallback((columnId) => {
    setDirtyMap((prev) => {
      const next = {}
      for (const [cId, fields] of Object.entries(prev)) {
        const remaining = { ...fields }
        delete remaining[columnId]
        if (Object.keys(remaining).length > 0) next[cId] = remaining
      }
      return next
    })
    setValidationErrors((prev) => {
      const next = {}
      for (const [cId, fields] of Object.entries(prev)) {
        const remaining = { ...fields }
        delete remaining[columnId]
        if (Object.keys(remaining).length > 0) next[cId] = remaining
      }
      return next
    })
  }, [])

  const isDirty = useCallback(
    (contactId, columnId) => dirtyMap[contactId]?.[columnId] !== undefined,
    [dirtyMap]
  )

  const isRowDirty = useCallback(
    (contactId) => Object.keys(dirtyMap[contactId] ?? {}).length > 0,
    [dirtyMap]
  )

  const isColumnDirty = useCallback(
    (columnId) => Object.values(dirtyMap).some((fields) => columnId in fields),
    [dirtyMap]
  )

  const getDirtyValue = useCallback(
    (contactId, columnId) => dirtyMap[contactId]?.[columnId],
    [dirtyMap]
  )

  const dirtyCount = useMemo(
    () =>
      Object.values(dirtyMap).reduce(
        (acc, fields) => acc + Object.keys(fields).length,
        0
      ),
    [dirtyMap]
  )

  // --- validationErrors helpers ---

  const setValidationError = useCallback((contactId, columnId, error) => {
    setValidationErrors((prev) => ({
      ...prev,
      [contactId]: { ...(prev[contactId] ?? {}), [columnId]: error },
    }))
  }, [])

  const clearValidationError = useCallback((contactId, columnId) => {
    setValidationErrors((prev) => {
      const contactFields = { ...(prev[contactId] ?? {}) }
      delete contactFields[columnId]
      const next = { ...prev }
      if (Object.keys(contactFields).length === 0) {
        delete next[contactId]
      } else {
        next[contactId] = contactFields
      }
      return next
    })
  }, [])

  const hasValidationErrors = useMemo(
    () =>
      Object.values(validationErrors).some(
        (fields) => Object.keys(fields).length > 0
      ),
    [validationErrors]
  )

  // --- person mutation helpers ---

  const markPersonField = useCallback((contactId, personId, field, value) => {
    setPendingPersonEdits((prev) => ({
      ...prev,
      [contactId]: {
        ...(prev[contactId] ?? {}),
        [personId]: { ...(prev[contactId]?.[personId] ?? {}), [field]: value },
      },
    }))
  }, [])

  const clearPersonField = useCallback((contactId, personId, field) => {
    setPendingPersonEdits((prev) => {
      const persons = { ...(prev[contactId] ?? {}) }
      const fields = { ...(persons[personId] ?? {}) }
      delete fields[field]
      if (Object.keys(fields).length === 0) delete persons[personId]
      else persons[personId] = fields
      const next = { ...prev }
      if (Object.keys(persons).length === 0) delete next[contactId]
      else next[contactId] = persons
      return next
    })
  }, [])

  const revertPersonRow = useCallback((contactId, personId) => {
    setPendingPersonEdits((prev) => {
      const persons = { ...(prev[contactId] ?? {}) }
      delete persons[personId]
      const next = { ...prev }
      if (Object.keys(persons).length === 0) delete next[contactId]
      else next[contactId] = persons
      return next
    })
  }, [])

  const addPendingPerson = useCallback((contactId, draft) => {
    setPendingPersonAdds((prev) => ({
      ...prev,
      [contactId]: [
        ...(prev[contactId] ?? []),
        { ...draft, _tempId: crypto.randomUUID() },
      ],
    }))
  }, [])

  const cancelPendingAdd = useCallback((contactId, tempId) => {
    setPendingPersonAdds((prev) => {
      const next = { ...prev }
      next[contactId] = (next[contactId] ?? []).filter(
        (d) => d._tempId !== tempId
      )
      if (next[contactId].length === 0) delete next[contactId]
      return next
    })
  }, [])

  const markPersonDelete = useCallback((contactId, personId) => {
    setPendingPersonDeletes((prev) => ({
      ...prev,
      [contactId]: [...new Set([...(prev[contactId] ?? []), personId])],
    }))
  }, [])

  const unmarkPersonDelete = useCallback((contactId, personId) => {
    setPendingPersonDeletes((prev) => {
      const next = { ...prev }
      next[contactId] = (next[contactId] ?? []).filter((id) => id !== personId)
      if (next[contactId].length === 0) delete next[contactId]
      return next
    })
  }, [])

  const personOpCount = useMemo(() => {
    const edits = Object.values(pendingPersonEdits)
      .flatMap(Object.values)
      .reduce((s, f) => s + Object.keys(f).length, 0)
    const adds = Object.values(pendingPersonAdds).reduce(
      (s, a) => s + a.length,
      0
    )
    const dels = Object.values(pendingPersonDeletes).reduce(
      (s, d) => s + d.length,
      0
    )
    return edits + adds + dels
  }, [pendingPersonEdits, pendingPersonAdds, pendingPersonDeletes])

  /** Clear everything and remove from localStorage (discard all pending edits). */
  const clearAll = useCallback(() => {
    setDirtyMap({})
    setValidationErrors({})
    setPendingPersonEdits({})
    setPendingPersonAdds({})
    setPendingPersonDeletes({})
    clearEditState(orgId)
  }, [orgId])

  /** Whether there were any stored edits on mount (used to auto-enter edit mode). */
  const hadStoredEdits = useMemo(() => {
    const stored = loadEditState(orgId)
    return (
      stored != null &&
      (Object.keys(stored.dirtyMap ?? {}).length > 0 ||
        Object.keys(stored.pendingPersonEdits ?? {}).length > 0 ||
        Object.keys(stored.pendingPersonAdds ?? {}).length > 0 ||
        Object.keys(stored.pendingPersonDeletes ?? {}).length > 0)
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // intentionally run only once on mount

  return {
    // dirtyMap
    dirtyMap,
    setDirtyMap,
    markDirty,
    clearDirty,
    clearRowDirty,
    clearColumnDirty,
    isDirty,
    isRowDirty,
    isColumnDirty,
    getDirtyValue,
    dirtyCount,
    // validationErrors
    validationErrors,
    setValidationError,
    clearValidationError,
    hasValidationErrors,
    // person mutations
    pendingPersonEdits,
    setPendingPersonEdits,
    pendingPersonAdds,
    setPendingPersonAdds,
    pendingPersonDeletes,
    setPendingPersonDeletes,
    personOpCount,
    markPersonField,
    clearPersonField,
    revertPersonRow,
    addPendingPerson,
    cancelPendingAdd,
    markPersonDelete,
    unmarkPersonDelete,
    // bulk ops
    clearAll,
    hadStoredEdits,
  }
}
