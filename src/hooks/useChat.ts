import { useState, useCallback, useEffect } from 'react'
import { Message } from '../types'
import { sendMessage, startChat } from '../services/api'

export const useChat = () => {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load greeting on start
  useEffect(() => {
    const init = async () => {
      try {
        const response = await startChat()
        setMessages([{
          id: '0',
          role: 'tild',
          content: response.response,
          timestamp: new Date(),
          language: response.language
        }])
      } catch {
        setMessages([{
          id: '0',
          role: 'tild',
          content: 'Hey! I am Tild. Who am I talking to?',
          timestamp: new Date()
        }])
      }
    }
    init()
  }, [])

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
      const response = await sendMessage(content)
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

  const clearChat = useCallback(async () => {
    try {
      const response = await startChat()
      setMessages([{
        id: '0',
        role: 'tild',
        content: response.response,
        timestamp: new Date()
      }])
    } catch {
      setMessages([{
        id: '0',
        role: 'tild',
        content: 'Hey! I am Tild. Who am I talking to?',
        timestamp: new Date()
      }])
    }
  }, [])

  return { messages, loading, error, sendUserMessage, clearChat }
}