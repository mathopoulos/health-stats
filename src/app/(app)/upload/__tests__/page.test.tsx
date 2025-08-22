import React from 'react';
import { render } from '@testing-library/react';
import { useSearchParams, useRouter } from 'next/navigation';
import UploadIndexPage from '../page';

// Mock Next.js navigation hooks
jest.mock('next/navigation', () => ({
  useSearchParams: jest.fn(),
  useRouter: jest.fn(),
}));

const mockUseSearchParams = useSearchParams as jest.MockedFunction<typeof useSearchParams>;
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;

describe('UploadIndexPage', () => {
  const mockReplace = jest.fn();
  const mockRouter = {
    replace: mockReplace,
    push: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue(mockRouter);
  });

  it('renders loading state', () => {
    mockUseSearchParams.mockReturnValue(null);
    
    const { getByText } = render(<UploadIndexPage />);
    
    expect(getByText('Redirecting...')).toBeInTheDocument();
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('redirects to profile page by default', () => {
    const mockSearchParams = {
      get: jest.fn().mockReturnValue(null),
    };
    mockUseSearchParams.mockReturnValue(mockSearchParams as any);
    
    render(<UploadIndexPage />);
    
    expect(mockReplace).toHaveBeenCalledWith('/upload/profile');
  });

  it('redirects to profile page when tab is "profile"', () => {
    const mockSearchParams = {
      get: jest.fn().mockReturnValue('profile'),
    };
    mockUseSearchParams.mockReturnValue(mockSearchParams as any);
    
    render(<UploadIndexPage />);
    
    expect(mockReplace).toHaveBeenCalledWith('/upload/profile');
  });

  it('redirects to protocols page when tab is "protocols"', () => {
    const mockSearchParams = {
      get: jest.fn().mockReturnValue('protocols'),
    };
    mockUseSearchParams.mockReturnValue(mockSearchParams as any);
    
    render(<UploadIndexPage />);
    
    expect(mockReplace).toHaveBeenCalledWith('/upload/protocols');
  });

  it('redirects to fitness page when tab is "fitness"', () => {
    const mockSearchParams = {
      get: jest.fn().mockReturnValue('fitness'),
    };
    mockUseSearchParams.mockReturnValue(mockSearchParams as any);
    
    render(<UploadIndexPage />);
    
    expect(mockReplace).toHaveBeenCalledWith('/upload/fitness');
  });

  it('redirects to blood page when tab is "blood"', () => {
    const mockSearchParams = {
      get: jest.fn().mockReturnValue('blood'),
    };
    mockUseSearchParams.mockReturnValue(mockSearchParams as any);
    
    render(<UploadIndexPage />);
    
    expect(mockReplace).toHaveBeenCalledWith('/upload/blood');
  });

  it('redirects to settings page when tab is "more"', () => {
    const mockSearchParams = {
      get: jest.fn().mockReturnValue('more'),
    };
    mockUseSearchParams.mockReturnValue(mockSearchParams as any);
    
    render(<UploadIndexPage />);
    
    expect(mockReplace).toHaveBeenCalledWith('/upload/settings');
  });

  it('redirects to settings page when tab is "settings"', () => {
    const mockSearchParams = {
      get: jest.fn().mockReturnValue('settings'),
    };
    mockUseSearchParams.mockReturnValue(mockSearchParams as any);
    
    render(<UploadIndexPage />);
    
    expect(mockReplace).toHaveBeenCalledWith('/upload/settings');
  });

  it('handles null searchParams', () => {
    mockUseSearchParams.mockReturnValue(null);
    
    render(<UploadIndexPage />);
    
    expect(mockReplace).toHaveBeenCalledWith('/upload/profile');
  });

  it('redirects to profile for unknown tab values', () => {
    const mockSearchParams = {
      get: jest.fn().mockReturnValue('unknown-tab'),
    };
    mockUseSearchParams.mockReturnValue(mockSearchParams as any);
    
    render(<UploadIndexPage />);
    
    expect(mockReplace).toHaveBeenCalledWith('/upload/profile');
  });

  it('calls get method on searchParams with "tab" parameter', () => {
    const mockGet = jest.fn().mockReturnValue('fitness');
    const mockSearchParams = {
      get: mockGet,
    };
    mockUseSearchParams.mockReturnValue(mockSearchParams as any);
    
    render(<UploadIndexPage />);
    
    expect(mockGet).toHaveBeenCalledWith('tab');
  });
});
