import { useState, useRef, useEffect } from 'react'
import ChatInterface from './components/ChatInterface'

function App() {
  return (
    <div className="h-full bg-gradient-to-br from-slate-50 to-slate-100">
      <ChatInterface />
    </div>
  )
}

export default App
