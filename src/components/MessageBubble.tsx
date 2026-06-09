import React from 'react'
import { Message } from '../types'
import MarkdownContent from './MarkdownContent'
import AnimatedMarkdown from './AnimatedMarkdown'
import ChatDocumentCard from './ChatDocumentCard'
import {
  getMessageDirection,
  getMessageLang,
  stripBidiControls,
} from '../utils/textDirection'

interface Props {
  message: Message
  onReveal?: () => void
}

const MessageBubble: React.FC<Props> = ({ message, onReveal }) => {
  const isUser = message.role === 'user'
  const content = stripBidiControls(message.content)
  const dir = getMessageDirection(content, message.language, message.text_direction)
  const lang = getMessageLang(content, message.language)

  if (isUser) {
    return (
      <div className="chat-row chat-row--user">
        <div className="chat-body chat-body--user">
          {message.attachment && (
            <ChatDocumentCard attachment={message.attachment} />
          )}
          {content.trim() && (
            <div className="user-bubble" dir={dir} lang={lang}>
              {content}
            </div>
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
        B
      </div>
      <div className="chat-body">
        <div className="assistant-panel">
          {message.browser_url && (
            <a
              className="chat-browser-link"
              href={message.browser_url}
              target="_blank"
              rel="noopener noreferrer"
            >
              Opened: {message.browser_url.replace(/^https?:\/\//, '').slice(0, 60)}
              {message.browser_url.length > 68 ? '…' : ''}
            </a>
          )}
          {message.animate ? (
            <AnimatedMarkdown
              content={content}
              language={message.language}
              textDirection={message.text_direction}
              onReveal={onReveal}
            />
          ) : (
            <MarkdownContent
              content={content}
              language={message.language}
              textDirection={message.text_direction}
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default MessageBubble
