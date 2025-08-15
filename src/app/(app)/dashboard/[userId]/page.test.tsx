import React from 'react';

// Very basic test to ensure page can be imported without errors
describe('DashboardPage', () => {
  it('can be imported without errors', async () => {
    expect(() => {
      require('./page');
    }).not.toThrow();
  });

  it('exports a default component', () => {
    const DashboardPage = require('./page').default;
    expect(DashboardPage).toBeDefined();
    expect(typeof DashboardPage).toBe('function');
  });
});