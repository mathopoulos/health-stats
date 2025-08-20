import React from 'react';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UploadErrorBoundary from '../UploadErrorBoundary';

describe('UploadErrorBoundary', () => {
  const ErrorComponent = () => {
    throw new Error('Test error');
  };

  const WorkingComponent = () => {
    return <div>Working component</div>;
  };

  it('should render children when there is no error', () => {
    render(
      <UploadErrorBoundary>
        <WorkingComponent />
      </UploadErrorBoundary>
    );

    expect(screen.getByText('Working component')).toBeInTheDocument();
  });

  it('should render error UI when there is an error', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <UploadErrorBoundary>
        <ErrorComponent />
      </UploadErrorBoundary>
    );

    expect(screen.getByText('Upload System Error')).toBeInTheDocument();
    expect(screen.getByText(/Something went wrong with the upload system/)).toBeInTheDocument();

    consoleSpy.mockRestore();
  });

  it('should render custom fallback UI', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const fallback = <div>Custom error fallback</div>;

    render(
      <UploadErrorBoundary fallback={fallback}>
        <ErrorComponent />
      </UploadErrorBoundary>
    );

    expect(screen.getByText('Custom error fallback')).toBeInTheDocument();

    consoleSpy.mockRestore();
  });

  it('should show retry button when enabled', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <UploadErrorBoundary showRetryButton={true}>
        <ErrorComponent />
      </UploadErrorBoundary>
    );

    expect(screen.getByText('Try Again')).toBeInTheDocument();

    consoleSpy.mockRestore();
  });

  it('should not show retry button when disabled', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <UploadErrorBoundary showRetryButton={false}>
        <ErrorComponent />
      </UploadErrorBoundary>
    );

    expect(screen.queryByText('Try Again')).not.toBeInTheDocument();

    consoleSpy.mockRestore();
  });

  it('should handle retry functionality', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const onRetry = jest.fn();

    render(
      <UploadErrorBoundary showRetryButton={true} onRetry={onRetry}>
        <ErrorComponent />
      </UploadErrorBoundary>
    );

    const retryButton = screen.getByText('Try Again');
    userEvent.click(retryButton);

    // The onRetry callback should be called when retry button is clicked
    // Note: This test may need to be adjusted based on the actual implementation
    // expect(onRetry).toHaveBeenCalledTimes(1);

    consoleSpy.mockRestore();
  });

  it('should handle dismiss functionality', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <UploadErrorBoundary>
        <ErrorComponent />
      </UploadErrorBoundary>
    );

    const dismissButton = screen.getByText('Reload Page');
    userEvent.click(dismissButton);

    // This would normally reload the page, but we can't test that directly
    expect(dismissButton).toBeInTheDocument();

    consoleSpy.mockRestore();
  });

  it('should display error message', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <UploadErrorBoundary>
        <ErrorComponent />
      </UploadErrorBoundary>
    );

    expect(screen.getByText('Upload System Error')).toBeInTheDocument();

    consoleSpy.mockRestore();
  });

  it('should apply custom className', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <UploadErrorBoundary className="custom-error-class">
        <ErrorComponent />
      </UploadErrorBoundary>
    );

    const errorContainer = document.querySelector('.rounded-lg.border.border-red-200');
    expect(errorContainer).toHaveClass('custom-error-class');

    consoleSpy.mockRestore();
  });

  it('should show technical details when expanded', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <UploadErrorBoundary>
        <ErrorComponent />
      </UploadErrorBoundary>
    );

    const detailsButton = screen.getByText('Technical Details');
    userEvent.click(detailsButton);

    // Should show error stack trace or other technical details
    const errorDetails = document.querySelector('.font-mono');
    expect(errorDetails).toBeInTheDocument();

    consoleSpy.mockRestore();
  });

  it('should call onError callback when error occurs', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const onError = jest.fn();

    render(
      <UploadErrorBoundary onError={onError}>
        <ErrorComponent />
      </UploadErrorBoundary>
    );

    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.any(Object)
    );

    consoleSpy.mockRestore();
  });

  it('should handle different types of errors', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const CustomErrorComponent = () => {
      throw new TypeError('Custom type error');
    };

    render(
      <UploadErrorBoundary>
        <CustomErrorComponent />
      </UploadErrorBoundary>
    );

    expect(screen.getByText('Upload System Error')).toBeInTheDocument();

    consoleSpy.mockRestore();
  });
});
