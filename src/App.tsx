import React from 'react'
import ChatWindow from './components/ChatWindow'
import InputBar from './components/InputBar'
import PdfDropZone from './components/PdfDropZone'
import VoiceSessionOverlay from './components/VoiceSessionOverlay'
import { useChat } from './hooks/useChat'
import './styles/chat.css'

const App: React.FC = () => {
  const {
    messages,
    loading,
    uploading,
    voiceProcessing,
    error,
    uploadError,
    voiceError,
    activeDocument,
    showSuggestedPrompts,
    suggestedPrompts,
    voiceDisabledHint,
    voiceSessionOpen,
    voiceMode,
    voiceStatusText,
    audioLevel,
    isUserSpeaking,
    startVoiceSession,
    closeVoiceSession,
    sendUserMessage,
    clearChat,
    uploadPdf,
    rejectInvalidPdf,
    dismissSuggestedPrompts,
  } = useChat()

  const busy = loading || uploading || voiceProcessing

  return (
    <PdfDropZone
      onUpload={uploadPdf}
      onInvalidFile={rejectInvalidPdf}
      disabled={busy || voiceSessionOpen}
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
        <ChatWindow
          messages={messages}
          loading={loading}
          voiceProcessing={voiceProcessing}
          voiceSessionOpen={voiceSessionOpen}
          error={error}
        />
        <InputBar
          onSend={sendUserMessage}
          onUpload={uploadPdf}
          onSuggestedPrompt={sendUserMessage}
          onDismissSuggested={dismissSuggestedPrompts}
          onVoiceClick={startVoiceSession}
          loading={loading}
          uploading={uploading}
          voiceProcessing={voiceProcessing}
          voiceDisabledHint={voiceDisabledHint}
          voiceSessionOpen={voiceSessionOpen}
          uploadError={uploadError}
          voiceError={voiceError}
          suggestedPrompts={suggestedPrompts}
          showSuggestedPrompts={showSuggestedPrompts && !!activeDocument}
        />
        <VoiceSessionOverlay
          open={voiceSessionOpen}
          mode={voiceMode}
          audioLevel={audioLevel}
          isUserSpeaking={isUserSpeaking}
          statusText={voiceStatusText}
          error={voiceError}
          onClose={closeVoiceSession}
        />
      </div>
    </PdfDropZone>
  )
}

export default App
