const RTL_LANGS = new Set(['ar', 'he', 'fa', 'ur', 'yi'])

/** Legacy API injected these; strip so they are not shown as ⁧ ⁩ in the UI */
const BIDI_CONTROLS = /[\u200E\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/g

export const stripBidiControls = (text: string): string =>
  text.replace(BIDI_CONTROLS, '')

/** Arabic + Arabic supplement blocks */
const ARABIC_SCRIPT = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/

export const containsArabicScript = (text: string): boolean =>
  ARABIC_SCRIPT.test(text)

export const isRtlLanguage = (language?: string | null): boolean => {
  if (!language) return false
  const code = language.toLowerCase().split('-')[0]
  return RTL_LANGS.has(code)
}

/** Prefer API text_direction, then language, then Arabic script in the body */
export const getMessageDirection = (
  content: string,
  language?: string | null,
  textDirection?: 'ltr' | 'rtl' | null
): 'rtl' | 'ltr' => {
  if (textDirection === 'rtl' || textDirection === 'ltr') return textDirection
  if (isRtlLanguage(language)) return 'rtl'
  if (containsArabicScript(content)) return 'rtl'
  return 'ltr'
}

export const getMessageLang = (
  content: string,
  language?: string | null
): string | undefined => {
  if (language) return language.split('-')[0]
  if (containsArabicScript(content)) return 'ar'
  return undefined
}
