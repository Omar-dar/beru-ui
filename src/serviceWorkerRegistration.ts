const isLocalhost = (): boolean =>
  window.location.hostname === 'localhost' ||
  window.location.hostname === '[::1]' ||
  /^127(?:\.(?:25[0-5]|2[0-4]\d|[01]?\d\d?)){3}$/.test(window.location.hostname)

export const registerServiceWorker = (): void => {
  if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) {
    return
  }

  const swUrl = `${process.env.PUBLIC_URL}/service-worker.js`

  window.addEventListener('load', () => {
    if (isLocalhost()) {
      checkValidServiceWorker(swUrl)
    } else {
      register(swUrl)
    }
  })
}

const register = (swUrl: string): void => {
  navigator.serviceWorker
    .register(swUrl)
    .then(registration => {
      registration.onupdatefound = () => {
        const installing = registration.installing
        if (!installing) return
        installing.onstatechange = () => {
          if (installing.state === 'installed' && navigator.serviceWorker.controller) {
            console.info('[PWA] New version available — refresh to update.')
          }
        }
      }
    })
    .catch(error => {
      console.warn('[PWA] Service worker registration failed:', error)
    })
}

const checkValidServiceWorker = (swUrl: string): void => {
  fetch(swUrl, { headers: { 'Service-Worker': 'script' } })
    .then(response => {
      if (
        response.status === 404 ||
        !response.headers.get('content-type')?.includes('javascript')
      ) {
        navigator.serviceWorker.ready.then(registration => registration.unregister())
        return
      }
      register(swUrl)
    })
    .catch(() => {
      console.warn('[PWA] No service worker found (dev mode).')
    })
}
