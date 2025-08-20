import React, { Component, ErrorInfo, ReactNode } from 'react';
import { UploadError } from '../../types';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onRetry?: () => void;
  showRetryButton?: boolean;
  className?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class UploadErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('UploadErrorBoundary caught an error:', error, errorInfo);

    this.setState({
      error,
      errorInfo
    });

    // Call the onError callback if provided
    this.props.onError?.(error, errorInfo);

    // Report to error monitoring service (if available)
    this.reportError(error, errorInfo);
  }

  private reportError(error: Error, errorInfo: ErrorInfo) {
    // In a real application, you might want to send this to:
    // - Sentry
    // - LogRocket
    // - DataDog
    // - Your own error monitoring service

    console.error('Error reported:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    });
  }

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });

    this.props.onRetry?.();
  };

  private renderErrorDetails() {
    if (!this.state.error || !this.state.errorInfo) return null;

    return (
      <details className="mt-4">
        <summary className="text-sm text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300">
          Technical Details
        </summary>
        <div className="mt-2 p-3 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono overflow-auto max-h-40">
          <div className="text-red-600 dark:text-red-400 mb-2">
            Error: {this.state.error.message}
          </div>
          <div className="text-gray-600 dark:text-gray-400">
            {this.state.error.stack}
          </div>
          {this.state.errorInfo.componentStack && (
            <div className="text-gray-600 dark:text-gray-400 mt-2 pt-2 border-t border-gray-300 dark:border-gray-600">
              Component Stack: {this.state.errorInfo.componentStack}
            </div>
          )}
        </div>
      </details>
    );
  }

  public render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className={`rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 p-6 ${this.props.className || ''}`}>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                Upload System Error
              </h3>
              <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                <p>
                  Something went wrong with the upload system. This has been automatically reported to our team.
                </p>
              </div>

              <div className="mt-4 flex space-x-3">
                {this.props.showRetryButton && (
                  <button
                    onClick={this.handleRetry}
                    className="inline-flex items-center px-3 py-2 border border-red-300 dark:border-red-600 rounded-md text-sm font-medium text-red-800 dark:text-red-200 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                  >
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a1 1 0 011 1v4.101a4.979 4.979 0 013.732-2.018 1 1 0 110 2 2.978 2.978 0 00-1.732.732V11a1 1 0 11-2 0V5a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    Try Again
                  </button>
                )}

                <button
                  onClick={() => window.location.reload()}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  Reload Page
                </button>
              </div>

              {this.renderErrorDetails()}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default UploadErrorBoundary;
