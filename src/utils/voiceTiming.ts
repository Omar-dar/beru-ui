import { VoiceTimingMs } from '../types'

/** Log server pipeline timing when BERU_DEBUG_TIMING=1 on the API */
export const logVoiceTiming = (timing?: VoiceTimingMs): void => {
  if (!timing) return
  console.info(
    `[Beru voice] stt ${timing.stt}ms, chat ${timing.chat}ms, total ${timing.total}ms`
  )
}
