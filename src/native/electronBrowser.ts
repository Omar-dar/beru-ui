import { ChatResponse } from '../types'

export const applyElectronClientActions = (response: ChatResponse): void => {
  const api = window.electronAPI?.browser
  if (!api) return

  for (const action of response.client_actions ?? []) {
    if (action.type === 'open_url' && action.url) {
      void api.openUrl(action.url)
    }
    if (action.type === 'focus_app') {
      api.focusApp()
    }
    if (action.type === 'close_browser') {
      api.focusApp()
    }
  }

  const shouldOpen =
    response.browser_url &&
    response.open_in_browser !== false &&
    !response.client_actions?.some(
      a => a.type === 'open_url' && a.url === response.browser_url
    )

  if (shouldOpen && response.browser_url) {
    void api.openUrl(response.browser_url)
  }
}

export const focusBeruApp = (): void => {
  window.electronAPI?.browser?.focusApp()
}
