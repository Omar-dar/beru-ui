import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useVoiceRecorder } from '../hooks/useVoiceRecorder'
import { enrollVoice, getApiErrorMessage } from '../services/api'
import '../styles/voice-enroll.css'

const ENROLL_PROMPTS = [
  'Say clearly: "Hi Beru"',
  'Say clearly: "Wake up Beru"',
  'Say clearly: "Good morning Beru"',
]

const REQUIRED_CLIPS = 3
const ENROLL_DURATION_MS = 4000
const MIN_CLIP_BYTES = 6000

interface Props {
  open: boolean
  onComplete: () => void
  onClose?: () => void
  blocking?: boolean
}

const VoiceEnrollModal: React.FC<Props> = ({ open, onComplete, onClose, blocking = false }) => {
  const recorder = useVoiceRecorder()
  const [clips, setClips] = useState<Blob[]>([])
  const [step, setStep] = useState(0)
  const [recording, setRecording] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const heardSpeechRef = useRef(false)
  const stopTimerRef = useRef<number | null>(null)

  const clearStopTimer = useCallback(() => {
    if (stopTimerRef.current !== null) {
      window.clearTimeout(stopTimerRef.current)
      stopTimerRef.current = null
    }
  }, [])

  const resetFlow = useCallback(() => {
    clearStopTimer()
    setClips([])
    setStep(0)
    setRecording(false)
    setCountdown(0)
    setError(null)
    setSuccess(false)
    heardSpeechRef.current = false
    recorder.cancelRecording()
  }, [clearStopTimer, recorder])

  useEffect(() => {
    if (recording && recorder.isUserSpeaking) {
      heardSpeechRef.current = true
    }
  }, [recording, recorder.isUserSpeaking])

  useEffect(() => {
    if (!recording) {
      setCountdown(0)
      return undefined
    }

    setCountdown(Math.ceil(ENROLL_DURATION_MS / 1000))
    const tick = window.setInterval(() => {
      setCountdown(prev => (prev > 1 ? prev - 1 : prev))
    }, 1000)

    return () => window.clearInterval(tick)
  }, [recording])

  useEffect(() => () => clearStopTimer(), [clearStopTimer])

  const handleRecord = useCallback(async () => {
    if (recording || submitting || success) return
    setError(null)
    heardSpeechRef.current = false

    const result = await recorder.startRecording({
      disableAutoStop: true,
      enrollProfile: true,
    })
    if (!result.ok) {
      setError(result.error)
      return
    }

    setRecording(true)

    stopTimerRef.current = window.setTimeout(async () => {
      stopTimerRef.current = null
      const blob = await recorder.stopRecording()
      setRecording(false)

      if (!blob?.size) {
        setError('No audio captured. Allow the mic and try again.')
        return
      }

      if (!heardSpeechRef.current) {
        setError('We did not hear you. Speak for the full 4 seconds, close to the mic.')
        return
      }

      if (blob.size < MIN_CLIP_BYTES) {
        setError('Clip was too quiet or short. Speak louder and try again.')
        return
      }

      setClips(prev => [...prev, blob])
      heardSpeechRef.current = false
      if (step < REQUIRED_CLIPS - 1) {
        setStep(s => s + 1)
      }
    }, ENROLL_DURATION_MS)
  }, [recording, submitting, success, recorder, step])

  const handleSubmit = useCallback(async () => {
    if (clips.length < REQUIRED_CLIPS || submitting) return
    setSubmitting(true)
    setError(null)
    try {
      const result = await enrollVoice(clips)
      if (!result.ok && !result.enrolled) {
        setError(result.message ?? 'Enrollment failed. Try again.')
        return
      }
      setSuccess(true)
      window.setTimeout(() => {
        resetFlow()
        onComplete()
      }, 1200)
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not enroll voice. Check the API and try again.'))
    } finally {
      setSubmitting(false)
    }
  }, [clips, submitting, onComplete, resetFlow])

  const handleRetake = useCallback(() => {
    resetFlow()
  }, [resetFlow])

  if (!open) return null

  const readyToSubmit = clips.length >= REQUIRED_CLIPS && !recording

  return (
    <div className="voice-enroll-backdrop" role="dialog" aria-modal="true" aria-labelledby="voice-enroll-title">
      <div className="voice-enroll-panel">
        <header className="voice-enroll-header">
          <h2 id="voice-enroll-title">Enroll my voice</h2>
          {!blocking && onClose && (
            <button type="button" className="voice-enroll-close" onClick={onClose} aria-label="Close">
              ✕
            </button>
          )}
        </header>

        <p className="voice-enroll-lead">
          Record {REQUIRED_CLIPS} clips, 4 seconds each. Speak clearly the whole time. No password
          needed after this.
        </p>

        {success ? (
          <p className="voice-enroll-success" role="status">
            Voice enrolled. Say &ldquo;Wake up Beru&rdquo; to start.
          </p>
        ) : (
          <>
            <div className="voice-enroll-progress" aria-hidden>
              {Array.from({ length: REQUIRED_CLIPS }, (_, i) => (
                <span
                  key={i}
                  className={`voice-enroll-dot${i < clips.length ? ' voice-enroll-dot--done' : ''}${i === step && recording ? ' voice-enroll-dot--active' : ''}`}
                />
              ))}
            </div>

            <p className="voice-enroll-prompt">
              {clips.length >= REQUIRED_CLIPS
                ? 'All clips recorded. Submit when ready.'
                : ENROLL_PROMPTS[step]}
            </p>

            {recording && (
              <div className="voice-enroll-meter-wrap" aria-live="polite">
                <div className="voice-enroll-meter">
                  <div
                    className="voice-enroll-meter__fill"
                    style={{ width: `${Math.round(recorder.audioLevel * 100)}%` }}
                  />
                </div>
                <span className="voice-enroll-meter__label">
                  {countdown > 0 ? `Recording… ${countdown}s` : 'Recording…'}
                </span>
              </div>
            )}

            {error && (
              <p className="voice-enroll-error" role="alert">
                {error}
              </p>
            )}

            <div className="voice-enroll-actions">
              {clips.length < REQUIRED_CLIPS ? (
                <button
                  type="button"
                  className="voice-enroll-btn voice-enroll-btn--primary"
                  onClick={() => void handleRecord()}
                  disabled={recording || submitting || !recorder.isSupported}
                >
                  {recording ? 'Keep speaking…' : `Record clip ${clips.length + 1} (4 sec)`}
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    className="voice-enroll-btn voice-enroll-btn--primary"
                    onClick={() => void handleSubmit()}
                    disabled={!readyToSubmit || submitting}
                  >
                    {submitting ? 'Saving…' : 'Save voice profile'}
                  </button>
                  <button
                    type="button"
                    className="voice-enroll-btn"
                    onClick={handleRetake}
                    disabled={submitting || recording}
                  >
                    Start over
                  </button>
                </>
              )}
            </div>

            {!recorder.isSupported && (
              <p className="voice-enroll-hint">{recorder.supportReason}</p>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default VoiceEnrollModal
