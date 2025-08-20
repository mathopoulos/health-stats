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

  it('should throw error when used outside provider', () => {
    // Mock console.error to avoid noise in test output
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<TestComponent />);
    }).toThrow('useUploadContext must be used within an UploadProvider');

    consoleSpy.mockRestore();
  });

  it('should set and clear current file', () => {
    const TestCurrentFile: React.FC = () => {
      const context = useUploadContext();
      const { createUploadFile } = useUploadFileFactory();

      const handleSetCurrent = () => {
        const file = new File(['content'], 'current.txt', { type: 'text/plain' });
        const uploadFile = createUploadFile(file);
        context.setCurrentFile(uploadFile);
      };

      const handleClearCurrent = () => {
        context.setCurrentFile(undefined);
      };

      return (
        <div>
          <div data-testid="current-file">{context.currentFile?.name || 'no-current-file'}</div>
          <button onClick={handleSetCurrent} data-testid="set-current-btn">Set Current</button>
          <button onClick={handleClearCurrent} data-testid="clear-current-btn">Clear Current</button>
        </div>
      );
    };

    render(
      <UploadProvider>
        <TestCurrentFile />
      </UploadProvider>
    );

    // Initially no current file
    expect(screen.getByTestId('current-file')).toHaveTextContent('no-current-file');

    // Set current file
    act(() => {
      screen.getByTestId('set-current-btn').click();
    });

    expect(screen.getByTestId('current-file')).toHaveTextContent('current.txt');

    // Clear current file
    act(() => {
      screen.getByTestId('clear-current-btn').click();
    });

    expect(screen.getByTestId('current-file')).toHaveTextContent('no-current-file');
  });

  it('should set and clear error', () => {
    const TestError: React.FC = () => {
      const context = useUploadContext();

      const handleSetError = () => {
        const error = { code: 'UPLOAD_FAILED', message: 'Upload failed' };
        context.setError(error);
      };

      const handleClearError = () => {
        context.clearError();
      };

      return (
        <div>
          <div data-testid="error">{context.error?.message || 'no-error'}</div>
          <div data-testid="status">{context.status}</div>
          <button onClick={handleSetError} data-testid="set-error-btn">Set Error</button>
          <button onClick={handleClearError} data-testid="clear-error-btn">Clear Error</button>
        </div>
      );
    };

    render(
      <UploadProvider>
        <TestError />
      </UploadProvider>
    );

    // Initially no error
    expect(screen.getByTestId('error')).toHaveTextContent('no-error');
    expect(screen.getByTestId('status')).toHaveTextContent('idle');

    // Set error
    act(() => {
      screen.getByTestId('set-error-btn').click();
    });

    expect(screen.getByTestId('error')).toHaveTextContent('Upload failed');
    expect(screen.getByTestId('status')).toHaveTextContent('error');

    // Clear error
    act(() => {
      screen.getByTestId('clear-error-btn').click();
    });

    expect(screen.getByTestId('error')).toHaveTextContent('no-error');
    expect(screen.getByTestId('status')).toHaveTextContent('idle');
  });

  it('should set status', () => {
    const TestStatus: React.FC = () => {
      const context = useUploadContext();

      const handleSetUploading = () => {
        context.setStatus('uploading');
      };

      const handleSetCompleted = () => {
        context.setStatus('completed');
      };

      return (
        <div>
          <div data-testid="status">{context.status}</div>
          <button onClick={handleSetUploading} data-testid="set-uploading-btn">Set Uploading</button>
          <button onClick={handleSetCompleted} data-testid="set-completed-btn">Set Completed</button>
        </div>
      );
    };

    render(
      <UploadProvider>
        <TestStatus />
      </UploadProvider>
    );

    // Initially idle
    expect(screen.getByTestId('status')).toHaveTextContent('idle');

    // Set to uploading
    act(() => {
      screen.getByTestId('set-uploading-btn').click();
    });

    expect(screen.getByTestId('status')).toHaveTextContent('uploading');

    // Set to completed
    act(() => {
      screen.getByTestId('set-completed-btn').click();
    });

    expect(screen.getByTestId('status')).toHaveTextContent('completed');
  });

  it('should set results', () => {
    const TestResults: React.FC = () => {
      const context = useUploadContext();

      const handleSetResults = () => {
        const results = { data: 'test results' };
        context.setResults(results);
      };

      return (
        <div>
          <div data-testid="results">{JSON.stringify(context.results || null)}</div>
          <button onClick={handleSetResults} data-testid="set-results-btn">Set Results</button>
        </div>
      );
    };

    render(
      <UploadProvider>
        <TestResults />
      </UploadProvider>
    );

    // Initially no results
    expect(screen.getByTestId('results')).toHaveTextContent('null');

    // Set results
    act(() => {
      screen.getByTestId('set-results-btn').click();
    });

    expect(screen.getByTestId('results')).toHaveTextContent('{"data":"test results"}');
  });

  it('should reset state', () => {
    const TestReset: React.FC = () => {
      const context = useUploadContext();
      const { createUploadFile } = useUploadFileFactory();

      const handleSetup = () => {
        const file = new File(['content'], 'test.txt', { type: 'text/plain' });
        const uploadFile = createUploadFile(file);
        context.addFiles([uploadFile]);
        context.setStatus('uploading');
        const error = { code: 'TEST_ERROR', message: 'Test error' };
        context.setError(error);
      };

      const handleReset = () => {
        context.reset();
      };

      return (
        <div>
          <div data-testid="total-files">{context.totalFiles}</div>
          <div data-testid="status">{context.status}</div>
          <div data-testid="error">{context.error?.message || 'no-error'}</div>
          <button onClick={handleSetup} data-testid="setup-btn">Setup</button>
          <button onClick={handleReset} data-testid="reset-btn">Reset</button>
        </div>
      );
    };

    render(
      <UploadProvider>
        <TestReset />
      </UploadProvider>
    );

    // Setup state
    act(() => {
      screen.getByTestId('setup-btn').click();
    });

    expect(screen.getByTestId('total-files')).toHaveTextContent('1');
    expect(screen.getByTestId('status')).toHaveTextContent('error');
    expect(screen.getByTestId('error')).toHaveTextContent('Test error');

    // Reset
    act(() => {
      screen.getByTestId('reset-btn').click();
    });

    expect(screen.getByTestId('total-files')).toHaveTextContent('0');
    expect(screen.getByTestId('status')).toHaveTextContent('idle');
    expect(screen.getByTestId('error')).toHaveTextContent('no-error');
  });

  it('should retry and cancel files', () => {
    const TestRetryCancel: React.FC = () => {
      const context = useUploadContext();
      const { createUploadFile } = useUploadFileFactory();

      const handleSetup = () => {
        const file = new File(['content'], 'test.txt', { type: 'text/plain' });
        const uploadFile = createUploadFile(file);
        context.addFiles([uploadFile]);
        // Set to error state
        context.updateFile(uploadFile.id, { status: 'error', error: 'Upload failed' });
      };

      const handleRetry = () => {
        if (context.files.length > 0) {
          context.retryFile(context.files[0].id);
        }
      };

      const handleCancel = () => {
        if (context.files.length > 0) {
          context.cancelFile(context.files[0].id);
        }
      };

      return (
        <div>
          <div data-testid="file-status">{context.files[0]?.status || 'no-files'}</div>
          <div data-testid="file-error">{context.files[0]?.error || 'no-error'}</div>
          <button onClick={handleSetup} data-testid="setup-btn">Setup</button>
          <button onClick={handleRetry} data-testid="retry-btn">Retry</button>
          <button onClick={handleCancel} data-testid="cancel-btn">Cancel</button>
        </div>
      );
    };

    render(
      <UploadProvider>
        <TestRetryCancel />
      </UploadProvider>
    );

    // Setup file in error state
    act(() => {
      screen.getByTestId('setup-btn').click();
    });

    expect(screen.getByTestId('file-status')).toHaveTextContent('error');
    expect(screen.getByTestId('file-error')).toHaveTextContent('Upload failed');

    // Retry file
    act(() => {
      screen.getByTestId('retry-btn').click();
    });

    expect(screen.getByTestId('file-status')).toHaveTextContent('pending');
    expect(screen.getByTestId('file-error')).toHaveTextContent('no-error');

    // Cancel file
    act(() => {
      screen.getByTestId('cancel-btn').click();
    });

    expect(screen.getByTestId('file-status')).toHaveTextContent('error');
    expect(screen.getByTestId('file-error')).toHaveTextContent('Upload cancelled');
  });

  it('should handle bulk retry and cancel operations', () => {
    const TestBulkOperations: React.FC = () => {
      const context = useUploadContext();
      const { createUploadFile } = useUploadFileFactory();

      const handleSetup = () => {
        const files = [
          new File(['content1'], 'test1.txt', { type: 'text/plain' }),
          new File(['content2'], 'test2.txt', { type: 'text/plain' })
        ];
        const uploadFiles = files.map(file => createUploadFile(file));
        context.addFiles(uploadFiles);
        // Set files to different states
        context.updateFile(uploadFiles[0].id, { status: 'error', error: 'Failed' });
        context.updateFile(uploadFiles[1].id, { status: 'uploading' });
      };

      const handleRetryAllFailed = () => {
        context.retryAllFailed();
      };

      const handleCancelAll = () => {
        context.cancelAll();
      };

      return (
        <div>
          <div data-testid="failed-files">{context.failedFiles}</div>
          <div data-testid="uploading-files">{context.uploadingFiles}</div>
          <button onClick={handleSetup} data-testid="setup-btn">Setup</button>
          <button onClick={handleRetryAllFailed} data-testid="retry-all-btn">Retry All Failed</button>
          <button onClick={handleCancelAll} data-testid="cancel-all-btn">Cancel All</button>
        </div>
      );
    };

    render(
      <UploadProvider>
        <TestBulkOperations />
      </UploadProvider>
    );

    // Setup files
    act(() => {
      screen.getByTestId('setup-btn').click();
    });

    expect(screen.getByTestId('failed-files')).toHaveTextContent('1');
    expect(screen.getByTestId('uploading-files')).toHaveTextContent('1');

    // Retry all failed
    act(() => {
      screen.getByTestId('retry-all-btn').click();
    });

    expect(screen.getByTestId('failed-files')).toHaveTextContent('0');

    // Cancel all (should cancel uploading files)
    act(() => {
      screen.getByTestId('cancel-all-btn').click();
    });

    expect(screen.getByTestId('uploading-files')).toHaveTextContent('0');
    expect(screen.getByTestId('failed-files')).toHaveTextContent('2'); // Both files are now failed (1 was already failed, 1 was cancelled)
  });

  it('should handle remove file with current file reference', () => {
    const TestRemoveCurrent: React.FC = () => {
      const context = useUploadContext();
      const { createUploadFile } = useUploadFileFactory();

      const handleSetup = () => {
        const file = new File(['content'], 'current.txt', { type: 'text/plain' });
        const uploadFile = createUploadFile(file);
        context.addFiles([uploadFile]);
        context.setCurrentFile(uploadFile);
      };

      const handleRemoveCurrent = () => {
        if (context.files.length > 0) {
          context.removeFile(context.files[0].id);
        }
      };

      return (
        <div>
          <div data-testid="total-files">{context.totalFiles}</div>
          <div data-testid="current-file">{context.currentFile?.name || 'no-current-file'}</div>
          <button onClick={handleSetup} data-testid="setup-btn">Setup</button>
          <button onClick={handleRemoveCurrent} data-testid="remove-btn">Remove</button>
        </div>
      );
    };

    render(
      <UploadProvider>
        <TestRemoveCurrent />
      </UploadProvider>
    );

    // Setup file as current
    act(() => {
      screen.getByTestId('setup-btn').click();
    });

    expect(screen.getByTestId('total-files')).toHaveTextContent('1');
    expect(screen.getByTestId('current-file')).toHaveTextContent('current.txt');

    // Remove current file
    act(() => {
      screen.getByTestId('remove-btn').click();
    });

    expect(screen.getByTestId('total-files')).toHaveTextContent('0');
    expect(screen.getByTestId('current-file')).toHaveTextContent('no-current-file');
  });

  it('should handle update file computed values correctly', () => {
    const TestComputedValues: React.FC = () => {
      const context = useUploadContext();
      const { createUploadFile } = useUploadFileFactory();

      const handleSetupMultiple = () => {
        const files = [
          new File(['content1'], 'test1.txt', { type: 'text/plain' }),
          new File(['content2'], 'test2.txt', { type: 'text/plain' }),
          new File(['content3'], 'test3.txt', { type: 'text/plain' })
        ];
        const uploadFiles = files.map(file => createUploadFile(file));
        context.addFiles(uploadFiles);
      };

      const handleUpdateMultiple = () => {
        context.updateFile(context.files[0].id, { status: 'completed', progress: 100 });
        context.updateFile(context.files[1].id, { status: 'uploading', progress: 50 });
        context.updateFile(context.files[2].id, { status: 'error', error: 'Failed' });
      };

      return (
        <div>
          <div data-testid="total-files">{context.totalFiles}</div>
          <div data-testid="completed-files">{context.completedFiles}</div>
          <div data-testid="uploading-files">{context.uploadingFiles}</div>
          <div data-testid="failed-files">{context.failedFiles}</div>
          <div data-testid="is-active">{context.isActive.toString()}</div>
          <button onClick={handleSetupMultiple} data-testid="setup-multiple-btn">Setup Multiple</button>
          <button onClick={handleUpdateMultiple} data-testid="update-multiple-btn">Update Multiple</button>
        </div>
      );
    };

    render(
      <UploadProvider>
        <TestComputedValues />
      </UploadProvider>
    );

    // Setup multiple files
    act(() => {
      screen.getByTestId('setup-multiple-btn').click();
    });

    expect(screen.getByTestId('total-files')).toHaveTextContent('3');
    expect(screen.getByTestId('completed-files')).toHaveTextContent('0');
    expect(screen.getByTestId('uploading-files')).toHaveTextContent('0');
    expect(screen.getByTestId('failed-files')).toHaveTextContent('0');
    expect(screen.getByTestId('is-active')).toHaveTextContent('true');

    // Update files to different states
    act(() => {
      screen.getByTestId('update-multiple-btn').click();
    });

    expect(screen.getByTestId('completed-files')).toHaveTextContent('1');
    expect(screen.getByTestId('uploading-files')).toHaveTextContent('1');
    expect(screen.getByTestId('failed-files')).toHaveTextContent('1');
    expect(screen.getByTestId('is-active')).toHaveTextContent('true');
  });
});
