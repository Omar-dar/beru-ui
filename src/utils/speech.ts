import { speakTextOnServer } from '../services/api'

let activeAudio: HTMLAudioElement | null = null

const speechLang = (lang: string): string => {
  if (lang === 'sv') return 'sv-SE'
  if (lang === 'ar') return 'ar-SA'
  return 'en-US'
}

const stripMarkdown = (text: string): string =>
  text.replace(/[#*_`>\[\]()]/g, '').trim()

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
    utterance.onend = () => resolve()
    utterance.onerror = () => reject(new Error('Speech failed'))
    window.speechSynthesis.speak(utterance)
  })
}

const playAudioBuffer = (buffer: ArrayBuffer, mimeType: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(new Blob([buffer], { type: mimeType }))
    const audio = new Audio(url)
    activeAudio = audio
    audio.onended = () => {
      URL.revokeObjectURL(url)
      if (activeAudio === audio) activeAudio = null
      resolve()
    }
    audio.onerror = () => {
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

/** Play Tild reply via POST /voice/speak (edge-tts MP3) or browser fallback */
export const speakTildReply = async (
  text: string,
  language: string,
  useServerTts: boolean
): Promise<void> => {
  const plain = stripMarkdown(text)
  if (!plain) return

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
  if (activeAudio) {
    activeAudio.pause()
    activeAudio.src = ''
    activeAudio = null
  }
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel()
  }
}
