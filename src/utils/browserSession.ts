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
  const activity = resolveBeruActivity(response)
  if (!activity || activity === 'idle') return false
  return (
    activity === 'searching' ||
    activity === 'browsing' ||
    activity === 'reading_page' ||
    !!response.browser_url ||
    (response.client_actions?.some(a => a.type === 'open_url') ?? false)
  )
}

export const shouldEndBrowserSession = (response: ChatResponse): boolean => {
  if (response.activity === 'idle') return true
  return (
    response.client_actions?.some(
      a => a.type === 'focus_app' || a.type === 'close_browser'
    ) ?? false
  )
}

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
