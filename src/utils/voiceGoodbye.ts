const GOODBYE_PHRASES = [
  'goodbye',
  'good bye',
  'bye bye',
  'bye',
  'see you',
  'see ya',
  "that's all",
  'thats all',
  'talk later',
  'hej då',
  'hejdå',
  'adjö',
  'vi ses',
  'مع السلامة',
  'وداعا',
  'إلى اللقاء',
]

/** True when the user is clearly ending the voice session */
export const isGoodbyeMessage = (text: string): boolean => {
  const normalized = text.trim().toLowerCase().replace(/[.!?,]+$/g, '')
  if (!normalized) return false

  if (GOODBYE_PHRASES.some(phrase => normalized === phrase)) {
    return true
  }

  return GOODBYE_PHRASES.some(
    phrase =>
      normalized.startsWith(`${phrase} `) ||
      normalized.endsWith(` ${phrase}`) ||
      normalized.includes(` ${phrase} `)
  )
}
