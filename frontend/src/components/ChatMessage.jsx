export default function ChatMessage({ message, isLatest }) {
  const isUser = message.role === 'user'
  const isHtml = !isUser && (message.content.includes('<h3>') || message.content.includes('<p>'))

  return (
    <div
      className={`flex gap-3 animate-slide-in ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={`max-w-2xl px-5 py-4 rounded-sm ${
          isUser
            ? 'bg-amber-500 text-white'
            : 'bg-slate-100 text-slate-900 border border-slate-200'
        }`}
      >
        {isHtml ? (
          <div
            className="text-lg leading-relaxed font-serif prose prose-sm"
            dangerouslySetInnerHTML={{ __html: message.content }}
            style={{
              color: isUser ? 'white' : 'inherit'
            }}
          />
        ) : (
          <p className="text-lg leading-relaxed font-serif">{message.content}</p>
        )}
        <time className={`text-sm mt-2 block opacity-60 ${
          isUser ? 'text-amber-100' : 'text-slate-500'
        }`}>
          {message.timestamp.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </time>
      </div>
    </div>
  )
}
