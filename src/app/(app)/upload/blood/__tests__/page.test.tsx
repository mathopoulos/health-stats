import React from 'react';
import { render } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import BloodRedirectPage from '../page';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;

describe('BloodRedirectPage', () => {
  const mockReplace = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue({
      replace: mockReplace,
    } as any);
  });

  it('renders without crashing', () => {
    render(<BloodRedirectPage />);
  });

  it('redirects to upload page with blood tab', () => {
    render(<BloodRedirectPage />);
    expect(mockReplace).toHaveBeenCalledWith('/upload?tab=blood');
  });

  it('returns null during render', () => {
    const { container } = render(<BloodRedirectPage />);
    expect(container.firstChild).toBeNull();
  });
});
