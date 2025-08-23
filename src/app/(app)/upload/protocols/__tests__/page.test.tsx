import React from 'react';
import { render } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import ProtocolsRedirectPage from '../page';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;

describe('ProtocolsRedirectPage', () => {
  const mockReplace = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue({
      replace: mockReplace,
    } as any);
  });

  it('renders without crashing', () => {
    render(<ProtocolsRedirectPage />);
  });

  it('redirects to upload page with protocols tab', () => {
    render(<ProtocolsRedirectPage />);
    expect(mockReplace).toHaveBeenCalledWith('/upload?tab=protocols');
  });

  it('returns null during render', () => {
    const { container } = render(<ProtocolsRedirectPage />);
    expect(container.firstChild).toBeNull();
  });
});
