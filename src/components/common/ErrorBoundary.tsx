import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * A render crash anywhere in the tree — or a stale lazy-loaded chunk 404ing after a
 * new deploy, the most common real-world trigger — used to leave the visitor staring
 * at a blank white page with no way forward except knowing to hit refresh themselves.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo) {
    console.error('Unhandled render error:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center gap-4 p-6 bg-[#fbfbfd] dark:bg-[#000000] text-slate-900 dark:text-zinc-100 text-center">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/25 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-rose-500" />
          </div>
          <div className="space-y-1 max-w-sm">
            <p className="text-sm font-semibold">Что-то пошло не так</p>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Попробуйте перезагрузить страницу. Если это повторится — сообщите нам.
            </p>
          </div>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="h-10 px-5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors"
          >
            Перезагрузить
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
