import React from 'react'
import { Message } from '../types'
import MarkdownContent from './MarkdownContent'
import AnimatedMarkdown from './AnimatedMarkdown'
import ChatDocumentCard from './ChatDocumentCard'

interface Props {
  message: Message
  onReveal?: () => void
}

const MessageBubble: React.FC<Props> = ({ message, onReveal }) => {
  const isUser = message.role === 'user'

  if (isUser) {
    return (
      <div className="chat-row chat-row--user">
        <div className="chat-body chat-body--user">
          {message.attachment && (
            <ChatDocumentCard attachment={message.attachment} />
          )}
          {message.content.trim() && (
            <div className="user-bubble">{message.content}</div>
          )}
        </div>
        <div className="chat-avatar chat-avatar--user" aria-hidden>
          You
        </div>
      </div>
    )
  }

  return (
    <div className="chat-row chat-row--assistant">
      <div className="chat-avatar" aria-hidden>
        T
      </div>
      <div className="chat-body">
        {message.animate ? (
          <AnimatedMarkdown content={message.content} onReveal={onReveal} />
        ) : (
          <MarkdownContent content={message.content} />
        )}
      </div>
    </div>
  )
}

export default MessageBubble
