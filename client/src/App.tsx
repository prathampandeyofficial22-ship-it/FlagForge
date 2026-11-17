export default function App() {
  return (
    <div className="min-h-screen bg-surface-950 text-zinc-100 flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full bg-surface-900 border border-border-dark p-8 rounded-lg shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded bg-brand-600 flex items-center justify-center font-bold text-white text-sm">
            FF
          </div>
          <div>
            <h1 className="text-lg font-semibold text-zinc-100">FlagForge</h1>
            <p className="text-xs text-zinc-400">Feature Flag & Release Management Platform</p>
          </div>
        </div>
        <p className="text-sm text-zinc-300 mb-6">
          System initialized. Phase 1 architecture and foundation ready.
        </p>
        <div className="flex items-center justify-between text-xs text-zinc-500 border-t border-border-dark pt-4">
          <span>Server: localhost:4000</span>
          <span className="text-emerald-400 font-mono">● Online</span>
        </div>
      </div>
    </div>
  );
}
