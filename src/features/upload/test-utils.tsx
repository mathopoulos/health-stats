import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { UploadProvider } from './context/UploadContext';
import { UploadFile, UploadProgress, UploadError } from './types';

// Test wrapper that includes all necessary providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <UploadProvider>
      {children}
    </UploadProvider>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options });

// Mock data generators
export const createMockUploadFile = (overrides?: Partial<UploadFile>): UploadFile => ({
  id: 'test-file-1',
  file: new File(['test content'], 'test.txt', { type: 'text/plain' }),
  name: 'test.txt',
  size: 1024,
  type: 'text/plain',
  progress: 0,
  status: 'pending',
  ...overrides,
});

export const createMockUploadProgress = (overrides?: Partial<UploadProgress>): UploadProgress => ({
  loaded: 512,
  total: 1024,
  percentage: 50,
  ...overrides,
});

export const createMockUploadError = (overrides?: Partial<UploadError>): UploadError => ({
  code: 'UPLOAD_FAILED',
  message: 'Upload failed',
  details: { reason: 'network error' },
  ...overrides,
});

// Mock file generators
export const createMockTextFile = (name = 'test.txt', size = 1024): File => {
  const content = 'x'.repeat(size);
  return new File([content], name, { type: 'text/plain' });
};

export const createMockPDFFile = (name = 'test.pdf'): File => {
  // Create a minimal valid PDF content
  const pdfHeader = new Uint8Array([0x25, 0x50, 0x44, 0x46]); // %PDF
  return new File([pdfHeader], name, { type: 'application/pdf' });
};

export const createMockXMLFile = (name = 'test.xml'): File => {
  const content = '<?xml version="1.0"?><root><data>test</data></root>';
  return new File([content], name, { type: 'application/xml' });
};

// Test helpers
export const waitForUploadState = async (
  testId: string,
  expectedState: string,
  timeout = 1000
): Promise<void> => {
  // Helper to wait for specific upload states in tests
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    const checkState = () => {
      const element = document.querySelector(`[data-testid="${testId}"]`);
      if (element?.textContent === expectedState) {
        resolve();
      } else if (Date.now() - startTime > timeout) {
        reject(new Error(`Timeout waiting for state: ${expectedState}`));
      } else {
        setTimeout(checkState, 10);
      }
    };

    checkState();
  });
};

// Mock API responses
export const mockSuccessfulUploadResponse = {
  success: true,
  data: { url: 'https://example.com/uploaded-file' },
  message: 'Upload successful'
};

export const mockFailedUploadResponse = {
  success: false,
  error: 'Upload failed',
  code: 'UPLOAD_ERROR'
};

export const mockProcessingResponse = {
  success: true,
  data: { jobId: 'test-job-123' },
  message: 'Processing started'
};

// Custom matchers
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidUploadFile(): R;
      toHaveUploadStatus(status: string): R;
    }
  }
}

expect.extend({
  toBeValidUploadFile(received: any) {
    const pass = received &&
                 typeof received.id === 'string' &&
                 received.file instanceof File &&
                 typeof received.name === 'string' &&
                 typeof received.size === 'number' &&
                 typeof received.type === 'string' &&
                 typeof received.progress === 'number' &&
                 ['pending', 'uploading', 'processing', 'completed', 'error'].includes(received.status);

    return {
      message: () => `expected ${received} to be a valid upload file`,
      pass,
    };
  },

  toHaveUploadStatus(received: any, status: string) {
    const pass = received && received.status === status;

    return {
      message: () => `expected upload file to have status ${status}, but got ${received?.status}`,
      pass,
    };
  },
});

// Export everything
export * from '@testing-library/react';
export { customRender as render };
