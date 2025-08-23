import React from 'react';
import { render } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import SettingsRedirectPage from '../page';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;

describe('SettingsRedirectPage', () => {
  const mockReplace = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue({
      replace: mockReplace,
    } as any);
  });

  it('renders without crashing', () => {
    render(<SettingsRedirectPage />);
  });

  it('redirects to upload page with more tab', () => {
    render(<SettingsRedirectPage />);
    expect(mockReplace).toHaveBeenCalledWith('/upload?tab=more');
  });

  it('returns null during render', () => {
    const { container } = render(<SettingsRedirectPage />);
    expect(container.firstChild).toBeNull();
  });
});
