import React, { useState, useRef, useCallback, KeyboardEvent, useEffect } from 'react'
import SuggestedPrompts from './SuggestedPrompts'
import VoiceButton from './VoiceButton'
import { getMessageDirection } from '../utils/textDirection'
interface Props {
  onSend: (message: string) => void
  onUpload: (file: File) => void
  onSuggestedPrompt?: (prompt: string) => void
  onDismissSuggested?: () => void
  loading: boolean
  uploading: boolean
  voiceProcessing?: boolean
  voiceDisabledHint?: string | null
  voiceSessionOpen?: boolean
  onVoiceClick?: () => void
  uploadError: string | null
  voiceError?: string | null
  suggestedPrompts?: string[]
  showSuggestedPrompts?: boolean
}

const SendIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M12 3L10.5 4.5L16 10H4v2h12l-5.5 5.5L12 21l9-9-9-9z" transform="rotate(-90 12 12)" />
  </svg>
)

const AttachIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
  </svg>
)

const InputBar: React.FC<Props> = ({
  onSend,
  onUpload,
  onSuggestedPrompt,
  onDismissSuggested,
  loading,
  uploading,
  voiceProcessing = false,
  voiceDisabledHint = null,
  voiceSessionOpen = false,
  onVoiceClick,
  uploadError,
  voiceError,
  suggestedPrompts = [],
  showSuggestedPrompts = false,
}) => {
  const [input, setInput] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const busy = loading || uploading || voiceProcessing || voiceSessionOpen
  const inputDir = getMessageDirection(input)

  const adjustHeight = useCallback(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`
  }, [])

  useEffect(() => {
    adjustHeight()
  }, [input, adjustHeight])

  const handleSend = () => {
    if (!input.trim() || busy) return
    onSend(input.trim())
    setInput('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onUpload(file)
    }
    e.target.value = ''
  }

  return (
    <div className="composer-wrap">
      <div className="composer-inner">
        {(uploadError || voiceError) && (
          <div className="upload-error" role="alert">
            {uploadError || voiceError}
          </div>
        )}

        {showSuggestedPrompts && suggestedPrompts.length > 0 && onSuggestedPrompt && onDismissSuggested && (
          <SuggestedPrompts
            prompts={suggestedPrompts}
            onSelect={onSuggestedPrompt}
            onDismiss={onDismissSuggested}
            disabled={busy}
          />
        )}

        <div className="composer-box">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            hidden
            onChange={handleFileChange}
          />
          <button
            type="button"
            className="composer-attach"
            onClick={() => fileInputRef.current?.click()}
            disabled={busy}
            aria-label="Upload PDF"
            title="Upload PDF"
          >
            {uploading ? (
              <span className="composer-attach-spinner" aria-hidden />
            ) : (
              <AttachIcon />
            )}
          </button>
          {onVoiceClick && (
            <VoiceButton
              active={voiceSessionOpen}
              disabled={busy}
              onClick={onVoiceClick}
              title={voiceDisabledHint ?? 'Voice chat'}
            />
          )}
          <textarea
            ref={textareaRef}
            className="composer-input"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message Beru…"
            disabled={busy}
            rows={1}
            dir={inputDir}
            lang={inputDir === 'rtl' ? 'ar' : undefined}
          />
          <button
            type="button"
            className="composer-send"
            onClick={handleSend}
            disabled={busy || !input.trim()}
            aria-label="Send message"
          >
            <SendIcon />
          </button>
        </div>
      </div>
    </div>
  )
}

export default InputBar
