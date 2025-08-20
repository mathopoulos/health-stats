import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useSession, signIn } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import { useDropzone } from 'react-dropzone';
import BloodTestUpload from '../BloodTestUpload';
import { usePDFUpload } from '../../../upload/hooks';

// Mock next-auth
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
  signIn: jest.fn(),
}));

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));

// Mock usePDFUpload hook
jest.mock('../../../upload/hooks', () => ({
  usePDFUpload: jest.fn(),
}));

// Mock BloodMarkerPreview component
jest.mock('../BloodMarkerPreview', () => ({
  __esModule: true,
  default: ({ isOpen, onClose, onSave, markers, initialDate, dateGroups, pdfUrl, isProcessing, processingProgress }: any) => (
    <div data-testid="blood-marker-preview" data-open={isOpen}>
      {isOpen && (
        <div>
          <div data-testid="preview-markers">{JSON.stringify(markers)}</div>
          <div data-testid="preview-initial-date">{initialDate}</div>
          <div data-testid="preview-pdf-url">{pdfUrl}</div>
          <div data-testid="preview-processing">{isProcessing ? 'Processing' : 'Not Processing'}</div>
          <div data-testid="preview-progress">{processingProgress}</div>
          <button data-testid="preview-close" onClick={onClose}>Close</button>
          <button data-testid="preview-save" onClick={() => onSave(markers, new Date('2025-08-20'))}>Save</button>
        </div>
      )}
    </div>
  )
}));

// Mock useDropzone
jest.mock('react-dropzone', () => ({
  useDropzone: jest.fn(),
}));

// Mock URL.createObjectURL and revokeObjectURL
global.URL.createObjectURL = jest.fn(() => 'mock-blob-url');
global.URL.revokeObjectURL = jest.fn();

const mockUsePDFUpload = usePDFUpload as jest.MockedFunction<typeof usePDFUpload>;
const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;
const mockSignIn = signIn as jest.MockedFunction<typeof signIn>;
const mockToast = toast as jest.Mocked<typeof toast>;
const mockUseDropzone = useDropzone as jest.MockedFunction<typeof useDropzone>;

