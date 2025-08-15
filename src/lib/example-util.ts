// Example utility function to test coverage requirements
export function calculatePercentage(value: number, total: number): number {
  if (total === 0) {
    throw new Error('Total cannot be zero');
  }
  
  return Math.round((value / total) * 100);
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
}

// This function has multiple branches to test coverage
export function getHealthStatus(score: number): string {
  if (score >= 90) {
    return 'Excellent';
  } else if (score >= 80) {
    return 'Good';
  } else if (score >= 70) {
    return 'Fair';
  } else if (score >= 60) {
    return 'Poor';
  } else {
    return 'Critical';
  }
}
