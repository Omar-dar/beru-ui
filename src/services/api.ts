import axios from 'axios'
import { ChatResponse } from '../types'

const API_URL = 'http://localhost:8000'

export const sendMessage = async (message: string): Promise<ChatResponse> => {
  const response = await axios.post(`${API_URL}/chat`, { message })
  return response.data
}

export const startChat = async (): Promise<ChatResponse> => {
  const response = await axios.get(`${API_URL}/start`)
  return response.data
}