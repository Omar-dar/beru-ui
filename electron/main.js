const { app, BrowserWindow, session, shell, screen, ipcMain } = require('electron')
const path = require('path')

const isDev = !app.isPackaged
const DEV_URL = process.env.ELECTRON_START_URL || 'http://localhost:3000'
const OVERLAY_URL = isDev ? `${DEV_URL}/#voice-overlay` : null

let mainWindow = null
let voiceOverlayWindow = null
let lastVoiceState = { open: false }
let overlayTopTimer = null

const allowMediaPermissions = () => {
  session.defaultSession.setPermissionRequestHandler((_wc, permission, callback) => {
    const allowed = new Set([
      'media',
      'microphone',
      'audioCapture',
      'clipboard-read',
    ])
    callback(allowed.has(permission))
  })
}

const overlayEntryUrl = () => {
  if (isDev) return OVERLAY_URL
  return `file://${path.join(__dirname, '..', 'build', 'index.html')}#voice-overlay`
}

const OVERLAY_W = 340
const OVERLAY_H = 108
const OVERLAY_TOP_OFFSET = 52

const positionVoiceOverlay = () => {
  if (!voiceOverlayWindow) return
  const { workArea } = screen.getPrimaryDisplay()
  const margin = 12
  const x = Math.round(workArea.x + workArea.width - OVERLAY_W - margin)
  const y = Math.round(workArea.y + OVERLAY_TOP_OFFSET)
  voiceOverlayWindow.setBounds({ x, y, width: OVERLAY_W, height: OVERLAY_H })
}

const ensureOverlayOnTop = () => {
  if (!voiceOverlayWindow || voiceOverlayWindow.isDestroyed() || !lastVoiceState.open) return
  positionVoiceOverlay()
  voiceOverlayWindow.setAlwaysOnTop(true, 'screen-saver', 1)
  if (!voiceOverlayWindow.isVisible()) {
    voiceOverlayWindow.showInactive()
  }
  voiceOverlayWindow.moveTop()
}

const startOverlayTopKeeper = () => {
  if (overlayTopTimer) return
  overlayTopTimer = setInterval(ensureOverlayOnTop, 1500)
}

const stopOverlayTopKeeper = () => {
  if (!overlayTopTimer) return
  clearInterval(overlayTopTimer)
  overlayTopTimer = null
}

const createVoiceOverlayWindow = () => {
  if (voiceOverlayWindow) return voiceOverlayWindow

  voiceOverlayWindow = new BrowserWindow({
    width: OVERLAY_W,
    height: OVERLAY_H,
    show: false,
    frame: false,
    transparent: true,
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    focusable: true,
    hasShadow: false,
    thickFrame: false,
    title: '',
    backgroundColor: '#00000000',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      backgroundThrottling: false,
      preload: path.join(__dirname, 'preload.js'),
    },
  })

  voiceOverlayWindow.setTitle('')
  voiceOverlayWindow.setMenuBarVisibility(false)
  voiceOverlayWindow.setAlwaysOnTop(true, 'screen-saver', 1)
  voiceOverlayWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })
  voiceOverlayWindow.setIgnoreMouseEvents(false)

  voiceOverlayWindow.on('closed', () => {
    voiceOverlayWindow = null
  })

  void voiceOverlayWindow.loadURL(overlayEntryUrl())

  voiceOverlayWindow.webContents.once('did-finish-load', () => {
    if (lastVoiceState.open) {
      voiceOverlayWindow.webContents.send('voice-overlay:state', lastVoiceState)
      positionVoiceOverlay()
    }
  })

  return voiceOverlayWindow
}

const showVoiceOverlay = () => {
  const win = createVoiceOverlayWindow()
  ensureOverlayOnTop()
  startOverlayTopKeeper()
}

const hideVoiceOverlay = () => {
  stopOverlayTopKeeper()
  if (!voiceOverlayWindow) return
  voiceOverlayWindow.hide()
}

const broadcastVoiceState = (state) => {
  const wasOpen = lastVoiceState.open
  lastVoiceState = state

  if (state.open) {
    if (!wasOpen) {
      showVoiceOverlay()
    }
    if (voiceOverlayWindow && !voiceOverlayWindow.webContents.isLoading()) {
      voiceOverlayWindow.webContents.send('voice-overlay:state', state)
      if (!wasOpen) positionVoiceOverlay()
    }
  } else if (wasOpen) {
    hideVoiceOverlay()
    if (voiceOverlayWindow && !voiceOverlayWindow.webContents.isLoading()) {
      voiceOverlayWindow.webContents.send('voice-overlay:state', state)
    }
  }
}

const registerBrowserIpc = () => {
  ipcMain.handle('beru:open-url', async (_event, url) => {
    if (!mainWindow || _event.sender !== mainWindow.webContents) return false
    if (typeof url !== 'string' || !/^https?:\/\//i.test(url)) return false
    await shell.openExternal(url)
    ensureOverlayOnTop()
    return true
  })

  ipcMain.on('beru:focus-app', event => {
    if (!mainWindow || mainWindow.isDestroyed()) return
    if (event.sender !== mainWindow.webContents && voiceOverlayWindow) {
      if (event.sender !== voiceOverlayWindow.webContents) return
    }
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.show()
    mainWindow.focus()
  })
}

const registerVoiceOverlayIpc = () => {
  ipcMain.on('voice-overlay:state', (_event, state) => {
    if (!mainWindow || _event.sender !== mainWindow.webContents) return
    broadcastVoiceState(state)
  })

  ipcMain.on('voice-overlay:ready', event => {
    if (!voiceOverlayWindow || event.sender !== voiceOverlayWindow.webContents) return
    event.sender.send('voice-overlay:state', lastVoiceState)
  })

  ipcMain.on('voice-overlay:close', event => {
    if (!voiceOverlayWindow || event.sender !== voiceOverlayWindow.webContents) return
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('voice-overlay:close-request')
    }
  })

  ipcMain.on('voice-overlay:activate', event => {
    if (!voiceOverlayWindow || event.sender !== voiceOverlayWindow.webContents) return
    if (!mainWindow || mainWindow.isDestroyed()) return
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.show()
    mainWindow.focus()
    mainWindow.webContents.send('voice-overlay:activate')
  })
}

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1180,
    height: 820,
    minWidth: 380,
    minHeight: 600,
    backgroundColor: '#05050a',
    show: false,
    title: 'Beru',
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      backgroundThrottling: false,
      preload: path.join(__dirname, 'preload.js'),
    },
  })

  mainWindow.once('ready-to-show', () => mainWindow.show())

  mainWindow.on('blur', () => {
    setTimeout(ensureOverlayOnTop, 50)
  })

  mainWindow.on('closed', () => {
    mainWindow = null
    if (voiceOverlayWindow) {
      voiceOverlayWindow.close()
      voiceOverlayWindow = null
    }
  })

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    ensureOverlayOnTop()
    return { action: 'deny' }
  })

  if (isDev) {
    mainWindow.loadURL(DEV_URL)
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'build', 'index.html'))
  }
}

app.whenReady().then(() => {
  allowMediaPermissions()
  registerVoiceOverlayIpc()
  registerBrowserIpc()
  createWindow()

  screen.on('display-metrics-changed', () => {
    if (lastVoiceState.open) positionVoiceOverlay()
  })

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
