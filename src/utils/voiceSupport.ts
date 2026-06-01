/** Detect mobile / iOS for MediaRecorder mime preferences */
export const isIosDevice = (): boolean => {
  if (typeof navigator === 'undefined') return false
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  )
}

export const pickRecordingMimeType = (): string => {
  if (typeof MediaRecorder === 'undefined') return ''

  const iosFirst = [
    'audio/mp4',
    'audio/aac',
    'audio/webm;codecs=opus',
    'audio/webm',
  ]
  const defaultOrder = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/aac',
    'audio/ogg;codecs=opus',
  ]
  const candidates = isIosDevice() ? iosFirst : defaultOrder
  for (const type of candidates) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type
    }
  }
  return ''
}

export const extensionForAudioBlob = (blob: Blob): string => {
  const type = blob.type.toLowerCase()
  if (type.includes('webm')) return 'webm'
  if (type.includes('mp4') || type.includes('m4a')) return 'm4a'
  if (type.includes('aac')) return 'aac'
  if (type.includes('ogg')) return 'ogg'
  if (type.includes('wav')) return 'wav'
  if (type.includes('mpeg') || type.includes('mp3')) return 'mp3'
  return isIosDevice() ? 'm4a' : 'webm'
}

export interface VoiceSupportInfo {
  supported: boolean
  reason: string | null
}

export const getVoiceSupportInfo = (): VoiceSupportInfo => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return { supported: false, reason: 'Voice is not available.' }
  }

  if (!window.isSecureContext) {
    return {
      supported: false,
      reason:
        'Microphone needs a secure connection (HTTPS). Do not use http:// on your phone — use your Netlify link or https://.',
    }
  }

  if (!navigator.mediaDevices?.getUserMedia) {
    return {
      supported: false,
      reason: 'This browser does not support microphone access. Try Safari or Chrome.',
    }
  }

  if (typeof MediaRecorder === 'undefined') {
    return {
      supported: false,
      reason: 'Recording is not supported in this browser. Update iOS/Safari or use Chrome.',
    }
  }

  return { supported: true, reason: null }
}

export const microphoneErrorMessage = (err: unknown): string => {
  const { reason } = getVoiceSupportInfo()
  if (reason) return reason

  if (err instanceof DOMException) {
    switch (err.name) {
      case 'NotAllowedError':
      case 'PermissionDeniedError':
        return 'Microphone blocked. In Safari: aA → Website Settings → Microphone → Allow. Then reload.'
      case 'NotFoundError':
        return 'No microphone found on this device.'
      case 'NotReadableError':
        return 'Microphone is in use by another app. Close other apps and try again.'
      case 'SecurityError':
        return 'Microphone blocked for security. Open Tild with https:// (not http://).'
      default:
        break
    }
  }

  if (err instanceof Error && err.message) {
    return err.message
  }

  return 'Could not access the microphone. Tap the mic again and allow access when asked.'
}
