/**
 * Debug mode utilities.
 *
 * Toggle from the browser console:
 *   window.lionsDebug(true)   // enable
 *   window.lionsDebug(false)  // disable
 *
 * Persisted in localStorage so it survives refresh.
 */

const STORAGE_KEY = 'lionsDebug'

export function isDebugEnabled() {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

export function debugLog(...args) {
  if (isDebugEnabled()) {
    console.debug('[lions]', ...args)
  }
}

// Expose toggle on window at module load time
if (typeof window !== 'undefined') {
  window.lionsDebug = (enabled) => {
    try {
      if (enabled) {
        localStorage.setItem(STORAGE_KEY, 'true')
        console.info(
          '[lions] Debug mode enabled. Call window.lionsDebug(false) to disable.'
        )
      } else {
        localStorage.removeItem(STORAGE_KEY)
        console.info('[lions] Debug mode disabled.')
      }
    } catch {
      console.error('[lions] Could not persist debug mode setting.')
    }
  }
  if (isDebugEnabled()) {
    console.info(
      '[lions] Debug mode is ON. Call window.lionsDebug(false) to disable.'
    )
  }
}
