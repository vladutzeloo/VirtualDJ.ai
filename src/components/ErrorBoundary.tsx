import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[VirtualDJ.AI] render crash:', error, info.componentStack);
  }

  reset = () => {
    this.setState({ error: null });
  };

  reload = () => {
    if (typeof window !== 'undefined') window.location.reload();
  };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="flex h-screen w-screen items-center justify-center bg-black p-6 font-sans text-white">
        <div className="max-w-md w-full rounded-2xl border border-white/10 bg-white/[0.03] p-6 shadow-2xl">
          <div className="text-[9px] font-mono uppercase tracking-[0.3em] text-vdj-neon-cyan mb-2">
            VirtualDJ.AI · Startup Halted
          </div>
          <h1 className="text-lg font-bold mb-2">The deck failed to boot.</h1>
          <p className="text-sm text-white/70 mb-4">
            A render error stopped the app from mounting. The details below help diagnose it; the
            most common cause is corrupted localStorage from a previous session.
          </p>
          <pre className="text-[11px] font-mono text-rose-300 whitespace-pre-wrap break-words bg-black/40 border border-white/5 rounded-lg p-3 max-h-40 overflow-auto mb-4">
            {error.message || String(error)}
          </pre>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={this.reset}
              className="h-9 px-4 rounded-lg border border-white/10 hover:bg-white/5 text-xs font-mono uppercase tracking-widest"
            >
              Retry
            </button>
            <button
              onClick={this.reload}
              className="h-9 px-4 rounded-lg bg-vdj-neon-cyan text-black text-xs font-mono font-bold uppercase tracking-widest hover:opacity-90"
            >
              Reload
            </button>
            <button
              onClick={() => {
                try {
                  Object.keys(localStorage)
                    .filter(key => key.startsWith('vdj.'))
                    .forEach(key => localStorage.removeItem(key));
                } catch {
                  /* storage unavailable */
                }
                this.reload();
              }}
              className="h-9 px-4 rounded-lg border border-rose-500/40 text-rose-300 hover:bg-rose-500/10 text-xs font-mono uppercase tracking-widest"
            >
              Clear storage &amp; reload
            </button>
          </div>
        </div>
      </div>
    );
  }
}
