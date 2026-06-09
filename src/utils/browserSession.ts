import { BeruActivity, ChatResponse } from '../types'
import { VoiceOrbMode } from '../components/VoiceOrb'

export const isBrowserSource = (source?: string): boolean =>
  source === 'search' || source === 'web_search' || source === 'browser'

export const resolveBeruActivity = (response: ChatResponse): BeruActivity | null => {
  if (response.activity === 'idle') return 'idle'
  if (response.activity) return response.activity
  if (isBrowserSource(response.source)) return 'searching'
  if (response.browser_url) return 'browsing'
  return null
}

export const shouldStartBrowserSession = (response: ChatResponse): boolean => {
  if (response.browser_open) return true
  if (response.client_actions?.some(a => a.type === 'open_url')) return true
  const activity = resolveBeruActivity(response)
  if (!activity || activity === 'idle') return false
  return (
    activity === 'searching' ||
    activity === 'browsing' ||
    activity === 'reading_page' ||
    !!resolveOpenedUrl(response)
  )
}

export const shouldEndBrowserSession = (response: ChatResponse): boolean => {
  if (
    response.client_actions?.some(
      a => a.type === 'focus_app' || a.type === 'close_browser'
    )
  ) {
    return true
  }
  if (response.activity === 'idle' && !response.browser_open) {
    return true
  }
  return false
}

export const resolveOpenedUrl = (response: ChatResponse): string | undefined =>
  response.opened_url ?? response.browser_url

export const hadCloseTab = (response: ChatResponse): boolean =>
  response.client_actions?.some(a => a.type === 'close_tab') ?? false

export const browserStatusText = (
  activity: BeruActivity,
  response: ChatResponse
): string => {
  if (activity === 'reading_page') {
    return response.page_title
      ? `Reading: ${response.page_title}`
      : 'Reading the page…'
  }
  if (activity === 'browsing') {
    return response.search_query
      ? `Browsing: ${response.search_query}`
      : 'Browsing the web…'
  }
  return response.search_query
    ? `Searching: ${response.search_query}`
    : 'Searching the web…'
}

export const floatOrbModeForBrowser = (activity: BeruActivity): VoiceOrbMode => {
  if (activity === 'reading_page' || activity === 'browsing') return 'searching'
  return 'searching'
}
