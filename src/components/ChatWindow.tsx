import React, { useEffect, useRef } from 'react'
import { Message } from '../types'
import MessageBubble from './MessageBubble'

interface Props {
  messages: Message[]
  loading: boolean
  error: string | null
}

const ChatWindow: React.FC<Props> = ({ messages, loading, error }) => {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  return (
    <div style={{
      flex: 1,
      overflowY: 'auto',
      padding: '16px 0',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {messages.map(message => (
        <MessageBubble key={message.id} message={message} />
      ))}
      {loading && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '0 16px',
          marginBottom: '16px'
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            fontWeight: 'bold',
            color: 'white',
            flexShrink: 0
          }}>
            T
          </div>
          <div style={{
            padding: '12px 16px',
            borderRadius: '18px 18px 18px 4px',
            background: '#1e1e2e',
            color: '#6b7280',
            fontSize: '15px'
          }}>
            Tild thinks...
          </div>
        </div>
      )}
      {error && (
        <div style={{
          margin: '8px 16px',
          padding: '12px 16px',
          borderRadius: '12px',
          background: '#2d1b1b',
          color: '#f87171',
          fontSize: '14px',
          textAlign: 'center'
        }}>
          {error}
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  )
}

export default ChatWindow