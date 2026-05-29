export interface Message {
    id: string
    role: 'user' | 'tild'
    content: string
    timestamp: Date
    language?: string
  }
  
  export interface ChatResponse {
    response: string
    language: string
  }