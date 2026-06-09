import { useState, useRef, useCallback, useEffect } from 'react'
import {
  getVoiceSupportInfo,
  microphoneErrorMessage,
  pickRecordingMimeType,
} from '../utils/voiceSupport'

const SPEECH_THRESHOLD = 0.035
const SILENCE_DURATION_MS = 1500
const MIN_RECORD_MS = 700
const MAX_RECORD_MS = 90000

export type StartRecordingOptions = {
  onAutoStop?: (blob: Blob) => void
  /** Fires when silence timeout stops recording, before the blob is ready */
  onAutoStopPending?: () => void
  /** Keep recording until manual stop (enrollment clips) */
  disableAutoStop?: boolean
  /** Rawer mic for voice profile enrollment */
  enrollProfile?: boolean
}

export const useVoiceRecorder = () => {
  const [isRecording, setIsRecording] = useState(false)
  const [audioLevel, setAudioLevel] = useState(0)
  const [isUserSpeaking, setIsUserSpeaking] = useState(false)
  const [recorderError, setRecorderError] = useState<string | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const rafRef = useRef<number>(0)
  const autoStopRef = useRef(false)
  const onAutoStopRef = useRef<((blob: Blob) => void) | null>(null)
  const onAutoStopPendingRef = useRef<(() => void) | null>(null)
  const disableAutoStopRef = useRef(false)

  const support = getVoiceSupportInfo()
  const isSupported = support.supported

  const stopAnalyser = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = 0
    }
    if (audioContextRef.current) {
      void audioContextRef.current.close()
      audioContextRef.current = null
    }
    analyserRef.current = null
    setAudioLevel(0)
    setIsUserSpeaking(false)
  }, [])

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach(track => track.stop())
    streamRef.current = null
    stopAnalyser()
  }, [stopAnalyser])

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop()
      }
      stopStream()
    }
  }, [stopStream])

  const stopRecordingInternal = useCallback((): Promise<Blob | null> => {
    return new Promise(resolve => {
      const recorder = mediaRecorderRef.current
      if (!recorder || recorder.state === 'inactive') {
        stopStream()
        setIsRecording(false)
        resolve(null)
        return
      }

      recorder.onstop = () => {
        const type = recorder.mimeType || pickRecordingMimeType() || 'audio/mp4'
        const blob = new Blob(chunksRef.current, { type })
        mediaRecorderRef.current = null
        stopStream()
        setIsRecording(false)
        resolve(blob.size > 0 ? blob : null)
      }

      if (recorder.state === 'recording') {
        try {
          recorder.requestData()
        } catch {
          /* optional */
        }
      }
      recorder.stop()
    })
  }, [stopStream])

  const triggerAutoStop = useCallback(async () => {
    if (autoStopRef.current || !mediaRecorderRef.current) return
    autoStopRef.current = true
    onAutoStopPendingRef.current?.()
    const blob = await stopRecordingInternal()
    onAutoStopRef.current?.(blob ?? new Blob())
    onAutoStopRef.current = null
    onAutoStopPendingRef.current = null
    autoStopRef.current = false
  }, [stopRecordingInternal])

  const startLevelMonitor = useCallback(
    async (stream: MediaStream, recordStart: number) => {
      try {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
        if (!AudioCtx) return

        const audioContext = new AudioCtx()
        audioContextRef.current = audioContext

        if (audioContext.state === 'suspended') {
          await audioContext.resume()
        }

        const source = audioContext.createMediaStreamSource(stream)
        const analyser = audioContext.createAnalyser()
        analyser.fftSize = 512
        analyser.smoothingTimeConstant = 0.75
        source.connect(analyser)
        analyserRef.current = analyser

        const data = new Uint8Array(analyser.frequencyBinCount)
        let hasSpeech = false
        let silenceStart: number | null = null

        const tick = () => {
          if (!analyserRef.current) return

          analyser.getByteTimeDomainData(data)
          let sum = 0
          for (let i = 0; i < data.length; i++) {
            const sample = (data[i] - 128) / 128
            sum += sample * sample
          }
          const rms = Math.sqrt(sum / data.length)
          const level = Math.min(1, rms * 4)
          setAudioLevel(level)

          const speaking = rms > SPEECH_THRESHOLD
          setIsUserSpeaking(speaking)
          const elapsed = Date.now() - recordStart

          if (speaking) {
            hasSpeech = true
            silenceStart = null
          } else if (
            !disableAutoStopRef.current &&
            hasSpeech &&
            elapsed > MIN_RECORD_MS
          ) {
            if (!silenceStart) {
              silenceStart = Date.now()
            } else if (Date.now() - silenceStart >= SILENCE_DURATION_MS) {
              void triggerAutoStop()
              return
            }
          }

          if (!disableAutoStopRef.current && elapsed > MAX_RECORD_MS) {
            void triggerAutoStop()
            return
          }

          rafRef.current = requestAnimationFrame(tick)
        }

        rafRef.current = requestAnimationFrame(tick)
      } catch {
        /* Visual level meter is optional; recording still works without it */
      }
    },
    [triggerAutoStop]
  )

  const startRecording = useCallback(
    async (
      options?: StartRecordingOptions | ((blob: Blob) => void)
    ): Promise<{ ok: true } | { ok: false; error: string }> => {
      const normalized: StartRecordingOptions =
        typeof options === 'function' ? { onAutoStop: options } : (options ?? {})
      const info = getVoiceSupportInfo()
      if (!info.supported) {
        const error = info.reason ?? 'Voice is not available on this device.'
        setRecorderError(error)
        return { ok: false, error }
      }

      try {
        setRecorderError(null)
        onAutoStopRef.current = normalized.onAutoStop ?? null
        onAutoStopPendingRef.current = normalized.onAutoStopPending ?? null
        autoStopRef.current = false
        disableAutoStopRef.current = normalized.disableAutoStop ?? false

        const stream = await navigator.mediaDevices.getUserMedia({
          audio: normalized.enrollProfile
            ? {
                echoCancellation: false,
                noiseSuppression: false,
                autoGainControl: true,
              }
            : {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
              },
          video: false,
        })
        streamRef.current = stream
        chunksRef.current = []

        const mimeType = pickRecordingMimeType()
        let recorder: MediaRecorder
        try {
          recorder = mimeType
            ? new MediaRecorder(stream, { mimeType })
            : new MediaRecorder(stream)
        } catch {
          recorder = new MediaRecorder(stream)
        }

        mediaRecorderRef.current = recorder
        recorder.ondataavailable = event => {
          if (event.data.size > 0) {
            chunksRef.current.push(event.data)
          }
        }
        recorder.onerror = () => {
          setRecorderError('Recording failed on this device. Try again or type your message.')
        }

        const recordStart = Date.now()
        try {
          recorder.start(250)
        } catch {
          recorder.start()
        }
        setIsRecording(true)
        void startLevelMonitor(stream, recordStart)
        return { ok: true }
      } catch (err) {
        const error = microphoneErrorMessage(err)
        setRecorderError(error)
        stopStream()
        return { ok: false, error }
      }
    },
    [startLevelMonitor, stopStream]
  )

  const stopRecording = useCallback(async (): Promise<Blob | null> => {
    onAutoStopRef.current = null
    onAutoStopPendingRef.current = null
    return stopRecordingInternal()
  }, [stopRecordingInternal])

  const cancelRecording = useCallback(() => {
    onAutoStopRef.current = null
    onAutoStopPendingRef.current = null
    autoStopRef.current = true
    const recorder = mediaRecorderRef.current
    if (recorder && recorder.state !== 'inactive') {
      recorder.onstop = null
      recorder.stop()
    }
    chunksRef.current = []
    mediaRecorderRef.current = null
    stopStream()
    setIsRecording(false)
    autoStopRef.current = false
  }, [stopStream])

  const resumeAudioContext = useCallback(async () => {
    const ctx = audioContextRef.current
    if (ctx?.state === 'suspended') {
      try {
        await ctx.resume()
      } catch {
        /* ignore */
      }
    }
  }, [])

  return {
    isRecording,
    audioLevel,
    isUserSpeaking,
    recorderError,
    isSupported,
    supportReason: support.reason,
    startRecording,
    stopRecording,
    cancelRecording,
    clearRecorderError: () => setRecorderError(null),
    resumeAudioContext,
  }
}
