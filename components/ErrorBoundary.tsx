import React, { Component, type ErrorInfo, type ReactNode } from "react";
import { resetLayout } from "../systems/layoutManager.ts";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleResetLayout = () => {
    resetLayout();
    window.location.reload();
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-8">
          <div className="bg-gray-800 p-8 rounded-lg shadow-xl max-w-2xl w-full border border-gray-700">
            <h1 className="text-3xl font-bold text-red-500 mb-4">
              Something went wrong
            </h1>
            <p className="text-gray-300 mb-6">
              The application encountered an unexpected error. This might be due
              to a corrupted layout configuration or a network issue.
            </p>

            <div className="bg-black/50 p-4 rounded mb-6 font-mono text-sm overflow-auto max-h-48 border border-gray-600">
              <p className="text-red-400 font-bold mb-2">
                {this.state.error?.toString()}
              </p>
              <pre className="text-gray-500">
                {this.state.errorInfo?.componentStack}
              </pre>
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={this.handleReload}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white font-medium transition-colors"
              >
                Reload Application
              </button>
              <button
                type="button"
                onClick={this.handleResetLayout}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 rounded text-white font-medium transition-colors"
              >
                Reset UI Layout
              </button>
            </div>

            <p className="mt-6 text-sm text-gray-500">
              If the issue persists, please check your network connection or
              contact support.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
