import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import DataTable from '../DataTable';

// Mock data for testing
interface TestItem {
  id: string;
  name: string;
  value: number;
  status: string;
}

const mockData: TestItem[] = [
  { id: '1', name: 'Item 1', value: 100, status: 'active' },
  { id: '2', name: 'Item 2', value: 200, status: 'inactive' },
  { id: '3', name: 'Item 3', value: 300, status: 'active' },
];

const mockColumns = [
  { key: 'name', title: 'Name' },
  { key: 'value', title: 'Value' },
  { key: 'status', title: 'Status' },
];

const mockColumnsWithRender = [
  { key: 'name', title: 'Name' },
  { 
    key: 'value', 
    title: 'Value',
    render: (item: TestItem) => `$${item.value}`,
  },
  { 
    key: 'status', 
    title: 'Status',
    render: (item: TestItem) => (
      <span className={item.status === 'active' ? 'text-green-500' : 'text-red-500'}>
        {item.status}
      </span>
    ),
  },
];

const mockColumnsWithClassName = [
  { key: 'name', title: 'Name', className: 'custom-name-class' },
  { key: 'value', title: 'Value', className: 'custom-value-class' },
];

describe('DataTable', () => {
  describe('Loading state', () => {
    it('renders loading spinner when loading is true', () => {
      render(
        <DataTable
          data={[]}
          columns={mockColumns}
          loading={true}
        />
      );

      expect(screen.getByText('Loading...')).toBeInTheDocument();
      const spinner = screen.getByText('Loading...').previousElementSibling;
      expect(spinner).toHaveClass('animate-spin');
    });
  });

  describe('Empty state', () => {
    it('renders default empty message when data is empty', () => {
      render(
        <DataTable
          data={[]}
          columns={mockColumns}
        />
      );

      expect(screen.getByText('No data available')).toBeInTheDocument();
    });

    it('renders custom empty message when provided', () => {
      const customMessage = 'No items found';
      render(
        <DataTable
          data={[]}
          columns={mockColumns}
          emptyMessage={customMessage}
        />
      );

      expect(screen.getByText(customMessage)).toBeInTheDocument();
    });
  });

  describe('Basic table rendering', () => {
    it('renders table with data and columns', () => {
      render(
        <DataTable
          data={mockData}
          columns={mockColumns}
        />
      );

      // Check headers
      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Value')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();

      // Check data rows
      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument();
      expect(screen.getAllByText('active')).toHaveLength(2);
      expect(screen.getByText('Item 2')).toBeInTheDocument();
      expect(screen.getByText('200')).toBeInTheDocument();
      expect(screen.getByText('inactive')).toBeInTheDocument();
    });

    it('applies custom className to table container', () => {
      const customClass = 'custom-table-class';
      const { container } = render(
        <DataTable
          data={mockData}
          columns={mockColumns}
          className={customClass}
        />
      );

      expect(container.firstChild).toHaveClass(`overflow-x-auto ${customClass}`);
    });

    it('applies column className to header and cell elements', () => {
      render(
        <DataTable
          data={mockData}
          columns={mockColumnsWithClassName}
        />
      );

      // Check header classes
      const nameHeader = screen.getByText('Name').closest('th');
      const valueHeader = screen.getByText('Value').closest('th');
      
      expect(nameHeader).toHaveClass('custom-name-class');
      expect(valueHeader).toHaveClass('custom-value-class');

      // Check cell classes
      const nameCells = screen.getAllByText(/Item \d/);
      const valueCells = screen.getAllByText(/100|200|300/);
      
      nameCells.forEach(cell => {
        expect(cell.closest('td')).toHaveClass('custom-name-class');
      });
      
      valueCells.forEach(cell => {
        expect(cell.closest('td')).toHaveClass('custom-value-class');
      });
    });
  });

  describe('Custom column rendering', () => {
    it('uses custom render function when provided', () => {
      render(
        <DataTable
          data={mockData}
          columns={mockColumnsWithRender}
        />
      );

      // Check custom value rendering
      expect(screen.getByText('$100')).toBeInTheDocument();
      expect(screen.getByText('$200')).toBeInTheDocument();
      expect(screen.getByText('$300')).toBeInTheDocument();

      // Check custom status rendering with classes
      const activeStatus = screen.getAllByText('active');
      const inactiveStatus = screen.getAllByText('inactive');
      
      activeStatus.forEach(element => {
        expect(element).toHaveClass('text-green-500');
      });
      
      inactiveStatus.forEach(element => {
        expect(element).toHaveClass('text-red-500');
      });
    });

    it('falls back to string conversion when no render function provided', () => {
      render(
        <DataTable
          data={mockData}
          columns={mockColumns}
        />
      );

      // Numbers should be converted to strings
      expect(screen.getByText('100')).toBeInTheDocument();
      expect(screen.getByText('200')).toBeInTheDocument();
      expect(screen.getByText('300')).toBeInTheDocument();
    });

    it('handles missing properties gracefully', () => {
      const dataWithMissingProps = [
        { id: '1', name: 'Item 1' }, // missing value and status
      ];

      render(
        <DataTable
          data={dataWithMissingProps}
          columns={mockColumns}
        />
      );

      expect(screen.getByText('Item 1')).toBeInTheDocument();
      // Should render empty strings for missing properties
      const row = screen.getByText('Item 1').closest('tr');
      expect(row).toBeInTheDocument();
    });
  });

  describe('Selectable functionality', () => {
    const mockGetItemId = (item: TestItem) => item.id;
    const mockOnSelectItem = jest.fn();
    const mockOnSelectAll = jest.fn();

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('renders selection checkboxes when selectable is true', () => {
      render(
        <DataTable
          data={mockData}
          columns={mockColumns}
          selectable={true}
          selectedItems={new Set()}
          onSelectItem={mockOnSelectItem}
          onSelectAll={mockOnSelectAll}
          getItemId={mockGetItemId}
        />
      );

      // Should have select all checkbox in header + one per row
      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes).toHaveLength(mockData.length + 1);
    });

    it('does not render selection checkboxes when selectable is false', () => {
      render(
        <DataTable
          data={mockData}
          columns={mockColumns}
          selectable={false}
        />
      );

      expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    });

    it('calls onSelectItem when individual checkbox is clicked', () => {
      render(
        <DataTable
          data={mockData}
          columns={mockColumns}
          selectable={true}
          selectedItems={new Set()}
          onSelectItem={mockOnSelectItem}
          onSelectAll={mockOnSelectAll}
          getItemId={mockGetItemId}
        />
      );

      const checkboxes = screen.getAllByRole('checkbox');
      // First checkbox is select all, second is first item
      fireEvent.click(checkboxes[1]);

      expect(mockOnSelectItem).toHaveBeenCalledWith('1');
    });

    it('calls onSelectAll when select all checkbox is clicked', () => {
      render(
        <DataTable
          data={mockData}
          columns={mockColumns}
          selectable={true}
          selectedItems={new Set()}
          onSelectItem={mockOnSelectItem}
          onSelectAll={mockOnSelectAll}
          getItemId={mockGetItemId}
        />
      );

      const selectAllCheckbox = screen.getAllByRole('checkbox')[0];
      fireEvent.click(selectAllCheckbox);

      expect(mockOnSelectAll).toHaveBeenCalled();
    });

    it('shows correct selection state for individual items', () => {
      const selectedItems = new Set(['1', '3']);
      
      render(
        <DataTable
          data={mockData}
          columns={mockColumns}
          selectable={true}
          selectedItems={selectedItems}
          onSelectItem={mockOnSelectItem}
          onSelectAll={mockOnSelectAll}
          getItemId={mockGetItemId}
        />
      );

      const checkboxes = screen.getAllByRole('checkbox');
      
      // Select all should be unchecked (not all items selected)
      expect(checkboxes[0]).not.toBeChecked();
      
      // Items 1 and 3 should be checked
      expect(checkboxes[1]).toBeChecked(); // Item 1
      expect(checkboxes[2]).not.toBeChecked(); // Item 2
      expect(checkboxes[3]).toBeChecked(); // Item 3
    });

    it('shows select all as checked when all items are selected', () => {
      const selectedItems = new Set(['1', '2', '3']);
      
      render(
        <DataTable
          data={mockData}
          columns={mockColumns}
          selectable={true}
          selectedItems={selectedItems}
          onSelectItem={mockOnSelectItem}
          onSelectAll={mockOnSelectAll}
          getItemId={mockGetItemId}
        />
      );

      const selectAllCheckbox = screen.getAllByRole('checkbox')[0];
      expect(selectAllCheckbox).toBeChecked();
    });

    it('applies selection styling to selected rows', () => {
      const selectedItems = new Set(['1']);
      
      render(
        <DataTable
          data={mockData}
          columns={mockColumns}
          selectable={true}
          selectedItems={selectedItems}
          onSelectItem={mockOnSelectItem}
          onSelectAll={mockOnSelectAll}
          getItemId={mockGetItemId}
        />
      );

      const item1Row = screen.getByText('Item 1').closest('tr');
      const item2Row = screen.getByText('Item 2').closest('tr');
      
      expect(item1Row).toHaveClass('bg-indigo-50', 'dark:bg-indigo-900/20');
      expect(item2Row).not.toHaveClass('bg-indigo-50', 'dark:bg-indigo-900/20');
    });

    it('uses index as fallback when getItemId is not provided', () => {
      render(
        <DataTable
          data={mockData}
          columns={mockColumns}
          selectable={true}
          selectedItems={new Set(['0', '2'])}
          onSelectItem={mockOnSelectItem}
          onSelectAll={mockOnSelectAll}
        />
      );

      const checkboxes = screen.getAllByRole('checkbox');
      
      // Items at index 0 and 2 should be selected
      expect(checkboxes[1]).toBeChecked(); // Index 0
      expect(checkboxes[2]).not.toBeChecked(); // Index 1
      expect(checkboxes[3]).toBeChecked(); // Index 2
    });

    it('handles onSelectItem being undefined gracefully', () => {
      render(
        <DataTable
          data={mockData}
          columns={mockColumns}
          selectable={true}
          selectedItems={new Set()}
          getItemId={mockGetItemId}
        />
      );

      const checkboxes = screen.getAllByRole('checkbox');
      
      // Should not throw error when clicking
      expect(() => {
        fireEvent.click(checkboxes[1]);
      }).not.toThrow();
    });
  });

  describe('Row styling', () => {
    it('applies alternating row colors', () => {
      render(
        <DataTable
          data={mockData}
          columns={mockColumns}
        />
      );

      const item1Row = screen.getByText('Item 1').closest('tr');
      const item2Row = screen.getByText('Item 2').closest('tr');
      const item3Row = screen.getByText('Item 3').closest('tr');
      
      // Even rows (index 0, 2) should have one style
      expect(item1Row).toHaveClass('bg-white', 'dark:bg-gray-800');
      expect(item3Row).toHaveClass('bg-white', 'dark:bg-gray-800');
      
      // Odd rows (index 1) should have another style
      expect(item2Row).toHaveClass('bg-gray-50', 'dark:bg-gray-700/30');
    });
  });

  describe('Edge cases', () => {
    it('handles empty columns array', () => {
      render(
        <DataTable
          data={mockData}
          columns={[]}
        />
      );

      // Should render table structure but no column headers
      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();
    });

    it('handles single item data', () => {
      const singleItem = [mockData[0]];
      
      render(
        <DataTable
          data={singleItem}
          columns={mockColumns}
        />
      );

      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument();
    });

    it('renders correct structure with no selectable props provided', () => {
      render(
        <DataTable
          data={mockData}
          columns={mockColumns}
        />
      );

      // Should work with defaults
      expect(screen.getByRole('table')).toBeInTheDocument();
      expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    });
  });
});
