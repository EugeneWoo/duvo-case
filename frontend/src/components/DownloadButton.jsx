import { useRef, useEffect, useState } from 'react'
import { formatChatAsMarkdown, formatChatAsPdf, formatChatAsCsv, downloadFile } from '../utils/formatters'
import { cacheMessages } from '../utils/cacheManager'

export default function DownloadButton({ messages, disabled }) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    if (messages.length > 0) {
      cacheMessages(messages)
    }
  }, [messages])

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleDownloadMd = () => {
    const markdown = formatChatAsMarkdown(messages)
    const filename = `chat-${new Date().toISOString().slice(0, 10)}.md`
    downloadFile(markdown, filename, 'text/markdown')
    setIsOpen(false)
  }

  const handleDownloadPdf = () => {
    const pdf = formatChatAsPdf(messages)
    const filename = `chat-${new Date().toISOString().slice(0, 10)}.pdf`
    pdf.save(filename)
    setIsOpen(false)
  }

  const handleDownloadCsv = () => {
    const csv = formatChatAsCsv(messages)
    const filename = `chat-${new Date().toISOString().slice(0, 10)}.csv`
    downloadFile(csv, filename, 'text/csv')
    setIsOpen(false)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled || messages.length === 0}
        className="px-4 py-2 text-sm text-slate-600 border border-slate-300 rounded-sm hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-serif"
      >
        Download
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-32 bg-white border border-slate-200 rounded-sm shadow-lg z-10 animate-slide-in">
          <button
            onClick={handleDownloadMd}
            className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 border-b border-slate-100 font-serif"
          >
            Markdown (.md)
          </button>
          <button
            onClick={handleDownloadCsv}
            className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 border-b border-slate-100 font-serif"
          >
            CSV (.csv)
          </button>
          <button
            onClick={handleDownloadPdf}
            className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 font-serif"
          >
            PDF (.pdf)
          </button>
        </div>
      )}
    </div>
  )
}
