import React from 'react'

const TypingIndicator: React.FC = () => (
  <div className="typing-indicator" aria-label="Beru is thinking">
    <div className="typing-indicator__dots">
      <span className="typing-dot" />
      <span className="typing-dot" />
      <span className="typing-dot" />
    </div>
    <span className="typing-indicator__label">Beru is thinking</span>
  </div>
)

export default TypingIndicator
