import { speakTextOnServer } from '../services/api'
import {
  attachTtsAnalyser,
  startSyntheticTtsLevel,
  stopSyntheticTtsLevel,
  stopTtsLevelMonitor,
} from './ttsAudioLevel'

let activeAudio: HTMLAudioElement | null = null

const speechLang = (lang: string): string => {
  if (lang === 'sv') return 'sv-SE'
  if (lang === 'ar') return 'ar-SA'
  return 'en-US'
}

const stripMarkdown = (text: string): string =>
  text.replace(/[#*_`>[\]()]/g, '').trim()

export const speakWithBrowser = (text: string, language: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!('speechSynthesis' in window)) {
      resolve()
      return
    }
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = speechLang(language)
    utterance.rate = 1
    startSyntheticTtsLevel()
    utterance.onend = () => {
      stopSyntheticTtsLevel()
      resolve()
    }
    utterance.onerror = () => {
      stopSyntheticTtsLevel()
      reject(new Error('Speech failed'))
    }
    window.speechSynthesis.speak(utterance)
  })
}

const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}

export interface EmbeddedVoiceAudio {
  base64: string
  mimeType: string
}

const playAudioBuffer = (buffer: ArrayBuffer, mimeType: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(new Blob([buffer], { type: mimeType }))
    const audio = new Audio(url)
    activeAudio = audio
    attachTtsAnalyser(audio)
    audio.onended = () => {
      stopTtsLevelMonitor()
      URL.revokeObjectURL(url)
      if (activeAudio === audio) activeAudio = null
      resolve()
    }
    audio.onerror = () => {
      stopTtsLevelMonitor()
      URL.revokeObjectURL(url)
      if (activeAudio === audio) activeAudio = null
      reject(new Error('Audio playback failed'))
    }
    void audio.play().catch(err => {
      URL.revokeObjectURL(url)
      reject(err)
    })
  })
}

/** Play Beru reply: embedded audio from /voice/chat, /voice/speak, or browser fallback */
export const speakBeruReply = async (
  text: string,
  language: string,
  useServerTts: boolean,
  embeddedAudio?: EmbeddedVoiceAudio | null
): Promise<void> => {
  const plain = stripMarkdown(text)
  if (!plain) return

  if (embeddedAudio?.base64) {
    try {
      const buffer = base64ToArrayBuffer(embeddedAudio.base64)
      await playAudioBuffer(buffer, embeddedAudio.mimeType || 'audio/mpeg')
      return
    } catch {
      /* fall through to server/browser TTS */
    }
  }

  if (useServerTts) {
    try {
      const { buffer, mimeType } = await speakTextOnServer(plain, language)
      await playAudioBuffer(buffer, mimeType)
      return
    } catch {
      /* fall back to browser TTS */
    }
  }

  await speakWithBrowser(plain, language)
}

export const stopSpeaking = (): void => {
  stopTtsLevelMonitor()
  stopSyntheticTtsLevel()
  if (activeAudio) {
    activeAudio.pause()
    activeAudio.src = ''
    activeAudio = null
  }
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel()
  }
}
