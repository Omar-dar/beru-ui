import React, { useCallback } from 'react'
import AmbientBackground from './components/AmbientBackground'
import ChatWindow from './components/ChatWindow'
import InputBar from './components/InputBar'
import PdfDropZone from './components/PdfDropZone'
import VoiceSessionOverlay from './components/VoiceSessionOverlay'
import VoiceEnrollModal from './components/VoiceEnrollModal'
import { useChat } from './hooks/useChat'
import { useElectronVoiceOverlay } from './hooks/useElectronVoiceOverlay'
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
    voiceUILayout,
    voiceStatusText,
    floatStatusText,
    floatOrbMode,
    browserSessionActive,
    browserUrl,
    audioLevel,
    isUserSpeaking,
    startVoiceSession,
    closeVoiceSession,
    returnToApp,
    sendUserMessage,
    clearChat,
    uploadPdf,
    rejectInvalidPdf,
    dismissSuggestedPrompts,
    authReady,
    chatUnlocked,
    voiceEnrollRequired,
    awaitingVoiceWake,
    showEnrollModal,
    setShowEnrollModal,
    refreshVoiceAuth,
  } = useChat()

  const handleEnrollComplete = useCallback(async () => {
    await refreshVoiceAuth()
    setShowEnrollModal(false)
  }, [refreshVoiceAuth, setShowEnrollModal])

  const chatLocked = authReady && !chatUnlocked
  const chatLockedHint = voiceEnrollRequired
    ? 'Enroll your voice first (header: Enroll voice).'
    : awaitingVoiceWake
      ? 'Say "Beru", "Hey Beru", or "Wake up Beru" into the mic to unlock chat.'
      : 'Use voice to unlock this session.'
  const inputPlaceholder = chatLocked
    ? 'Voice unlock required…'
    : 'Message Beru…'

  const handleOverlayCloseRequest = useCallback(() => {
    if (browserSessionActive) {
      returnToApp()
      return
    }
    if (voiceSessionOpen) {
      closeVoiceSession()
    }
  }, [browserSessionActive, returnToApp, voiceSessionOpen, closeVoiceSession])

  const electronFloat = useElectronVoiceOverlay({
    voiceSessionOpen,
    floatOrbMode,
    audioLevel,
    isUserSpeaking,
    floatStatusText,
    voiceError,
    browserSessionActive,
    browserUrl,
    onCloseRequest: handleOverlayCloseRequest,
  })

  const busy = loading || uploading || voiceProcessing
  const voiceCompanion =
    voiceSessionOpen && voiceUILayout === 'companion' && !electronFloat
  const showInAppVoiceOverlay = voiceSessionOpen && !electronFloat

  return (
    <>
      <AmbientBackground />
      <PdfDropZone
        onUpload={uploadPdf}
        onInvalidFile={rejectInvalidPdf}
        disabled={busy || voiceSessionOpen || chatLocked}
      >
        <div
          className={`app-shell${voiceCompanion ? ' app-shell--voice-companion' : ''}${browserSessionActive ? ' app-shell--browser-active' : ''}`}
        >
          <header className="app-header">
            <div className="app-header-brand">
              <div className="app-header-logo" aria-hidden>
                B
              </div>
              <div>
                <span className="app-header-title">Beru</span>
                <span className="app-header-subtitle">AI Assistant</span>
              </div>
            </div>
            <div className="app-header-actions">
              {browserSessionActive && (
                <button
                  type="button"
                  className="app-header-btn app-header-btn--accent"
                  onClick={returnToApp}
                >
                  Back to Beru
                </button>
              )}
              <button
                type="button"
                className="app-header-btn"
                onClick={() => setShowEnrollModal(true)}
                title="Enroll or update voice profile"
              >
                {voiceEnrollRequired ? 'Enroll voice' : 'Voice settings'}
              </button>
              <button type="button" className="app-header-btn" onClick={clearChat}>
                New chat
              </button>
            </div>
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
            chatLocked={chatLocked}
            chatLockedHint={chatLocked ? chatLockedHint : null}
            inputPlaceholder={inputPlaceholder}
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
          {showInAppVoiceOverlay && (
            <VoiceSessionOverlay
              open={voiceSessionOpen}
              layout={voiceUILayout}
              mode={voiceMode}
              audioLevel={audioLevel}
              isUserSpeaking={isUserSpeaking}
              statusText={voiceStatusText}
              error={voiceError}
              onClose={closeVoiceSession}
            />
          )}
        </div>
      </PdfDropZone>
      <VoiceEnrollModal
        open={showEnrollModal}
        blocking={voiceEnrollRequired}
        onComplete={() => void handleEnrollComplete()}
        onClose={voiceEnrollRequired ? undefined : () => setShowEnrollModal(false)}
      />
    </>
  )
}

export default App