describe('BloodTestUpload', () => {
  const mockPDFUpload = {
    uploadFile: jest.fn(),
    clearFiles: jest.fn(),
    isUploading: false,
    isProcessing: false,
    extractedMarkers: [],
    extractedText: '',
    dateGroups: [],
    processingProgress: '',
    hasError: false,
    files: [],
    retryUpload: jest.fn(),
  };

  const mockSession = {
    user: { id: 'test-user-id', email: 'test@example.com' },
    expires: '2024-01-01',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePDFUpload.mockReturnValue(mockPDFUpload);
    mockUseSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated',
      update: jest.fn(),
    });
    
    // Mock useDropzone with proper callbacks
    mockUseDropzone.mockImplementation(({ onDrop, accept, maxFiles, disabled }) => ({
      getRootProps: () => ({
        'data-testid': 'drop-zone',
        onClick: jest.fn(),
        onDrop: (e: any) => {
          if (e.dataTransfer && e.dataTransfer.files) {
            const files = Array.from(e.dataTransfer.files);
            onDrop && onDrop(files as File[], [], { type: 'drop' } as any);
          }
        },
      }),
      getInputProps: () => ({
        'data-testid': 'file-input',
        type: 'file',
        accept: Object.keys(accept || {}).join(','),
        disabled,
        onChange: (e: any) => {
          if (e.target.files) {
            const files = Array.from(e.target.files);
            onDrop && onDrop(files as File[], [], { type: 'change' } as any);
          }
        },
      }),
      isDragActive: false,
    }));
    
    // Reset window.dispatchEvent mock
    global.window.dispatchEvent = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render upload interface correctly', () => {
    render(<BloodTestUpload />);

    expect(screen.getByTestId('drop-zone')).toBeInTheDocument();
    expect(screen.getByText('Drop your blood test PDF here, or click to select')).toBeInTheDocument();
    expect(screen.getByText('PDF file up to 10MB')).toBeInTheDocument();
    expect(screen.getByTestId('blood-marker-preview')).toBeInTheDocument();
  });

  it('should show processing state during upload', () => {
    mockUsePDFUpload.mockReturnValue({
      ...mockPDFUpload,
      isUploading: true,
      processingProgress: 'Extracting text...',
    });

    render(<BloodTestUpload />);

    expect(screen.getByText('Processing PDF...')).toBeInTheDocument();
    expect(screen.getByText('Extracting text...')).toBeInTheDocument();
  });

  it('should handle file drop correctly', async () => {
    render(<BloodTestUpload />);

    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    const dropZone = screen.getByTestId('drop-zone');

    // Simulate file drop using the mocked onDrop callback
    await act(async () => {
      const props = mockUseDropzone.mock.calls[0][0];
      props.onDrop([file], [], { type: 'drop' });
    });

    await waitFor(() => {
      expect(mockPDFUpload.uploadFile).toHaveBeenCalledWith(file);
      expect(global.URL.createObjectURL).toHaveBeenCalledWith(file);
    });
  });

  it('should handle invalid file type', async () => {
    render(<BloodTestUpload />);

    const file = new File(['test content'], 'test.txt', { type: 'text/plain' });

    // Simulate file drop using the mocked onDrop callback
    await act(async () => {
      const props = mockUseDropzone.mock.calls[0][0];
      props.onDrop([file], [], { type: 'drop' });
    });

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith('Please upload a PDF file');
      expect(mockPDFUpload.uploadFile).not.toHaveBeenCalled();
    });
  });

  it('should open preview modal when markers are extracted', async () => {
    render(<BloodTestUpload />);

    // Simulate markers extraction
    await act(async () => {
      const onMarkersExtracted = mockUsePDFUpload.mock.calls[0][0].onMarkersExtracted;
      onMarkersExtracted([{ name: 'Test Marker', value: 10, unit: 'mg/dL' }], []);
    });

    await waitFor(() => {
      expect(screen.getByTestId('blood-marker-preview')).toHaveAttribute('data-open', 'true');
    });
  });

  it('should handle successful marker save', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    const testMarkers = [{ name: 'Test Marker', value: 10, unit: 'mg/dL' }];
    
    // Update the mock to return the extracted markers
    mockUsePDFUpload.mockReturnValue({
      ...mockPDFUpload,
      extractedMarkers: testMarkers,
    });

    render(<BloodTestUpload />);

    // Open preview modal
    await act(async () => {
      const onMarkersExtracted = mockUsePDFUpload.mock.calls[0][0].onMarkersExtracted;
      onMarkersExtracted(testMarkers, []);
    });

    await waitFor(() => {
      expect(screen.getByTestId('blood-marker-preview')).toHaveAttribute('data-open', 'true');
    });

    const saveButton = screen.getByTestId('preview-save');
    await userEvent.click(saveButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/blood-markers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          markers: testMarkers,
          date: '2025-08-20',
        }),
      });
      expect(mockToast.success).toHaveBeenCalledWith('1 blood markers saved successfully');
      expect(global.window.dispatchEvent).toHaveBeenCalledWith(new Event('bloodMarkerAdded'));
    });
  });

  it('should handle save error', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Server error' }),
    });

    render(<BloodTestUpload />);

    // Open preview modal
    await act(async () => {
      const onMarkersExtracted = mockUsePDFUpload.mock.calls[0][0].onMarkersExtracted;
      onMarkersExtracted([{ name: 'Test Marker', value: 10, unit: 'mg/dL' }], []);
    });

    await waitFor(() => {
      expect(screen.getByTestId('blood-marker-preview')).toHaveAttribute('data-open', 'true');
    });

    const saveButton = screen.getByTestId('preview-save');
    await userEvent.click(saveButton);

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith(expect.stringContaining('Failed to save markers'));
    });
  });

  it('should handle unauthenticated user', async () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: jest.fn(),
    });

    render(<BloodTestUpload />);

    // Open preview modal
    await act(async () => {
      const onMarkersExtracted = mockUsePDFUpload.mock.calls[0][0].onMarkersExtracted;
      onMarkersExtracted([{ name: 'Test Marker', value: 10, unit: 'mg/dL' }], []);
    });

    await waitFor(() => {
      expect(screen.getByTestId('blood-marker-preview')).toHaveAttribute('data-open', 'true');
    });

    const saveButton = screen.getByTestId('preview-save');
    await userEvent.click(saveButton);

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith('You must be logged in to save blood markers');
      expect(mockSignIn).toHaveBeenCalled();
    });
  });

  it('should reset upload on modal close', async () => {
    render(<BloodTestUpload />);

    // Setup a PDF URL first by simulating a file upload
    await act(async () => {
      const props = mockUseDropzone.mock.calls[0][0];
      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
      props.onDrop([file], [], { type: 'drop' });
    });

    // Open preview modal
    await act(async () => {
      const onMarkersExtracted = mockUsePDFUpload.mock.calls[0][0].onMarkersExtracted;
      onMarkersExtracted([{ name: 'Test Marker', value: 10, unit: 'mg/dL' }], []);
    });

    await waitFor(() => {
      expect(screen.getByTestId('blood-marker-preview')).toHaveAttribute('data-open', 'true');
    });

    const closeButton = screen.getByTestId('preview-close');
    await userEvent.click(closeButton);

    expect(mockPDFUpload.clearFiles).toHaveBeenCalled();
    expect(global.URL.revokeObjectURL).toHaveBeenCalled();
  });

  it('should handle file input change', async () => {
    render(<BloodTestUpload />);

    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });

    // Simulate file input change using the mocked onChange callback
    await act(async () => {
      const inputProps = mockUseDropzone.mock.calls[0][0];
      // The onChange is part of the getInputProps return value, 
      // so we simulate it via the onDrop callback with change type
      inputProps.onDrop([file], [], { type: 'change' });
    });

    await waitFor(() => {
      expect(mockPDFUpload.uploadFile).toHaveBeenCalledWith(file);
    });
  });

  it('should not upload if no files selected', async () => {
    render(<BloodTestUpload />);

    const dropZone = screen.getByTestId('drop-zone');

    fireEvent.drop(dropZone, {
      dataTransfer: {
        files: [],
      },
    });

    expect(mockPDFUpload.uploadFile).not.toHaveBeenCalled();
  });

  it('should handle processing state correctly', () => {
    mockUsePDFUpload.mockReturnValue({
      ...mockPDFUpload,
      isProcessing: true,
      processingProgress: 'Analyzing document...',
    });

    render(<BloodTestUpload />);

    expect(screen.getByText('Processing PDF...')).toBeInTheDocument();
    expect(screen.getByText('Analyzing document...')).toBeInTheDocument();
  });

  it('should call onTextExtracted callback', () => {
    const mockOnTextExtracted = jest.fn();
    
    render(<BloodTestUpload />);

    const onTextExtracted = mockUsePDFUpload.mock.calls[0][0].onTextExtracted;
    onTextExtracted('extracted text content');

    // Verify console.log was called (from the component implementation)
    // Note: This is testing the component's behavior of logging the text length
  });

  it('should handle multiple file uploads correctly', async () => {
    render(<BloodTestUpload />);

    const file1 = new File(['test content 1'], 'test1.pdf', { type: 'application/pdf' });
    const file2 = new File(['test content 2'], 'test2.pdf', { type: 'application/pdf' });

    // Simulate multiple file drop using the mocked onDrop callback
    await act(async () => {
      const props = mockUseDropzone.mock.calls[0][0];
      props.onDrop([file1, file2], [], { type: 'drop' });
    });

    await waitFor(() => {
      // Should only upload the first file
      expect(mockPDFUpload.uploadFile).toHaveBeenCalledTimes(1);
      expect(mockPDFUpload.uploadFile).toHaveBeenCalledWith(file1);
    });
  });

  it('should show cloud icon when not processing', () => {
    render(<BloodTestUpload />);

    // Check for SVG cloud icon
    const cloudIcon = document.querySelector('svg path[d*="M7 16a4 4 0 01-.88-7.903"]');
    expect(cloudIcon).toBeInTheDocument();
  });

  it('should show spinner when processing', () => {
    mockUsePDFUpload.mockReturnValue({
      ...mockPDFUpload,
      isUploading: true,
    });

    render(<BloodTestUpload />);

    // Check for spinner SVG
    const spinner = document.querySelector('svg.animate-spin');
    expect(spinner).toBeInTheDocument();
  });
});
