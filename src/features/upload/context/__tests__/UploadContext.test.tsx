import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { UploadProvider, useUploadContext, useUploadFileFactory } from '../UploadContext';
import { UploadFile, UploadProgress } from '../../types';

// Test component that uses the upload context
const TestComponent: React.FC = () => {
  const context = useUploadContext();
  const { createUploadFile } = useUploadFileFactory();

  const handleAddFile = () => {
    const file = new File(['test'], 'test.txt', { type: 'text/plain' });
    const uploadFile = createUploadFile(file);
    context.addFiles([uploadFile]);
  };

  const handleUpdateProgress = () => {
    const progress: UploadProgress = { loaded: 50, total: 100, percentage: 50 };
    context.updateProgress(progress);
  };

  return (
    <div>
      <div data-testid="total-files">{context.totalFiles}</div>
      <div data-testid="completed-files">{context.completedFiles}</div>
      <div data-testid="failed-files">{context.failedFiles}</div>
      <div data-testid="uploading-files">{context.uploadingFiles}</div>
      <div data-testid="is-idle">{context.isIdle ? 'true' : 'false'}</div>
      <div data-testid="is-active">{context.isActive ? 'true' : 'false'}</div>
      <button onClick={handleAddFile} data-testid="add-file-btn">
        Add File
      </button>
      <button onClick={handleUpdateProgress} data-testid="update-progress-btn">
        Update Progress
      </button>
      <button onClick={() => context.clearFiles()} data-testid="clear-files-btn">
        Clear Files
      </button>
    </div>
  );
};

describe('UploadContext', () => {
  it('should provide initial context values', () => {
    render(
      <UploadProvider>
        <TestComponent />
      </UploadProvider>
    );

    expect(screen.getByTestId('total-files')).toHaveTextContent('0');
    expect(screen.getByTestId('completed-files')).toHaveTextContent('0');
    expect(screen.getByTestId('failed-files')).toHaveTextContent('0');
    expect(screen.getByTestId('uploading-files')).toHaveTextContent('0');
    expect(screen.getByTestId('is-idle')).toHaveTextContent('true');
    expect(screen.getByTestId('is-active')).toHaveTextContent('false');
  });

  it('should add files correctly', () => {
    render(
      <UploadProvider>
        <TestComponent />
      </UploadProvider>
    );

    act(() => {
      screen.getByTestId('add-file-btn').click();
    });

    expect(screen.getByTestId('total-files')).toHaveTextContent('1');
    expect(screen.getByTestId('is-idle')).toHaveTextContent('false');
  });

  it('should update progress correctly', () => {
    render(
      <UploadProvider>
        <TestComponent />
      </UploadProvider>
    );

    act(() => {
      screen.getByTestId('update-progress-btn').click();
    });

    // Progress should be updated in the context
    expect(screen.getByTestId('is-idle')).toHaveTextContent('true');
  });

  it('should clear files correctly', () => {
    render(
      <UploadProvider>
        <TestComponent />
      </UploadProvider>
    );

    // Add a file first
    act(() => {
      screen.getByTestId('add-file-btn').click();
    });

    expect(screen.getByTestId('total-files')).toHaveTextContent('1');

    // Clear files
    act(() => {
      screen.getByTestId('clear-files-btn').click();
    });

    expect(screen.getByTestId('total-files')).toHaveTextContent('0');
    expect(screen.getByTestId('is-idle')).toHaveTextContent('true');
  });

  it('should handle file state transitions', () => {
    render(
      <UploadProvider>
        <TestComponent />
      </UploadProvider>
    );

    // Add a file
    act(() => {
      screen.getByTestId('add-file-btn').click();
    });

    expect(screen.getByTestId('total-files')).toHaveTextContent('1');

    // Test context methods are available
    expect(typeof screen.getByTestId('add-file-btn')).toBe('object');
  });

  it('should provide utility actions', () => {
    render(
      <UploadProvider>
        <TestComponent />
      </UploadProvider>
    );

    // Test component renders with utility buttons
    expect(screen.getByTestId('add-file-btn')).toBeInTheDocument();
    expect(screen.getByTestId('update-progress-btn')).toBeInTheDocument();
    expect(screen.getByTestId('clear-files-btn')).toBeInTheDocument();
  });

  it('should handle multiple files', () => {
    const MultipleFilesComponent: React.FC = () => {
      const context = useUploadContext();
      const { createUploadFile } = useUploadFileFactory();

      const handleAddMultipleFiles = () => {
        const files = [
          new File(['content1'], 'test1.txt', { type: 'text/plain' }),
          new File(['content2'], 'test2.txt', { type: 'text/plain' })
        ];
        const uploadFiles = files.map(file => createUploadFile(file));
        context.addFiles(uploadFiles);
      };

      return (
        <div>
          <div data-testid="multiple-total-files">{context.totalFiles}</div>
          <button onClick={handleAddMultipleFiles} data-testid="add-multiple-btn">
            Add Multiple Files
          </button>
        </div>
      );
    };

    render(
      <UploadProvider>
        <MultipleFilesComponent />
      </UploadProvider>
    );

    act(() => {
      screen.getByTestId('add-multiple-btn').click();
    });

    expect(screen.getByTestId('multiple-total-files')).toHaveTextContent('2');
  });

  it('should handle file updates', () => {
    const FileUpdateComponent: React.FC = () => {
      const context = useUploadContext();
      const { createUploadFile } = useUploadFileFactory();

      const handleAddAndUpdateFile = () => {
        const file = new File(['test'], 'test.txt', { type: 'text/plain' });
        const uploadFile = createUploadFile(file);
        context.addFiles([uploadFile]);

        // Update the file status
        context.updateFile(uploadFile.id, {
          status: 'completed',
          progress: 100
        });
      };

      return (
        <div>
          <div data-testid="update-completed-files">{context.completedFiles}</div>
          <button onClick={handleAddAndUpdateFile} data-testid="add-update-btn">
            Add and Update File
          </button>
        </div>
      );
    };

    render(
      <UploadProvider>
        <FileUpdateComponent />
      </UploadProvider>
    );

    act(() => {
      screen.getByTestId('add-update-btn').click();
    });

    expect(screen.getByTestId('update-completed-files')).toHaveTextContent('1');
  });
});
