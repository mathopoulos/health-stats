import React from 'react';
import { render, screen } from '@testing-library/react';
import UploadProgressIndicator from '../UploadProgressIndicator';
import { UploadProgress } from '../../types';

describe('UploadProgressIndicator', () => {
  const mockProgress: UploadProgress = {
    loaded: 512000, // 512KB
    total: 1024000, // 1MB
    percentage: 50
  };

  const mockFile = {
    id: 'test-file-1',
    name: 'test-file.txt',
    size: 1024000,
    type: 'text/plain',
    progress: 50,
    status: 'uploading' as const
  };

  it('should render progress bar correctly', () => {
    render(
      <UploadProgressIndicator progress={mockProgress} />
    );

    // Check that the progress bar div exists and has correct width
    const progressBar = document.querySelector('[style*="width: 50%"]');
    expect(progressBar).toBeInTheDocument();
  });

  it('should display file information when provided', () => {
    render(
      <UploadProgressIndicator
        progress={mockProgress}
        file={mockFile as any}
        showFileName={true}
      />
    );

    expect(screen.getByText('test-file.txt')).toBeInTheDocument();
    expect(screen.getByText('500 KB / 1000 KB')).toBeInTheDocument();
  });

  it('should show percentage when enabled', () => {
    render(
      <UploadProgressIndicator
        progress={mockProgress}
        showPercentage={true}
      />
    );

    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('should hide percentage when disabled', () => {
    render(
      <UploadProgressIndicator
        progress={mockProgress}
        showPercentage={false}
      />
    );

    expect(screen.queryByText('50%')).not.toBeInTheDocument();
  });

  it('should hide file name when disabled', () => {
    render(
      <UploadProgressIndicator
        progress={mockProgress}
        file={mockFile as any}
        showFileName={false}
      />
    );

    expect(screen.queryByText('test-file.txt')).not.toBeInTheDocument();
  });

  it('should display correct status icons', () => {
    // Test uploading state
    render(
      <UploadProgressIndicator
        progress={{ loaded: 50, total: 100, percentage: 50 }}
      />
    );

    // Should show spinning icon for uploading
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('should handle completed progress', () => {
    const completedProgress: UploadProgress = {
      loaded: 1024000,
      total: 1024000,
      percentage: 100
    };

    render(
      <UploadProgressIndicator progress={completedProgress} />
    );

    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('should handle zero progress', () => {
    const zeroProgress: UploadProgress = {
      loaded: 0,
      total: 1024000,
      percentage: 0
    };

    render(
      <UploadProgressIndicator progress={zeroProgress} />
    );

    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('should apply different sizes correctly', () => {
    render(
      <UploadProgressIndicator
        progress={mockProgress}
        size="sm"
      />
    );

    // Check for size-specific classes
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    render(
      <UploadProgressIndicator
        progress={mockProgress}
        className="custom-class"
      />
    );

    const container = document.querySelector('.space-y-2');
    expect(container).toHaveClass('custom-class');
  });

  it('should format file sizes correctly', () => {
    const largeProgress: UploadProgress = {
      loaded: 5 * 1024 * 1024, // 5MB
      total: 10 * 1024 * 1024, // 10MB
      percentage: 50
    };

    render(
      <UploadProgressIndicator
        progress={largeProgress}
        file={{
          id: 'large-file',
          name: 'large-file.txt',
          size: 10 * 1024 * 1024,
          type: 'text/plain',
          progress: 50,
          status: 'uploading'
        } as any}
      />
    );

    expect(screen.getByText('5 MB / 10 MB')).toBeInTheDocument();
  });

  it('should handle edge case file sizes', () => {
    const tinyProgress: UploadProgress = {
      loaded: 500,
      total: 1000,
      percentage: 50
    };

    render(
      <UploadProgressIndicator
        progress={tinyProgress}
        file={{
          id: 'tiny-file',
          name: 'tiny.txt',
          size: 1000,
          type: 'text/plain',
          progress: 50,
          status: 'uploading'
        } as any}
      />
    );

    expect(screen.getByText('500 B / 1000 B')).toBeInTheDocument();
  });
});
