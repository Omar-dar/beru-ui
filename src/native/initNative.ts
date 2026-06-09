import { Capacitor } from '@capacitor/core'

/** Status bar + splash on iOS/Android (no-op in browser/Electron). */
export const initNative = async (): Promise<void> => {
  if (!Capacitor.isNativePlatform()) return

  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar')
    await StatusBar.setStyle({ style: Style.Dark })
    await StatusBar.setBackgroundColor({ color: '#05050a' })
  } catch {
    // Plugin unavailable
  }

  try {
    const { SplashScreen } = await import('@capacitor/splash-screen')
    await SplashScreen.hide()
  } catch {
    // Plugin unavailable
  }
}

export const isNativeApp = (): boolean => Capacitor.isNativePlatform()

export const isElectron =
  typeof window !== 'undefined' && !!window.electronAPI
