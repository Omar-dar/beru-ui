import React from 'react'
import { Message } from '../types'

interface Props {
  message: Message
}

const MessageBubble: React.FC<Props> = ({ message }) => {
  const isUser = message.role === 'user'

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: isUser ? 'flex-end' : 'flex-start',
      marginBottom: '16px',
      padding: '0 16px'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: '8px',
        flexDirection: isUser ? 'row-reverse' : 'row'
      }}>
        {!isUser && (
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
        )}
        <div style={{
          maxWidth: '70%',
          padding: '12px 16px',
          borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
          background: isUser
            ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
            : '#1e1e2e',
          color: 'white',
          fontSize: '15px',
          lineHeight: '1.5',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word'
        }}>
          {message.content}
        </div>
      </div>
      <span style={{
        fontSize: '11px',
        color: '#6b7280',
        marginTop: '4px',
        marginLeft: isUser ? '0' : '40px',
        marginRight: isUser ? '0' : '0'
      }}>
        {formatTime(message.timestamp)}
      </span>
    </div>
  )
}

export default MessageBubble