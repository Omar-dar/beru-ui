import React from 'react'
import ChatWindow from './components/ChatWindow'
import InputBar from './components/InputBar'
import PdfDropZone from './components/PdfDropZone'
import { useChat } from './hooks/useChat'
import './styles/chat.css'

const App: React.FC = () => {
  const {
    messages,
    loading,
    uploading,
    error,
    uploadError,
    activeDocument,
    showSuggestedPrompts,
    suggestedPrompts,
    sendUserMessage,
    clearChat,
    uploadPdf,
    rejectInvalidPdf,
    dismissSuggestedPrompts,
  } = useChat()

  const busy = loading || uploading

  return (
    <PdfDropZone
      onUpload={uploadPdf}
      onInvalidFile={rejectInvalidPdf}
      disabled={busy}
    >
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header-brand">
          <div className="app-header-logo" aria-hidden>
            T
          </div>
          <span className="app-header-title">Tild</span>
        </div>
        <button type="button" className="app-header-btn" onClick={clearChat}>
          New chat
        </button>
      </header>
      <ChatWindow messages={messages} loading={loading} error={error} />
      <InputBar
        onSend={sendUserMessage}
        onUpload={uploadPdf}
        onSuggestedPrompt={sendUserMessage}
        onDismissSuggested={dismissSuggestedPrompts}
        loading={loading}
        uploading={uploading}
        uploadError={uploadError}
        suggestedPrompts={suggestedPrompts}
        showSuggestedPrompts={showSuggestedPrompts && !!activeDocument}
      />
    </div>
    </PdfDropZone>
  )
}

export default App
