import React from 'react';
import { AlertTriangle, RotateCw } from 'lucide-react';
import { isChunkLoadError, reloadForNewVersion } from '../lib/chunkReload';

interface Props {
  /** Changing this (e.g. the route path) clears a previous error. */
  resetKey: string;
  children: React.ReactNode;
}

interface State {
  error: Error | null;
  reloading: boolean;
}

/**
 * Catches errors from route pages so one broken page doesn't unmount the whole app (which left users on a
 * black screen). Stale lazy chunks after a deploy trigger a one-time reload to the new version.
 */
export class RouteErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null, reloading: false };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    if (isChunkLoadError(error) && reloadForNewVersion()) {
      this.setState({ reloading: true });
      return;
    }
    console.error('[RouteErrorBoundary]', error, info.componentStack);
  }

  componentDidUpdate(prev: Props) {
    if (prev.resetKey !== this.props.resetKey && this.state.error) {
      this.setState({ error: null, reloading: false });
    }
  }

  render() {
    const { error, reloading } = this.state;
    if (!error) return this.props.children;

    const stale = isChunkLoadError(error);
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center" role="alert">
        {reloading ? (
          <RotateCw className="w-10 h-10 mx-auto mb-4 text-eva-secondary animate-spin" aria-hidden="true" />
        ) : (
          <AlertTriangle className="w-10 h-10 mx-auto mb-4 text-eva-secondary" aria-hidden="true" />
        )}
        <h1 className="text-xl font-bold mb-2">
          {reloading ? '网站刚刚更新，正在加载新版本…' : stale ? '网站已更新，请刷新页面' : '页面出了点问题'}
        </h1>
        {!reloading && (
          <>
            <p className="text-gray-400 mb-6 text-sm">
              {stale ? 'Site updated — please reload. / サイトが更新されました。再読み込みしてください。' : 'Something went wrong on this page.'}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-eva-secondary text-eva-bg font-bold hover:bg-eva-secondary/90"
            >
              <RotateCw className="w-4 h-4" aria-hidden="true" />
              刷新 / Reload
            </button>
          </>
        )}
      </div>
    );
  }
}
