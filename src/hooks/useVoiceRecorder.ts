import { useState, useRef, useCallback, useEffect } from 'react'

const pickMimeType = (): string => {
  const types = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/wav']
  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type
    }
  }
  return ''
}

const SPEECH_THRESHOLD = 0.035
const SILENCE_DURATION_MS = 1500
const MIN_RECORD_MS = 700
const MAX_RECORD_MS = 90000

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

  const isSupported =
    typeof navigator !== 'undefined' &&
    !!navigator.mediaDevices?.getUserMedia &&
    typeof MediaRecorder !== 'undefined'

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
        const type = recorder.mimeType || 'audio/webm'
        const blob = new Blob(chunksRef.current, { type })
        mediaRecorderRef.current = null
        stopStream()
        setIsRecording(false)
        resolve(blob.size > 0 ? blob : null)
      }

      recorder.stop()
    })
  }, [stopStream])

  const triggerAutoStop = useCallback(async () => {
    if (autoStopRef.current || !mediaRecorderRef.current) return
    autoStopRef.current = true
    const blob = await stopRecordingInternal()
    onAutoStopRef.current?.(blob ?? new Blob())
    onAutoStopRef.current = null
    autoStopRef.current = false
  }, [stopRecordingInternal])

  const startLevelMonitor = useCallback(
    (stream: MediaStream, recordStart: number) => {
      const audioContext = new AudioContext()
      audioContextRef.current = audioContext
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
        } else if (hasSpeech && elapsed > MIN_RECORD_MS) {
          if (!silenceStart) {
            silenceStart = Date.now()
          } else if (Date.now() - silenceStart >= SILENCE_DURATION_MS) {
            void triggerAutoStop()
            return
          }
        }

        if (elapsed > MAX_RECORD_MS) {
          void triggerAutoStop()
          return
        }

        rafRef.current = requestAnimationFrame(tick)
      }

      rafRef.current = requestAnimationFrame(tick)
    },
    [triggerAutoStop]
  )

  const startRecording = useCallback(
    async (onAutoStop?: (blob: Blob) => void): Promise<boolean> => {
      if (!isSupported) {
        setRecorderError('Voice recording is not supported in this browser.')
        return false
      }

      try {
        setRecorderError(null)
        onAutoStopRef.current = onAutoStop ?? null
        autoStopRef.current = false

        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        })
        streamRef.current = stream
        chunksRef.current = []

        const mimeType = pickMimeType()
        const recorder = mimeType
          ? new MediaRecorder(stream, { mimeType })
          : new MediaRecorder(stream)

        mediaRecorderRef.current = recorder
        recorder.ondataavailable = event => {
          if (event.data.size > 0) {
            chunksRef.current.push(event.data)
          }
        }

        const recordStart = Date.now()
        recorder.start(200)
        setIsRecording(true)
        startLevelMonitor(stream, recordStart)
        return true
      } catch {
        setRecorderError('Microphone access denied or unavailable.')
        stopStream()
        return false
      }
    },
    [isSupported, startLevelMonitor, stopStream]
  )

  const stopRecording = useCallback(async (): Promise<Blob | null> => {
    onAutoStopRef.current = null
    return stopRecordingInternal()
  }, [stopRecordingInternal])

  const cancelRecording = useCallback(() => {
    onAutoStopRef.current = null
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

  return {
    isRecording,
    audioLevel,
    isUserSpeaking,
    recorderError,
    isSupported,
    startRecording,
    stopRecording,
    cancelRecording,
    clearRecorderError: () => setRecorderError(null),
  }
}
