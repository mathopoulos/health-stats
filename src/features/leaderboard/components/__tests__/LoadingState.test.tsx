import React from 'react';
import { render, screen } from '@test-utils';
import { LoadingState } from '../LoadingState';

describe('LoadingState', () => {
  it('renders without crashing', () => {
    render(<LoadingState />);
    
    expect(screen.getByTestId('loading-state')).toBeInTheDocument();
  });

  it('displays correct number of skeleton rows', () => {
    const { container } = render(<LoadingState />);
    
    // Should render 8 skeleton rows (LOADING_SKELETON_ROWS constant)
    const skeletonRows = container.querySelectorAll('.p-6');
    expect(skeletonRows).toHaveLength(8);
  });

  it('renders skeleton elements for each row', () => {
    const { container } = render(<LoadingState />);
    
    // Each row should have the expected skeleton structure
    const rankSkeletons = container.querySelectorAll('.w-16.h-12');
    const profileSkeletons = container.querySelectorAll('.w-14.h-14.rounded-full');
    const nameSkeletons = container.querySelectorAll('.h-6.w-32');
    const scoreSkeletons = container.querySelectorAll('.h-8.w-16');
    
    expect(rankSkeletons).toHaveLength(8);
    expect(profileSkeletons).toHaveLength(8);
    expect(nameSkeletons).toHaveLength(8);
    expect(scoreSkeletons).toHaveLength(8);
  });

  it('has proper container structure', () => {
    const { container } = render(<LoadingState />);
    
    const mainContainer = container.querySelector('.divide-y.divide-slate-700\\/50');
    expect(mainContainer).toBeInTheDocument();
  });

  it('renders accessibility-friendly skeleton placeholders', () => {
    const { container } = render(<LoadingState />);
    
    // All skeleton elements should have the Skeleton component class
    const skeletonElements = container.querySelectorAll('[class*="animate-pulse"]');
    expect(skeletonElements.length).toBeGreaterThan(0);
  });

  it('maintains consistent layout structure', () => {
    const { container } = render(<LoadingState />);
    
    // Each row should have the same layout structure
    const rows = container.querySelectorAll('.p-6');
    
    rows.forEach(row => {
      // Should have flex layout with items-center and justify-between
      const flexContainer = row.querySelector('.flex.items-center.justify-between');
      expect(flexContainer).toBeInTheDocument();
      
      // Should have left section with rank, profile, and info
      const leftSection = row.querySelector('.flex.items-center.space-x-5');
      expect(leftSection).toBeInTheDocument();
      
      // Should have right section with score
      const rightSection = row.querySelector('.text-right.space-y-1');
      expect(rightSection).toBeInTheDocument();
    });
  });
});
