import React, { Component, ErrorInfo, ReactNode } from 'react';
import { UploadError } from '../../types';

interface Props {
  children: ReactNode;
  onFileError?: (error: UploadError) => void;
  maxFileSize?: number;
  allowedTypes?: string[];
  className?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorType: 'file_size' | 'file_type' | 'corruption' | 'unknown';
}

class FileErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorType: 'unknown'
  };

  public static getDerivedStateFromError(error: Error): State {
    // Determine error type based on error message
    let errorType: State['errorType'] = 'unknown';

    const message = error.message.toLowerCase();
    if (message.includes('size') || message.includes('large')) {
      errorType = 'file_size';
    } else if (message.includes('type') || message.includes('format')) {
      errorType = 'file_type';
    } else if (message.includes('corrupt') || message.includes('invalid')) {
      errorType = 'corruption';
    }

    return {
      hasError: true,
      error,
      errorType
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('FileErrorBoundary caught an error:', error, errorInfo);

    // Create upload error
    const uploadError: UploadError = {
      code: this.state.errorType === 'file_size' ? 'FILE_TOO_LARGE' :
            this.state.errorType === 'file_type' ? 'INVALID_FILE_TYPE' : 'UPLOAD_FAILED',
      message: error.message,
      details: {
        errorType: this.state.errorType,
        originalError: error,
        componentStack: errorInfo.componentStack
      }
    };

    // Call the error callback
    this.props.onFileError?.(uploadError);
  }

  private getErrorMessage(): string {
    switch (this.state.errorType) {
      case 'file_size':
        return `The file is too large. Maximum size allowed is ${Math.round((this.props.maxFileSize || 95 * 1024 * 1024) / 1024 / 1024)}MB.`;
      case 'file_type':
        return `Invalid file type. Allowed types: ${this.props.allowedTypes?.join(', ') || 'various'}.`;
      case 'corruption':
        return 'The file appears to be corrupted or invalid.';
      default:
        return 'An error occurred while processing the file.';
    }
  }

  private getErrorIcon(): string {
    switch (this.state.errorType) {
      case 'file_size':
        return '📦';
      case 'file_type':
        return '📄';
      case 'corruption':
        return '⚠️';
      default:
        return '❌';
    }
  }

  private handleDismiss = () => {
    this.setState({
      hasError: false,
      error: null,
      errorType: 'unknown'
    });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className={`rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 p-4 ${this.props.className || ''}`}>
          <div className="flex items-center">
            <div className="flex-shrink-0 text-2xl">
              {this.getErrorIcon()}
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                File Processing Error
              </h3>
              <div className="mt-1 text-sm text-red-700 dark:text-red-300">
                {this.getErrorMessage()}
              </div>

              <div className="mt-3">
                <button
                  onClick={this.handleDismiss}
                  className="text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 font-medium"
                >
                  Try a different file
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

export default FileErrorBoundary;
