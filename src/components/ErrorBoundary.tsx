import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#050505] relative overflow-hidden font-sans px-4">
          {/* Background glows */}
          <div className="absolute top-[-10%] right-[-10%] w-[400px] h-[400px] bg-red-600/10 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[300px] h-[300px] bg-orange-600/10 rounded-full blur-[80px] pointer-events-none" />

          <div className="relative z-10 text-center max-w-md w-full">
            {/* Icon */}
            <div className="w-20 h-20 rounded-[28px] bg-gradient-to-br from-red-500/20 to-orange-500/10 border border-red-500/30 flex items-center justify-center mx-auto mb-6 shadow-2xl">
              <AlertTriangle className="w-10 h-10 text-red-400" />
            </div>

            {/* Title */}
            <h1 className="text-2xl font-black text-white mb-2 tracking-tight">
              {this.props.fallbackTitle || 'Something Went Wrong'}
            </h1>

            {/* Message */}
            <p className="text-slate-400 text-sm mb-8 leading-relaxed">
              {this.props.fallbackMessage || 'An unexpected error occurred. Please refresh the page or try again.'}
            </p>

            {/* Dev error details */}
            {import.meta.env.DEV && this.state.error && (
              <details className="mb-6 text-left">
                <summary className="cursor-pointer text-xs font-medium text-red-400 mb-2">
                  Error Details (Dev Mode)
                </summary>
                <pre className="text-xs bg-red-950/50 border border-red-500/20 p-3 rounded-xl overflow-auto max-h-40 text-red-300 whitespace-pre-wrap">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-2xl text-sm hover:from-blue-500 hover:to-indigo-500 transition-all duration-300 shadow-lg shadow-blue-500/25"
              >
                <RefreshCw className="w-4 h-4" />
                Reload Page
              </button>
              <button
                onClick={this.handleRetry}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-white/5 border border-white/10 text-white font-bold rounded-2xl text-sm hover:bg-white/10 transition-all duration-300"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
