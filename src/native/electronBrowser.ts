import { ChatResponse, ClientAction, ElectronBrowserState } from '../types'

export const isElectronBrowser = (): boolean =>
  typeof window !== 'undefined' && !!window.electronAPI?.browser?.handleClientActions

/** Run backend client_actions in order (Electron only). */
export const handleElectronClientActions = async (
  actions: ClientAction[]
): Promise<ElectronBrowserState | null> => {
  const api = window.electronAPI?.browser
  if (!api?.handleClientActions || !actions.length) {
    return api?.getState?.() ?? null
  }
  return api.handleClientActions(actions)
}

export const applyElectronClientActions = async (
  response: ChatResponse
): Promise<ElectronBrowserState | null> => {
  if (!isElectronBrowser()) return null

  const actions = response.client_actions ?? []
  if (!actions.length) {
    return window.electronAPI?.browser?.getState?.() ?? null
  }

  return handleElectronClientActions(actions)
}

export const focusBeruApp = (): void => {
  window.electronAPI?.browser?.focusApp?.()
}

/** Bring Beru to the foreground when a new reply appears and the app is in the background. */
export const focusBeruAppWhenReplying = (): void => {
  if (typeof document === 'undefined') return

  const backgrounded = document.hidden || !document.hasFocus()

  if (window.electronAPI?.browser) {
    if (backgrounded) {
      focusBeruApp()
    }
    return
  }

  if (backgrounded) {
    try {
      window.focus()
    } catch {
      /* Browsers may block focus from a background tab */
    }
  }
}

export const subscribeElectronBrowserState = (
  callback: (state: ElectronBrowserState) => void
): (() => void) | undefined => {
  return window.electronAPI?.browser?.onState?.(callback)
}
