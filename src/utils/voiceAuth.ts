import { ChatResponse, VoiceAuthState, VoiceAuthStatus } from '../types'

export const defaultVoiceAuthState = (): VoiceAuthState => ({
  voiceAuthEnabled: false,
  voiceEnrolled: true,
  awaitingVoiceWake: false,
  sessionIdentified: true,
  isOwner: true,
  voiceVerified: false,
})

type AuthFields = Partial<
  Pick<
    ChatResponse,
    | 'session_identified'
    | 'is_owner'
    | 'awaiting_voice_wake'
    | 'voice_enrolled'
    | 'voice_verified'
  >
> &
  Partial<Pick<VoiceAuthStatus, 'voice_auth_enabled'>>

export const mergeVoiceAuth = (
  prev: VoiceAuthState,
  fields: AuthFields
): VoiceAuthState => ({
  voiceAuthEnabled:
    fields.voice_auth_enabled !== undefined
      ? fields.voice_auth_enabled
      : prev.voiceAuthEnabled,
  voiceEnrolled:
    fields.voice_enrolled !== undefined ? fields.voice_enrolled : prev.voiceEnrolled,
  awaitingVoiceWake:
    fields.awaiting_voice_wake !== undefined
      ? fields.awaiting_voice_wake
      : prev.awaitingVoiceWake,
  sessionIdentified:
    fields.session_identified !== undefined
      ? fields.session_identified
      : prev.sessionIdentified,
  isOwner: fields.is_owner !== undefined ? fields.is_owner : prev.isOwner,
  voiceVerified:
    fields.voice_verified !== undefined ? fields.voice_verified : prev.voiceVerified,
})

export const authFromStatus = (status: VoiceAuthStatus): VoiceAuthState => ({
  voiceAuthEnabled: status.voice_auth_enabled ?? true,
  voiceEnrolled: status.voice_enrolled ?? false,
  awaitingVoiceWake: status.awaiting_voice_wake ?? false,
  sessionIdentified: status.session_identified ?? false,
  isOwner: status.is_owner ?? false,
  voiceVerified: status.voice_verified ?? false,
})

export const isChatUnlocked = (auth: VoiceAuthState): boolean =>
  !auth.voiceAuthEnabled || (auth.sessionIdentified && auth.isOwner)

export const needsVoiceEnroll = (auth: VoiceAuthState): boolean =>
  auth.voiceAuthEnabled && !auth.voiceEnrolled

export const needsVoiceWake = (auth: VoiceAuthState): boolean =>
  auth.voiceAuthEnabled && auth.voiceEnrolled && auth.awaitingVoiceWake

export const detectVoiceAuthFromStart = (start: ChatResponse): boolean =>
  start.awaiting_voice_wake !== undefined ||
  start.voice_enrolled !== undefined ||
  start.session_identified === false
