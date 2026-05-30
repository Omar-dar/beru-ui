import React from 'react'

interface Props {
  prompts: string[]
  onSelect: (prompt: string) => void
  onDismiss: () => void
  disabled?: boolean
}

const SuggestedPrompts: React.FC<Props> = ({
  prompts,
  onSelect,
  onDismiss,
  disabled,
}) => (
  <div className="suggested-prompts">
    <div className="suggested-prompts-header">
      <span>Try asking</span>
      <button type="button" className="suggested-prompts-dismiss" onClick={onDismiss}>
        Hide
      </button>
    </div>
    <div className="suggested-prompts-chips">
      {prompts.map(prompt => (
        <button
          key={prompt}
          type="button"
          className="suggested-prompt-chip"
          disabled={disabled}
          onClick={() => onSelect(prompt)}
        >
          {prompt}
        </button>
      ))}
    </div>
  </div>
)

export default SuggestedPrompts
