import { useState } from 'react'

export default function ChatInput({ onSubmit, disabled }) {
  const [input, setInput] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (input.trim()) {
      onSubmit(input)
      setInput('')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        disabled={disabled}
        placeholder="Ask me anything..."
        className="flex-1 px-4 py-3 bg-slate-50 border border-slate-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed font-serif text-lg"
      />
      <button
        type="submit"
        disabled={disabled || !input.trim()}
        className="px-6 py-3 bg-amber-500 text-white rounded-sm hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-serif text-lg font-medium"
      >
        Send
      </button>
    </form>
  )
}
