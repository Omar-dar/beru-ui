import React from 'react'

interface Props {
  disabled?: boolean
  active?: boolean
  onClick: () => void
}

const MicIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M12 14a3 3 0 003-3V5a3 3 0 10-6 0v6a3 3 0 003 3zm5-3a5 5 0 01-10 0H5a7 7 0 0014 0h-2zm-5 9a7 7 0 007-7h2a9 9 0 11-18 0h2a7 7 0 007 7z" />
  </svg>
)

const VoiceButton: React.FC<Props> = ({ disabled, active, onClick }) => (
  <button
    type="button"
    className={`composer-voice${active ? ' composer-voice--active' : ''}`}
    onClick={onClick}
    disabled={disabled}
    aria-label="Start voice chat"
    title="Voice chat"
  >
    <MicIcon />
  </button>
)

export default VoiceButton
