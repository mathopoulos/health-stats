import { createEmptyBloodMarkers, processBloodMarkersData } from './blood-marker-processing';
import type { BloodMarkersCollection } from '@/types/dashboard';

describe('blood-marker-processing', () => {
  describe('createEmptyBloodMarkers', () => {
    it('should create an empty blood markers collection with all properties', () => {
      const result = createEmptyBloodMarkers();

      // Check that result is an object
      expect(typeof result).toBe('object');
      expect(result).not.toBeNull();

      // Check some key properties exist and are empty arrays
      expect(Array.isArray(result.totalCholesterol)).toBe(true);
      expect(result.totalCholesterol).toHaveLength(0);
      expect(Array.isArray(result.hdl)).toBe(true);
      expect(result.hdl).toHaveLength(0);
      expect(Array.isArray(result.biologicalAge)).toBe(true);
      expect(result.biologicalAge).toHaveLength(0);
    });

    it('should include all expected blood marker categories', () => {
      const result = createEmptyBloodMarkers();

      // Lipid Panel
      expect(result).toHaveProperty('totalCholesterol');
      expect(result).toHaveProperty('ldl');
      expect(result).toHaveProperty('hdl');
      expect(result).toHaveProperty('triglycerides');
      expect(result).toHaveProperty('apoB');
      expect(result).toHaveProperty('lpA');

      // Complete Blood Count
      expect(result).toHaveProperty('whiteBloodCells');
      expect(result).toHaveProperty('redBloodCells');
      expect(result).toHaveProperty('hematocrit');
      expect(result).toHaveProperty('hemoglobin');
      expect(result).toHaveProperty('platelets');

      // Hormones
      expect(result).toHaveProperty('testosterone');
      expect(result).toHaveProperty('freeTesto');
      expect(result).toHaveProperty('estradiol');

      // Thyroid
      expect(result).toHaveProperty('t3');
      expect(result).toHaveProperty('t4');
      expect(result).toHaveProperty('tsh');

      // Additional markers
      expect(result).toHaveProperty('creatineKinase');
      expect(result).toHaveProperty('cortisol');
      expect(result).toHaveProperty('biologicalAge');
    });

    it('should return different instances on multiple calls', () => {
      const result1 = createEmptyBloodMarkers();
      const result2 = createEmptyBloodMarkers();

      expect(result1).not.toBe(result2);
      expect(result1.totalCholesterol).not.toBe(result2.totalCholesterol);
    });
  });

  describe('processBloodMarkersData', () => {
    const createMockApiData = (entries: Array<{
      date: string;
      markers: Array<{ name: string; value: number; unit: string; referenceRange?: any }>;
    }>) => ({
      success: true,
      data: entries
    });

    it('should return empty collection when apiData is null or undefined', () => {
      expect(processBloodMarkersData(null)).toEqual(createEmptyBloodMarkers());
      expect(processBloodMarkersData(undefined)).toEqual(createEmptyBloodMarkers());
    });

    it('should return empty collection when apiData.success is false', () => {
      const apiData = { success: false, data: [] };
      expect(processBloodMarkersData(apiData)).toEqual(createEmptyBloodMarkers());
    });

    it('should return empty collection when apiData.data is missing', () => {
      const apiData = { success: true };
      expect(processBloodMarkersData(apiData)).toEqual(createEmptyBloodMarkers());
    });

    it('should process standard blood marker names correctly', () => {
      const apiData = createMockApiData([
        {
          date: '2024-01-15',
          markers: [
            { name: 'Total Cholesterol', value: 200, unit: 'mg/dL' },
            { name: 'HDL Cholesterol', value: 50, unit: 'mg/dL' },
            { name: 'LDL Cholesterol', value: 120, unit: 'mg/dL' }
          ]
        }
      ]);

      const result = processBloodMarkersData(apiData);

      expect(result.totalCholesterol).toHaveLength(1);
      expect(result.totalCholesterol[0]).toEqual({
        date: '2024-01-15',
        value: 200,
        unit: 'mg/dL',
        referenceRange: undefined
      });

      expect(result.hdl).toHaveLength(1);
      expect(result.hdl[0].value).toBe(50);

      expect(result.ldl).toHaveLength(1);
      expect(result.ldl[0].value).toBe(120);
    });

    it('should process alternative marker names correctly', () => {
      const apiData = createMockApiData([
        {
          date: '2024-01-15',
          markers: [
            { name: 'LDL-C', value: 110, unit: 'mg/dL' },
            { name: 'HDL-C', value: 55, unit: 'mg/dL' },
            { name: 'WBC', value: 7.2, unit: 'K/uL' },
            { name: 'RBC', value: 4.5, unit: 'M/uL' }
          ]
        }
      ]);

      const result = processBloodMarkersData(apiData);

      expect(result.ldl[0].value).toBe(110);
      expect(result.hdl[0].value).toBe(55);
      expect(result.whiteBloodCells[0].value).toBe(7.2);
      expect(result.redBloodCells[0].value).toBe(4.5);
    });

    it('should process CBC differentials correctly', () => {
      const apiData = createMockApiData([
        {
          date: '2024-01-15',
          markers: [
            { name: 'Neutrophil Count', value: 4.2, unit: 'K/uL' },
            { name: 'Neutrophils %', value: 60, unit: '%' },
            { name: 'Lymphocyte Count', value: 2.1, unit: 'K/uL' },
            { name: 'Lymphocytes %', value: 30, unit: '%' }
          ]
        }
      ]);

      const result = processBloodMarkersData(apiData);

      expect(result.neutrophilCount[0].value).toBe(4.2);
      expect(result.neutrophilPercentage[0].value).toBe(60);
      expect(result.lymphocyteCount[0].value).toBe(2.1);
      expect(result.lymphocytePercentage[0].value).toBe(30);
    });

    it('should process thyroid markers correctly', () => {
      const apiData = createMockApiData([
        {
          date: '2024-01-15',
          markers: [
            { name: 'TSH', value: 2.1, unit: 'mIU/L' },
            { name: 'Free T4', value: 1.2, unit: 'ng/dL' },
            { name: 'Free T3', value: 3.1, unit: 'pg/mL' }
          ]
        }
      ]);

      const result = processBloodMarkersData(apiData);

      expect(result.tsh[0].value).toBe(2.1);
      expect(result.t4[0].value).toBe(1.2);
      expect(result.t3[0].value).toBe(3.1);
    });

    it('should process vitamin and mineral markers correctly', () => {
      const apiData = createMockApiData([
        {
          date: '2024-01-15',
          markers: [
            { name: 'Vitamin D', value: 32, unit: 'ng/mL' },
            { name: 'Vitamin B12', value: 450, unit: 'pg/mL' },
            { name: 'Folate', value: 12, unit: 'ng/mL' }
          ]
        }
      ]);

      const result = processBloodMarkersData(apiData);

      expect(result.vitaminD[0].value).toBe(32);
      expect(result.vitaminB12[0].value).toBe(450);
      expect(result.folate[0].value).toBe(12);
    });

    it('should handle reference ranges correctly', () => {
      const apiData = createMockApiData([
        {
          date: '2024-01-15',
          markers: [
            { 
              name: 'Total Cholesterol', 
              value: 200, 
              unit: 'mg/dL',
              referenceRange: { min: 100, max: 239 }
            }
          ]
        }
      ]);

      const result = processBloodMarkersData(apiData);

      expect(result.totalCholesterol[0].referenceRange).toEqual({ min: 100, max: 239 });
    });

    it('should fall back to camelCase conversion for unknown marker names', () => {
      const apiData = createMockApiData([
        {
          date: '2024-01-15',
          markers: [
            { name: 'Some Unknown Marker', value: 123, unit: 'units' }
          ]
        }
      ]);

      const result = processBloodMarkersData(apiData);
      
      // The camelCase conversion should make this "someUnknownMarker"
      // Since this isn't a valid key in BloodMarkersCollection, it should be ignored
      // All arrays should remain empty
      Object.values(result).forEach(markerArray => {
        expect(markerArray).toHaveLength(0);
      });
    });

    it('should handle multiple entries and sort by date (newest first)', () => {
      const apiData = createMockApiData([
        {
          date: '2024-01-10',
          markers: [{ name: 'Total Cholesterol', value: 180, unit: 'mg/dL' }]
        },
        {
          date: '2024-01-20',
          markers: [{ name: 'Total Cholesterol', value: 190, unit: 'mg/dL' }]
        },
        {
          date: '2024-01-15',
          markers: [{ name: 'Total Cholesterol', value: 185, unit: 'mg/dL' }]
        }
      ]);

      const result = processBloodMarkersData(apiData);

      expect(result.totalCholesterol).toHaveLength(3);
      // Should be sorted by date descending (newest first)
      expect(result.totalCholesterol[0].date).toBe('2024-01-20');
      expect(result.totalCholesterol[0].value).toBe(190);
      expect(result.totalCholesterol[1].date).toBe('2024-01-15');
      expect(result.totalCholesterol[1].value).toBe(185);
      expect(result.totalCholesterol[2].date).toBe('2024-01-10');
      expect(result.totalCholesterol[2].value).toBe(180);
    });

    it('should handle multiple markers in single entry', () => {
      const apiData = createMockApiData([
        {
          date: '2024-01-15',
          markers: [
            { name: 'Total Cholesterol', value: 200, unit: 'mg/dL' },
            { name: 'HDL Cholesterol', value: 50, unit: 'mg/dL' },
            { name: 'LDL Cholesterol', value: 120, unit: 'mg/dL' },
            { name: 'Triglycerides', value: 150, unit: 'mg/dL' }
          ]
        }
      ]);

      const result = processBloodMarkersData(apiData);

      expect(result.totalCholesterol).toHaveLength(1);
      expect(result.hdl).toHaveLength(1);
      expect(result.ldl).toHaveLength(1);
      expect(result.triglycerides).toHaveLength(1);

      expect(result.totalCholesterol[0].value).toBe(200);
      expect(result.hdl[0].value).toBe(50);
      expect(result.ldl[0].value).toBe(120);
      expect(result.triglycerides[0].value).toBe(150);
    });

    it('should handle entries without markers array', () => {
      const apiData = {
        success: true,
        data: [
          { date: '2024-01-15' }, // No markers array
          {
            date: '2024-01-16',
            markers: [{ name: 'Total Cholesterol', value: 200, unit: 'mg/dL' }]
          }
        ]
      };

      const result = processBloodMarkersData(apiData);

      // Should only process the entry with markers
      expect(result.totalCholesterol).toHaveLength(1);
      expect(result.totalCholesterol[0].date).toBe('2024-01-16');
    });

    it('should handle biological age marker correctly', () => {
      const apiData = createMockApiData([
        {
          date: '2024-01-15',
          markers: [
            { name: 'Biological Age', value: 35.5, unit: 'years' }
          ]
        }
      ]);

      const result = processBloodMarkersData(apiData);

      expect(result.biologicalAge).toHaveLength(1);
      expect(result.biologicalAge[0].value).toBe(35.5);
      expect(result.biologicalAge[0].unit).toBe('years');
    });

    it('should handle iron panel markers correctly', () => {
      const apiData = createMockApiData([
        {
          date: '2024-01-15',
          markers: [
            { name: 'Ferritin', value: 85, unit: 'ng/mL' },
            { name: 'TIBC', value: 350, unit: 'µg/dL' },
            { name: 'TSAT', value: 25, unit: '%' }
          ]
        }
      ]);

      const result = processBloodMarkersData(apiData);

      expect(result.ferritin[0].value).toBe(85);
      expect(result.tibc[0].value).toBe(350);
      expect(result.transferrinSaturation[0].value).toBe(25);
    });

    it('should handle electrolyte markers with abbreviations', () => {
      const apiData = createMockApiData([
        {
          date: '2024-01-15',
          markers: [
            { name: 'Na', value: 140, unit: 'mmol/L' },
            { name: 'K', value: 4.0, unit: 'mmol/L' },
            { name: 'Cl', value: 102, unit: 'mmol/L' }
          ]
        }
      ]);

      const result = processBloodMarkersData(apiData);

      expect(result.sodium[0].value).toBe(140);
      expect(result.potassium[0].value).toBe(4.0);
      expect(result.chloride[0].value).toBe(102);
    });
  });
});
