const SESSION_KEY = 'tild_session_id'

export function getTildSessionId(): string {
  let id = localStorage.getItem(SESSION_KEY)
  if (!id) {
    id =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `sess-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
    localStorage.setItem(SESSION_KEY, id)
  }
  return id
}
