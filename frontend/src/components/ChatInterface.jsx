import { useState, useRef, useEffect } from 'react'
import ChatMessage from './ChatMessage'
import ChatInput from './ChatInput'
import ThinkingSpinner from './ThinkingSpinner'
import DownloadButton from './DownloadButton'

export default function ChatInterface() {
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    const CACHE_DURATION = 60 * 60 * 1000 // 1 hour
    const timer = setTimeout(() => {
      window.location.reload()
    }, CACHE_DURATION)

    return () => clearTimeout(timer)
  }, [])

  const handleSendMessage = async (text) => {
    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: text,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()

      const assistantMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: data.response,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (err) {
      setError('Our friendly AI agent is feeling out of sorts. Please try again later.')
      console.error('Chat error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="border-b border-slate-200 px-8 py-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-light tracking-tight text-slate-900">Duvo Agent</h1>
          <p className="text-slate-500 text-sm mt-1 font-serif">Lightweight AI chat interface</p>
        </div>
        <DownloadButton messages={messages} disabled={isLoading} />
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
        {messages.length === 0 && !isLoading && (
          <div className="h-full flex items-center justify-center">
            <div className="text-center max-w-md">
              <p className="text-slate-400 text-2xl leading-relaxed">
                Start a conversation. I'll help you with whatever you need.
              </p>
            </div>
          </div>
        )}

        {messages.map((msg, idx) => (
          <ChatMessage
            key={msg.id}
            message={msg}
            isLatest={idx === messages.length - 1}
          />
        ))}

        {isLoading && <ThinkingSpinner />}

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-4 animate-slide-in">
            <p className="text-red-700 text-lg font-serif">{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-red-600 hover:text-red-700 text-sm mt-2 underline"
            >
              Dismiss
            </button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Footer */}
      <div className="border-t border-slate-200 px-8 py-6 bg-white">
        <ChatInput
          onSubmit={handleSendMessage}
          disabled={isLoading}
        />
      </div>
    </div>
  )
}
