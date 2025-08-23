import React from 'react';
import { render } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import FitnessRedirectPage from '../page';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;

describe('FitnessRedirectPage', () => {
  const mockReplace = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue({
      replace: mockReplace,
    } as any);
  });

  it('renders without crashing', () => {
    render(<FitnessRedirectPage />);
  });

  it('redirects to upload page with fitness tab', () => {
    render(<FitnessRedirectPage />);
    expect(mockReplace).toHaveBeenCalledWith('/upload?tab=fitness');
  });

  it('returns null during render', () => {
    const { container } = render(<FitnessRedirectPage />);
    expect(container.firstChild).toBeNull();
  });
});
