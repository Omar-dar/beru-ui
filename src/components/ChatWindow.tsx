import React, { useEffect, useRef } from 'react'
import { Message } from '../types'
import MessageBubble from './MessageBubble'
import TypingIndicator from './TypingIndicator'

interface Props {
  messages: Message[]
  loading: boolean
  voiceProcessing?: boolean
  voiceSessionOpen?: boolean
  voiceIntegrated?: boolean
  error: string | null
}

const ChatWindow: React.FC<Props> = ({
  messages,
  loading,
  voiceProcessing = false,
  voiceSessionOpen = false,
  voiceIntegrated = false,
  error,
}) => {
  const bottomRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'auto', block: 'end' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, loading, voiceProcessing])

  const showThinking = (loading || voiceProcessing) && !voiceSessionOpen

  return (
    <div className="chat-scroll">
      <div className={`chat-messages${voiceIntegrated ? ' chat-messages--voice' : ''}`}>
        {messages.map(message => (
          <MessageBubble
            key={message.id}
            message={message}
            onReveal={message.animate ? scrollToBottom : undefined}
          />
        ))}
        {showThinking && (
          <div className="chat-row chat-row--assistant">
            <div className="chat-avatar" aria-hidden>
              T
            </div>
            <div className="chat-body">
              <TypingIndicator />
            </div>
          </div>
        )}
        {error && <div className="chat-error">{error}</div>}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}

export default ChatWindow
