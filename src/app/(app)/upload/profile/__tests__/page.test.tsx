import React from 'react';
import { render } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import ProfileRedirectPage from '../page';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;

describe('ProfileRedirectPage', () => {
  const mockReplace = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue({
      replace: mockReplace,
    } as any);
  });

  it('renders without crashing', () => {
    render(<ProfileRedirectPage />);
  });

  it('redirects to upload page with profile tab', () => {
    render(<ProfileRedirectPage />);
    expect(mockReplace).toHaveBeenCalledWith('/upload?tab=profile');
  });

  it('returns null during render', () => {
    const { container } = render(<ProfileRedirectPage />);
    expect(container.firstChild).toBeNull();
  });
});
