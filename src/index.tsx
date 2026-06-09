import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import './styles/responsive.css'
import App from './App'
import VoiceOverlayApp from './VoiceOverlayApp'
import { registerServiceWorker } from './serviceWorkerRegistration'
import { initNative } from './native/initNative'

const isVoiceOverlayWindow = window.location.hash === '#voice-overlay'

if (isVoiceOverlayWindow) {
  document.documentElement.classList.add('voice-overlay-window')
  document.body.classList.add('voice-overlay-window')
  document.title = ''
}

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
)

root.render(
  <React.StrictMode>
    {isVoiceOverlayWindow ? <VoiceOverlayApp /> : <App />}
  </React.StrictMode>
)

if (!isVoiceOverlayWindow) {
  void initNative()
  registerServiceWorker()
}
