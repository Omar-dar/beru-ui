import React from 'react'
import { MessageAttachment } from '../types'

interface Props {
  attachment: MessageAttachment
}

const ChatDocumentCard: React.FC<Props> = ({ attachment }) => {
  const meta =
    attachment.page_count != null && attachment.chunk_count != null
      ? `${attachment.page_count} page${attachment.page_count === 1 ? '' : 's'} · ${attachment.chunk_count} sections indexed`
      : null

  return (
    <div className="chat-document-card" title={attachment.filename}>
      <div className="chat-document-card-icon" aria-hidden>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
          <path d="M14 2v6h6M8 13h8M8 17h5" />
        </svg>
      </div>
      <div className="chat-document-card-text">
        <span className="chat-document-card-name">{attachment.filename}</span>
        {meta && <span className="chat-document-card-meta">{meta}</span>}
      </div>
    </div>
  )
}

export default ChatDocumentCard
