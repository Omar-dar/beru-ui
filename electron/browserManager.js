const { shell } = require('electron')

let browserOpen = false
let currentTabUrl = null

const isValidUrl = url => typeof url === 'string' && /^https?:\/\//i.test(url)

const getState = () => ({
  browserOpen,
  currentTabUrl,
  panelVisible: false,
})

const notifyRenderer = mainWindow => {
  if (!mainWindow || mainWindow.isDestroyed()) return
  mainWindow.webContents.send('beru:browser-state', getState())
}

const openUrl = async (_mainWindow, url) => {
  if (!isValidUrl(url)) return getState()

  try {
    await shell.openExternal(url)
    browserOpen = true
    currentTabUrl = url
  } catch (err) {
    console.error('[Beru browser] openExternal failed:', err.message)
  }

  return getState()
}

const closeTab = (mainWindow, site = '') => {
  if (!browserOpen) return getState()

  if (site && currentTabUrl && !currentTabUrl.toLowerCase().includes(site.toLowerCase())) {
    return getState()
  }

  browserOpen = false
  currentTabUrl = null
  notifyRenderer(mainWindow)
  return getState()
}

const focusApp = mainWindow => {
  notifyRenderer(mainWindow)
  return getState()
}

const executeClientAction = async (mainWindow, action, onExternalOpen) => {
  if (!action || typeof action !== 'object') return getState()

  switch (action.type) {
    case 'open_url':
      if (action.url) {
        const state = await openUrl(mainWindow, action.url)
        onExternalOpen?.()
        return state
      }
      break
    case 'close_tab':
      return closeTab(mainWindow, action.site || '')
    case 'scroll':
    case 'scroll_to_text':
      console.info(
        `[Beru browser] ${action.type} skipped — page runs in your system browser, not inside Beru`
      )
      return getState()
    case 'focus_app':
    case 'close_browser':
      return focusApp(mainWindow)
    default:
      break
  }

  return getState()
}

const handleClientActions = async (mainWindow, actions, onExternalOpen) => {
  if (!Array.isArray(actions)) return getState()

  let state = getState()
  for (const action of actions) {
    state = await executeClientAction(mainWindow, action, onExternalOpen)
  }
  notifyRenderer(mainWindow)
  return state
}

const registerBrowserManager = (mainWindowGetter, focusMainWindow, onExternalOpen) => {
  const getWin = () => (typeof mainWindowGetter === 'function' ? mainWindowGetter() : mainWindowGetter)

  return {
    getState,
    layoutBrowser: () => {},
    handleClientActions: actions =>
      handleClientActions(getWin(), actions, onExternalOpen),
    focusApp: () => {
      focusApp(getWin())
      focusMainWindow()
    },
    destroy: () => {
      browserOpen = false
      currentTabUrl = null
    },
  }
}

module.exports = { registerBrowserManager }
