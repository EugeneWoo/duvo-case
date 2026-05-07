import { useState, useRef, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import ChatInterface from './components/ChatInterface'
import OAuthCallback from './pages/OAuthCallback'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/oauth-callback" element={<OAuthCallback />} />
        <Route
          path="/"
          element={
            <div className="h-full bg-gradient-to-br from-slate-50 to-slate-100">
              <ChatInterface />
            </div>
          }
        />
      </Routes>
    </Router>
  )
}

export default App
