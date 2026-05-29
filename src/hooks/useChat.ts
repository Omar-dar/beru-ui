import { useState, useCallback } from 'react'
import { Message, ChatResponse } from '../types'
import { sendMessage } from '../services/api'

export const useChat = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'tild',
      content: 'Hej! Jag är Tild. Hur kan jag hjälpa dig idag?',
      timestamp: new Date(),
      language: 'sv'
    }
  ])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sendUserMessage = useCallback(async (content: string) => {
    if (!content.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setLoading(true)
    setError(null)

    try {
      const response: ChatResponse = await sendMessage(content)
      const tildMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'tild',
        content: response.response,
        timestamp: new Date(),
        language: response.language
      }
      setMessages(prev => [...prev, tildMessage])
    } catch (err) {
      setError('Could not connect to Tild. Make sure the server is running!')
    } finally {
      setLoading(false)
    }
  }, [])

  const clearChat = useCallback(() => {
    setMessages([{
      id: '0',
      role: 'tild',
      content: 'Hej! Jag är Tild. Hur kan jag hjälpa dig idag?',
      timestamp: new Date(),
      language: 'sv'
    }])
  }, [])

  return { messages, loading, error, sendUserMessage, clearChat }
}