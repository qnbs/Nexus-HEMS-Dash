/**
 * Error Boundary Component
 * Catches JavaScript errors in component tree and displays fallback
 */

import { Component, type ReactNode, type ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import i18next from 'i18next';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });

    // Call optional error handler
    this.props.onError?.(error, errorInfo);

    // Send to error tracking service (e.g., Sentry)
    if (import.meta.env.PROD) {
      // window.Sentry?.captureException(error, { extra: errorInfo });
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/Nexus-HEMS-Dash/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          className="flex min-h-screen items-center justify-center bg-[color:var(--color-bg)] p-4"
          role="alert"
        >
          <div className="glass-panel w-full max-w-2xl rounded-3xl p-8">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-red-500/20">
                <AlertTriangle className="h-8 w-8 text-red-400" aria-hidden="true" />
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-[color:var(--color-text)]">
                  {i18next.t('error.title')}
                </h1>
                <p className="mt-2 text-[color:var(--color-muted)]">
                  {i18next.t('error.description')}
                </p>

                {/* Error Details (only in development) */}
                {import.meta.env.DEV && this.state.error && (
                  <details className="mt-4 rounded-xl border border-red-500/30 bg-red-500/5 p-4">
                    <summary className="cursor-pointer font-mono text-sm text-red-400">
                      {i18next.t('error.details')}
                    </summary>
                    <div className="mt-3 space-y-2">
                      <div>
                        <p className="text-xs font-medium text-red-300">
                          {i18next.t('error.message')}
                        </p>
                        <p className="mt-1 font-mono text-xs text-red-400">
                          {this.state.error.message}
                        </p>
                      </div>
                      {this.state.error.stack && (
                        <div>
                          <p className="text-xs font-medium text-red-300">
                            {i18next.t('error.stack')}
                          </p>
                          <pre className="mt-1 overflow-x-auto font-mono text-xs text-red-400">
                            {this.state.error.stack}
                          </pre>
                        </div>
                      )}
                      {this.state.errorInfo?.componentStack && (
                        <div>
                          <p className="text-xs font-medium text-red-300">
                            {i18next.t('error.componentStack')}
                          </p>
                          <pre className="mt-1 overflow-x-auto font-mono text-xs text-red-400">
                            {this.state.errorInfo.componentStack}
                          </pre>
                        </div>
                      )}
                    </div>
                  </details>
                )}

                {/* Actions */}
                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    onClick={this.handleReset}
                    className="btn-primary focus-ring flex items-center gap-2"
                  >
                    <RefreshCw className="h-4 w-4" aria-hidden="true" />
                    {i18next.t('error.tryAgain')}
                  </button>
                  <button
                    onClick={this.handleReload}
                    className="btn-secondary focus-ring flex items-center gap-2"
                  >
                    <RefreshCw className="h-4 w-4" aria-hidden="true" />
                    {i18next.t('error.reload')}
                  </button>
                  <button
                    onClick={this.handleGoHome}
                    className="btn-secondary focus-ring flex items-center gap-2"
                  >
                    <Home className="h-4 w-4" aria-hidden="true" />
                    {i18next.t('error.goHome')}
                  </button>
                </div>

                {/* Additional Help */}
                <div className="mt-6 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)]/50 p-4">
                  <p className="text-sm text-[color:var(--color-muted)]">
                    <strong className="text-[color:var(--color-text)]">
                      {i18next.t('error.helpTitle')}
                    </strong>
                    <br />
                    {i18next.t('error.helpText')}{' '}
                    <a
                      href="mailto:support@nexus-hems.com"
                      className="text-[color:var(--color-primary)] underline hover:text-[color:var(--color-secondary)]"
                    >
                      support@nexus-hems.com
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
