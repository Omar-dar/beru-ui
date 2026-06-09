const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  voiceOverlay: {
    publishState: state => ipcRenderer.send('voice-overlay:state', state),
    ready: () => ipcRenderer.send('voice-overlay:ready'),
    requestClose: () => ipcRenderer.send('voice-overlay:close'),
    activate: () => ipcRenderer.send('voice-overlay:activate'),
    onState: callback => {
      const handler = (_event, state) => callback(state)
      ipcRenderer.on('voice-overlay:state', handler)
      return () => ipcRenderer.removeListener('voice-overlay:state', handler)
    },
    onCloseRequest: callback => {
      const handler = () => callback()
      ipcRenderer.on('voice-overlay:close-request', handler)
      return () => ipcRenderer.removeListener('voice-overlay:close-request', handler)
    },
    onActivate: callback => {
      const handler = () => callback()
      ipcRenderer.on('voice-overlay:activate', handler)
      return () => ipcRenderer.removeListener('voice-overlay:activate', handler)
    },
  },
  browser: {
    handleClientActions: actions => ipcRenderer.invoke('beru:client-actions', actions),
    getState: () => ipcRenderer.invoke('beru:browser-state'),
    focusApp: () => ipcRenderer.send('beru:focus-app'),
    onState: callback => {
      const handler = (_event, state) => callback(state)
      ipcRenderer.on('beru:browser-state', handler)
      return () => ipcRenderer.removeListener('beru:browser-state', handler)
    },
  },
})
