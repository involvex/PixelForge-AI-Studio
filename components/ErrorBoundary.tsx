import React, { Component, ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error("ErrorBoundary caught error:", error, errorInfo);
    this.setState({
      hasError: true,
      error,
      errorInfo,
    });
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center h-full p-4 text-red-400 bg-gray-900 border border-red-500/30 rounded-lg">
          <h2 className="text-lg font-bold mb-2">Something went wrong</h2>
          <p className="text-sm mb-2">The application encountered an error.</p>
          <details className="text-xs text-gray-400 mt-2">
            <summary>Technical Details</summary>
            <div className="mt-2 p-2 bg-gray-800 rounded">
              <p>
                <strong>Error:</strong> {this.state.error?.message}
              </p>
              {this.state.error?.stack && (
                <pre className="text-xs overflow-auto max-h-32 mt-1">
                  {this.state.error.stack}
                </pre>
              )}
            </div>
          </details>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-sm"
          >
            Reload Application
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
