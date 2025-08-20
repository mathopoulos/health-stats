import React, { Component, ErrorInfo, ReactNode } from 'react';
import { UploadError } from '../../types';

interface Props {
  children: ReactNode;
  onNetworkError?: (error: UploadError) => void;
  onRetry?: () => void;
  showOfflineMessage?: boolean;
  className?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  isOnline: boolean;
  retryCount: number;
}

class NetworkErrorBoundary extends Component<Props, State> {
  private retryTimeout: NodeJS.Timeout | null = null;

  public state: State = {
    hasError: false,
    error: null,
    isOnline: navigator.onLine,
    retryCount: 0
  };

  public componentDidMount() {
    // Listen for online/offline events
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
  }

  public componentWillUnmount() {
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);

    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
  }

  private handleOnline = () => {
    this.setState({ isOnline: true });
  };

  private handleOffline = () => {
    this.setState({ isOnline: false });
  };

  public static getDerivedStateFromError(error: Error): State {
    // Check if it's a network-related error
    const isNetworkError = error.message.toLowerCase().includes('fetch') ||
                          error.message.toLowerCase().includes('network') ||
                          error.message.toLowerCase().includes('connection') ||
                          error.name === 'TypeError' && error.message.includes('fetch');

    if (isNetworkError) {
      return {
        hasError: true,
        error,
        isOnline: navigator.onLine,
        retryCount: 0
      };
    }

    // Re-throw non-network errors
    throw error;
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('NetworkErrorBoundary caught a network error:', error, errorInfo);

    // Create upload error
    const uploadError: UploadError = {
      code: !navigator.onLine ? 'OFFLINE' : 'NETWORK_ERROR',
      message: !navigator.onLine ? 'You are currently offline' : 'Network connection failed',
      details: {
        originalError: error,
        isOnline: navigator.onLine,
        retryCount: this.state.retryCount,
        timestamp: new Date().toISOString()
      }
    };

    // Call the error callback
    this.props.onNetworkError?.(uploadError);

    // Auto-retry if online
    if (navigator.onLine && this.state.retryCount < 3) {
      this.retryTimeout = setTimeout(() => {
        this.setState(prev => ({ retryCount: prev.retryCount + 1 }));
        this.props.onRetry?.();
      }, 2000 * (this.state.retryCount + 1)); // Exponential backoff
    }
  }

  private handleManualRetry = () => {
    this.setState(prev => ({
      hasError: false,
      error: null,
      retryCount: 0
    }));

    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }

    this.props.onRetry?.();
  };

  private handleDismiss = () => {
    this.setState({
      hasError: false,
      error: null,
      retryCount: 0
    });
  };

  public render() {
    // Show offline message if not connected
    if (!this.state.isOnline && this.props.showOfflineMessage) {
      return (
        <div className={`rounded-lg border border-orange-200 bg-orange-50 dark:bg-orange-900/20 dark:border-orange-800 p-4 ${this.props.className || ''}`}>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-orange-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-orange-800 dark:text-orange-200">
                You're Offline
              </h3>
              <div className="mt-1 text-sm text-orange-700 dark:text-orange-300">
                Please check your internet connection and try again.
              </div>
              <div className="mt-3">
                <button
                  onClick={this.handleManualRetry}
                  className="text-sm text-orange-600 dark:text-orange-400 hover:text-orange-800 dark:hover:text-orange-200 font-medium"
                >
                  Retry Connection
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (this.state.hasError) {
      return (
        <div className={`rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800 p-4 ${this.props.className || ''}`}>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Connection Error
              </h3>
              <div className="mt-1 text-sm text-blue-700 dark:text-blue-300">
                Unable to connect to the upload service. This might be a temporary network issue.
              </div>

              <div className="mt-3 flex space-x-3">
                <button
                  onClick={this.handleManualRetry}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 font-medium"
                >
                  Try Again ({this.state.retryCount < 3 ? `Auto-retry in ${2 * (this.state.retryCount + 1)}s` : 'Manual'})
                </button>

                <button
                  onClick={this.handleDismiss}
                  className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 font-medium"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default NetworkErrorBoundary;
