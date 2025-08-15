import React, { ReactElement, ReactNode } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from '@/providers/ThemeProvider';

// Mock session for testing
const mockSession = {
  user: {
    id: 'test-user',
    name: 'Test User',
    email: 'test@example.com',
  },
  expires: '2024-12-31T23:59:59.999Z',
};

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  session?: typeof mockSession | null;
  theme?: 'light' | 'dark' | 'system';
}

// Custom render function with providers
function customRender(
  ui: ReactElement,
  options: CustomRenderOptions = {}
) {
  const {
    session = mockSession,
    theme = 'light',
    ...renderOptions
  } = options;

  function Wrapper({ children }: { children?: ReactNode }) {
    return (
      <SessionProvider session={session}>
        {/* Skip ThemeProvider in tests to avoid matchMedia issues */}
        <div data-theme={theme}>
          {children}
        </div>
      </SessionProvider>
    );
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

// Re-export everything from React Testing Library
export * from '@testing-library/react';

// Override the render method
export { customRender as render };

// Test data factories
export const createMockHealthData = (overrides = {}) => ({
  date: '2024-01-01',
  value: 120,
  meta: {
    aggregationType: 'weekly' as const,
    pointCount: 7,
  },
  ...overrides,
});

export const createMockBloodMarker = (overrides = {}) => ({
  date: '2024-01-01',
  value: 150,
  unit: 'mg/dL',
  referenceRange: {
    min: 100,
    max: 200,
  },
  ...overrides,
});

export const createMockUser = (overrides = {}) => ({
  name: 'Test User',
  email: 'test@example.com',
  userId: 'test-user-id',
  age: 30,
  sex: 'male' as const,
  ...overrides,
});
