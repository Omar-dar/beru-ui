import React from 'react'
import ChatWindow from './components/ChatWindow'
import InputBar from './components/InputBar'
import { useChat } from './hooks/useChat'

const App: React.FC = () => {
  const { messages, loading, error, sendUserMessage, clearChat } = useChat()

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      background: '#12121a',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid #2d2d3d',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: '#12121a'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            fontWeight: 'bold',
            color: 'white'
          }}>
            T
          </div>
          <div>
            <div style={{ color: 'white', fontWeight: '600', fontSize: '16px' }}>
              Tild
            </div>
            <div style={{ color: '#6b7280', fontSize: '12px' }}>
              Personal AI by Omar Darwish
            </div>
          </div>
        </div>
        <button
          onClick={clearChat}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: '1px solid #2d2d3d',
            background: 'transparent',
            color: '#6b7280',
            cursor: 'pointer',
            fontSize: '13px'
          }}
        >
          Clear chat
        </button>
      </div>
      <ChatWindow messages={messages} loading={loading} error={error} />
      <InputBar onSend={sendUserMessage} loading={loading} />
    </div>
  )
}

export default App