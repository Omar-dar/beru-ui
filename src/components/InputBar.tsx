import React, { useState, KeyboardEvent } from 'react'

interface Props {
  onSend: (message: string) => void
  loading: boolean
}

const InputBar: React.FC<Props> = ({ onSend, loading }) => {
  const [input, setInput] = useState('')

  const handleSend = () => {
    if (!input.trim() || loading) return
    onSend(input.trim())
    setInput('')
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div style={{
      padding: '16px',
      borderTop: '1px solid #2d2d3d',
      background: '#12121a',
      display: 'flex',
      gap: '12px',
      alignItems: 'flex-end'
    }}>
      <textarea
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Skriv ett meddelande... / Type a message..."
        disabled={loading}
        rows={1}
        style={{
          flex: 1,
          padding: '12px 16px',
          borderRadius: '12px',
          border: '1px solid #2d2d3d',
          background: '#1e1e2e',
          color: 'white',
          fontSize: '15px',
          resize: 'none',
          outline: 'none',
          fontFamily: 'inherit',
          lineHeight: '1.5',
          maxHeight: '120px',
          overflowY: 'auto'
        }}
      />
      <button
        onClick={handleSend}
        disabled={loading || !input.trim()}
        style={{
          width: '44px',
          height: '44px',
          borderRadius: '12px',
          border: 'none',
          background: loading || !input.trim()
            ? '#2d2d3d'
            : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          color: 'white',
          cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '18px',
          transition: 'all 0.2s',
          flexShrink: 0
        }}
      >
        {loading ? '...' : '→'}
      </button>
    </div>
  )
}

export default InputBar