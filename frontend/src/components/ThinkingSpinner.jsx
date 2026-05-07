export default function ThinkingSpinner() {
  return (
    <div className="flex gap-3 animate-slide-in">
      <div className="bg-slate-100 border border-slate-200 rounded-sm px-4 py-3 flex items-center gap-2">
        <div className="flex gap-1">
          <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse-glow" style={{ animationDelay: '0s' }} />
          <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse-glow" style={{ animationDelay: '0.2s' }} />
          <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse-glow" style={{ animationDelay: '0.4s' }} />
        </div>
        <span className="text-sm text-slate-500 font-serif">Thinking...</span>
      </div>
    </div>
  )
}
