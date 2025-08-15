import React from 'react';
import { render, screen, fireEvent, within } from '@/test-utils';
import { BloodTab } from '../BloodTab';
import type { ChartData, BloodMarker } from '@/types/dashboard';

// Mock blood marker data factory - creates recent dates
const createBloodMarkerData = (values: Array<{ value: number; unit: string; date?: string }>): BloodMarker[] => {
  const now = new Date();
  return values.map((item, index) => ({
    date: item.date || new Date(now.getTime() - index * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    value: item.value,
    unit: item.unit,
  }));
};

// Create mock chart data with some blood markers
const createMockChartData = (): ChartData => ({
  heartRate: [],
  weight: [],
  bodyFat: [],
  hrv: [],
  vo2max: [],
  bloodMarkers: {
    // Lipid Panel
    totalCholesterol: createBloodMarkerData([{ value: 180, unit: 'mg/dL' }]),
    ldl: createBloodMarkerData([{ value: 100, unit: 'mg/dL' }]),
    hdl: createBloodMarkerData([{ value: 60, unit: 'mg/dL' }]),
    triglycerides: createBloodMarkerData([{ value: 120, unit: 'mg/dL' }]),
    apoB: [],
    lpA: [],
    
    // Complete Blood Count  
    whiteBloodCells: createBloodMarkerData([{ value: 6.5, unit: 'K/uL' }]),
    redBloodCells: createBloodMarkerData([{ value: 4.5, unit: 'M/uL' }]),
    hematocrit: [],
    hemoglobin: [],
    platelets: [],
    
    // CBC Differentials
    neutrophilCount: [],
    neutrophilPercentage: [],
    lymphocyteCount: [],
    lymphocytePercentage: [],
    monocyteCount: [],
    monocytePercentage: [],
    eosinophilCount: [],
    eosinophilPercentage: [],
    basophilCount: [],
    basophilPercentage: [],
    
    // Red Blood Cell Indices
    mcv: [],
    mch: [],
    mchc: [],
    rdw: [],
    mpv: [],
    
    // Glucose Markers
    hba1c: createBloodMarkerData([{ value: 5.2, unit: '%' }]),
    fastingInsulin: [],
    glucose: createBloodMarkerData([{ value: 95, unit: 'mg/dL' }]),
    
    // Liver Markers
    alt: [],
    ast: [],
    ggt: [],
    
    // Kidney Markers  
    egfr: [],
    cystatinC: [],
    bun: [],
    creatinine: [],
    albumin: [],
    
    // Sex Hormones
    testosterone: [],
    freeTesto: [],
    estradiol: [],
    shbg: [],
    
    // Thyroid Markers
    t3: [],
    t4: [],
    tsh: [],
    
    // Vitamins & Minerals
    vitaminD: createBloodMarkerData([{ value: 40, unit: 'ng/mL' }]),
    vitaminB12: [],
    folate: [],
    iron: [],
    magnesium: [],
    rbcMagnesium: [],
    
    // Inflammation
    crp: [],
    homocysteine: [],
    
    // Growth Factors
    igf1: [],
    
    // Iron Panel
    ferritin: [],
    serumIron: [],
    tibc: [],
    transferrinSaturation: [],
    
    // Electrolytes
    sodium: [],
    potassium: [],
    calcium: [],
    phosphorus: [],
    bicarbonate: [],
    chloride: [],
    
    // Additional markers
    creatinekinase: [],
    cortisol: [],
    
    // Longevity Markers
    biologicalAge: []
  }
});

describe('BloodTab', () => {
  const mockOnMarkerClick = jest.fn();
  const mockData = createMockChartData();

  beforeEach(() => {
    mockOnMarkerClick.mockClear();
  });

  it('renders all blood marker sections', () => {
    render(
      <BloodTab 
        data={mockData}
        onMarkerClick={mockOnMarkerClick}
      />
    );
    
    // Check that main sections are present
    expect(screen.getByText('Lipid Panel')).toBeInTheDocument();
    expect(screen.getByText('Complete Blood Count')).toBeInTheDocument();
    expect(screen.getByText('Glucose Markers')).toBeInTheDocument();
    expect(screen.getByText('Vitamins & Minerals')).toBeInTheDocument();
    expect(screen.getByText('Additional Markers')).toBeInTheDocument();
  });

  it('displays blood marker values correctly', () => {
    render(
      <BloodTab 
        data={mockData}
        onMarkerClick={mockOnMarkerClick}
      />
    );
    
    // Check specific marker values are displayed
    expect(screen.getByText('180 mg/dL')).toBeInTheDocument(); // Total Cholesterol
    expect(screen.getByText('100 mg/dL')).toBeInTheDocument(); // LDL
    expect(screen.getByText('60 mg/dL')).toBeInTheDocument(); // HDL
    expect(screen.getByText('5.2 %')).toBeInTheDocument(); // HbA1c
    expect(screen.getAllByText('40 ng/mL')).toHaveLength(2); // Vitamin D appears in two sections
  });

  it('shows "No data" for markers without values', () => {
    render(
      <BloodTab 
        data={mockData}
        onMarkerClick={mockOnMarkerClick}
      />
    );
    
    // Should show "No data" for markers without values
    const noDataElements = screen.getAllByText('No data');
    expect(noDataElements.length).toBeGreaterThan(0);
  });

  it('displays marker labels correctly', () => {
    render(
      <BloodTab 
        data={mockData}
        onMarkerClick={mockOnMarkerClick}
      />
    );
    
    // Check that marker labels are present
    expect(screen.getByText('Total Cholesterol')).toBeInTheDocument();
    expect(screen.getByText('LDL Cholesterol')).toBeInTheDocument();
    expect(screen.getByText('HDL Cholesterol')).toBeInTheDocument();
    expect(screen.getByText('Triglycerides')).toBeInTheDocument();
    expect(screen.getByText('HbA1c')).toBeInTheDocument();
    expect(screen.getByText('Glucose')).toBeInTheDocument();
    expect(screen.getByText('Vitamin D')).toBeInTheDocument();
  });

  it('calls onMarkerClick when a marker with data is clicked', () => {
    render(
      <BloodTab 
        data={mockData}
        onMarkerClick={mockOnMarkerClick}
      />
    );
    
    // Find and click on a marker row that has data
    const cholesterolRow = screen.getByText('Total Cholesterol').closest('div');
    expect(cholesterolRow).toBeInTheDocument();
    
    fireEvent.click(cholesterolRow!);
    
    expect(mockOnMarkerClick).toHaveBeenCalledWith(
      'Total Cholesterol',
      mockData.bloodMarkers.totalCholesterol
    );
  });

  it('displays last tested dates correctly', () => {
    render(
      <BloodTab 
        data={mockData}
        onMarkerClick={mockOnMarkerClick}
      />
    );
    
    // Should show last tested dates for sections with data
    const lastTestedElements = screen.getAllByText(/Last tested:/);
    expect(lastTestedElements.length).toBeGreaterThan(0);
    
    // Check that last tested dates are present (format may vary by locale)
    expect(lastTestedElements[0]).toHaveTextContent(/Last tested:/);
    // Check for current year (test should work regardless of when it's run)
    const currentYear = new Date().getFullYear().toString();
    expect(lastTestedElements[0]).toHaveTextContent(new RegExp(currentYear));
  });

  describe('Section organization', () => {
    it('organizes lipid markers in the lipid panel section', () => {
      render(
        <BloodTab 
          data={mockData}
          onMarkerClick={mockOnMarkerClick}
        />
      );
      
      const lipidSection = screen.getByText('Lipid Panel').closest('div');
      expect(lipidSection).toBeInTheDocument();
      
      // All lipid markers should be in this section
      within(lipidSection!).getByText('Total Cholesterol');
      within(lipidSection!).getByText('LDL Cholesterol');
      within(lipidSection!).getByText('HDL Cholesterol');
      within(lipidSection!).getByText('Triglycerides');
    });

    it('organizes CBC markers in the complete blood count section', () => {
      render(
        <BloodTab 
          data={mockData}
          onMarkerClick={mockOnMarkerClick}
        />
      );
      
      const cbcSection = screen.getByText('Complete Blood Count').closest('div');
      expect(cbcSection).toBeInTheDocument();
      
      // CBC markers should be in this section
      within(cbcSection!).getByText('White Blood Cells');
      within(cbcSection!).getByText('Red Blood Cells');
    });

    it('organizes glucose markers in the glucose section', () => {
      render(
        <BloodTab 
          data={mockData}
          onMarkerClick={mockOnMarkerClick}
        />
      );
      
      const glucoseSection = screen.getByText('Glucose Markers').closest('div');
      expect(glucoseSection).toBeInTheDocument();
      
      // Glucose markers should be in this section
      within(glucoseSection!).getByText('HbA1c');
      within(glucoseSection!).getByText('Glucose');
    });
  });

  describe('Grid layout', () => {
    it('uses appropriate CSS classes for responsive grid layout', () => {
      render(
        <BloodTab 
          data={mockData}
          onMarkerClick={mockOnMarkerClick}
        />
      );
      
      // Check that the grid container has the correct classes
      const gridContainer = screen.getByText('Lipid Panel').closest('.grid');
      expect(gridContainer).toHaveClass('grid-cols-1', 'lg:grid-cols-2', 'gap-8');
    });
  });

  describe('Empty state handling', () => {
    it('handles completely empty blood markers gracefully', () => {
      const emptyData: ChartData = {
        ...mockData,
        bloodMarkers: {
          ...mockData.bloodMarkers,
          totalCholesterol: [],
          ldl: [],
          hdl: [],
          triglycerides: [],
          hba1c: [],
          glucose: [],
          vitaminD: [],
        }
      };

      render(
        <BloodTab 
          data={emptyData}
          onMarkerClick={mockOnMarkerClick}
        />
      );
      
      // Should still show section headers
      expect(screen.getByText('Lipid Panel')).toBeInTheDocument();
      expect(screen.getByText('Glucose Markers')).toBeInTheDocument();
      
      // Should show "No data" for all markers
      const noDataElements = screen.getAllByText('No data');
      expect(noDataElements.length).toBeGreaterThan(10); // Many markers should show "No data"
    });
  });
});
