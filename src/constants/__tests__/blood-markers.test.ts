import { BLOOD_MARKER_RANGES, OWNER_ID, type BloodMarkerRange } from '../blood-markers';

describe('BLOOD_MARKER_RANGES', () => {
  describe('Data Structure', () => {
    it('is defined and is an object', () => {
      expect(BLOOD_MARKER_RANGES).toBeDefined();
      expect(typeof BLOOD_MARKER_RANGES).toBe('object');
      expect(BLOOD_MARKER_RANGES).not.toBeNull();
    });

    it('contains expected number of markers', () => {
      const markerCount = Object.keys(BLOOD_MARKER_RANGES).length;
      expect(markerCount).toBeGreaterThan(50); // We have 60+ markers
    });

    it('all values are BloodMarkerRange objects', () => {
      Object.values(BLOOD_MARKER_RANGES).forEach((range: BloodMarkerRange) => {
        expect(typeof range).toBe('object');
        expect(typeof range.min).toBe('number');
        expect(typeof range.max).toBe('number');
        expect(range.decreaseIsGood === null || typeof range.decreaseIsGood === 'boolean').toBe(true);
      });
    });

    it('all ranges have valid min/max values', () => {
      Object.entries(BLOOD_MARKER_RANGES).forEach(([key, range]) => {
        expect(range.min).toBeGreaterThanOrEqual(0);
        expect(range.max).toBeGreaterThan(range.min);
        expect(Number.isFinite(range.min)).toBe(true);
        expect(Number.isFinite(range.max)).toBe(true);
      });
    });
  });

  describe('Lipid Panel Markers', () => {
    it('contains total cholesterol with correct range', () => {
      expect(BLOOD_MARKER_RANGES.totalCholesterol).toEqual({
        min: 100,
        max: 200,
        decreaseIsGood: true,
      });
    });

    it('contains LDL cholesterol with correct range', () => {
      expect(BLOOD_MARKER_RANGES.ldl).toEqual({
        min: 0,
        max: 100,
        decreaseIsGood: true,
      });
    });

    it('contains HDL cholesterol with correct range', () => {
      expect(BLOOD_MARKER_RANGES.hdl).toEqual({
        min: 40,
        max: 100,
        decreaseIsGood: false, // Higher HDL is better
      });
    });

    it('contains triglycerides with correct range', () => {
      expect(BLOOD_MARKER_RANGES.triglycerides).toEqual({
        min: 0,
        max: 150,
        decreaseIsGood: true,
      });
    });

    it('contains apolipoprotein B with correct range', () => {
      expect(BLOOD_MARKER_RANGES.apoB).toEqual({
        min: 0,
        max: 90,
        decreaseIsGood: true,
      });
    });

    it('contains lipoprotein(a) with correct range', () => {
      expect(BLOOD_MARKER_RANGES.lpA).toEqual({
        min: 0,
        max: 30,
        decreaseIsGood: true,
      });
    });
  });

  describe('Complete Blood Count Markers', () => {
    it('contains white blood cells with correct range', () => {
      expect(BLOOD_MARKER_RANGES.whiteBloodCells).toEqual({
        min: 3.4,
        max: 10.8,
        decreaseIsGood: null,
      });
    });

    it('contains red blood cells with correct range', () => {
      expect(BLOOD_MARKER_RANGES.redBloodCells).toEqual({
        min: 3.77,
        max: 5.28,
        decreaseIsGood: null,
      });
    });

    it('contains hematocrit with correct range', () => {
      expect(BLOOD_MARKER_RANGES.hematocrit).toEqual({
        min: 35.5,
        max: 48.6,
        decreaseIsGood: null,
      });
    });

    it('contains hemoglobin with correct range', () => {
      expect(BLOOD_MARKER_RANGES.hemoglobin).toEqual({
        min: 11.6,
        max: 15.5,
        decreaseIsGood: null,
      });
    });

    it('contains platelets with correct range', () => {
      expect(BLOOD_MARKER_RANGES.platelets).toEqual({
        min: 150,
        max: 379,
        decreaseIsGood: null,
      });
    });
  });

  describe('CBC Differential Markers', () => {
    const differentialMarkers = [
      'neutrophilCount', 'neutrophilPercentage',
      'lymphocyteCount', 'lymphocytePercentage',
      'monocyteCount', 'monocytePercentage',
      'eosinophilCount', 'eosinophilPercentage',
      'basophilCount', 'basophilPercentage'
    ];

    it('contains all differential markers', () => {
      differentialMarkers.forEach(marker => {
        expect(BLOOD_MARKER_RANGES[marker]).toBeDefined();
        expect(BLOOD_MARKER_RANGES[marker].decreaseIsGood).toBeNull();
      });
    });

    it('has consistent count vs percentage relationship', () => {
      const pairs = [
        ['neutrophilCount', 'neutrophilPercentage'],
        ['lymphocyteCount', 'lymphocytePercentage'],
        ['monocyteCount', 'monocytePercentage'],
        ['eosinophilCount', 'eosinophilPercentage'],
        ['basophilCount', 'basophilPercentage']
      ];

      pairs.forEach(([count, percentage]) => {
        expect(BLOOD_MARKER_RANGES[count]).toBeDefined();
        expect(BLOOD_MARKER_RANGES[percentage]).toBeDefined();
        // Percentage ranges should be smaller numbers than count ranges
        expect(BLOOD_MARKER_RANGES[percentage].max).toBeLessThanOrEqual(100);
      });
    });
  });

  describe('Red Blood Cell Indices', () => {
    const rbcIndices = ['mcv', 'mch', 'mchc', 'rdw', 'mpv'];

    it('contains all RBC indices', () => {
      rbcIndices.forEach(marker => {
        expect(BLOOD_MARKER_RANGES[marker]).toBeDefined();
        expect(BLOOD_MARKER_RANGES[marker].decreaseIsGood).toBeNull();
      });
    });

    it('contains MCV with correct range', () => {
      expect(BLOOD_MARKER_RANGES.mcv).toEqual({
        min: 79,
        max: 97,
        decreaseIsGood: null,
      });
    });
  });

  describe('Glucose Markers', () => {
    it('contains HbA1c with correct range', () => {
      expect(BLOOD_MARKER_RANGES.hba1c).toEqual({
        min: 4.8,
        max: 5.6,
        decreaseIsGood: true,
      });
    });

    it('contains fasting insulin with correct range', () => {
      expect(BLOOD_MARKER_RANGES.fastingInsulin).toEqual({
        min: 2.6,
        max: 24.9,
        decreaseIsGood: true,
      });
    });

    it('contains glucose with correct range', () => {
      expect(BLOOD_MARKER_RANGES.glucose).toEqual({
        min: 65,
        max: 99,
        decreaseIsGood: true,
      });
    });
  });

  describe('Liver Markers', () => {
    const liverMarkers = ['alt', 'ast', 'ggt'];

    it('contains all liver markers', () => {
      liverMarkers.forEach(marker => {
        expect(BLOOD_MARKER_RANGES[marker]).toBeDefined();
        expect(BLOOD_MARKER_RANGES[marker].decreaseIsGood).toBe(true);
      });
    });

    it('contains ALT with correct range', () => {
      expect(BLOOD_MARKER_RANGES.alt).toEqual({
        min: 0,
        max: 44,
        decreaseIsGood: true,
      });
    });

    it('contains AST with correct range', () => {
      expect(BLOOD_MARKER_RANGES.ast).toEqual({
        min: 0,
        max: 40,
        decreaseIsGood: true,
      });
    });

    it('contains GGT with correct range', () => {
      expect(BLOOD_MARKER_RANGES.ggt).toEqual({
        min: 3,
        max: 70,
        decreaseIsGood: true,
      });
    });
  });

  describe('Kidney Markers', () => {
    it('contains eGFR with correct range', () => {
      expect(BLOOD_MARKER_RANGES.egfr).toEqual({
        min: 90,
        max: 120,
        decreaseIsGood: false, // Higher eGFR is better
      });
    });

    it('contains creatinine with correct range', () => {
      expect(BLOOD_MARKER_RANGES.creatinine).toEqual({
        min: 0.7,
        max: 1.3,
        decreaseIsGood: true,
      });
    });

    it('contains BUN with correct range', () => {
      expect(BLOOD_MARKER_RANGES.bun).toEqual({
        min: 7,
        max: 20,
        decreaseIsGood: true,
      });
    });
  });

  describe('Sex Hormone Markers', () => {
    const sexHormones = ['testosterone', 'freeTesto', 'estradiol', 'shbg'];

    it('contains all sex hormone markers', () => {
      sexHormones.forEach(marker => {
        expect(BLOOD_MARKER_RANGES[marker]).toBeDefined();
        expect(BLOOD_MARKER_RANGES[marker].decreaseIsGood).toBeNull();
      });
    });

    it('contains testosterone with correct range', () => {
      expect(BLOOD_MARKER_RANGES.testosterone).toEqual({
        min: 300,
        max: 1000,
        decreaseIsGood: null,
      });
    });
  });

  describe('Thyroid Markers', () => {
    const thyroidMarkers = ['t3', 't4', 'tsh'];

    it('contains all thyroid markers', () => {
      thyroidMarkers.forEach(marker => {
        expect(BLOOD_MARKER_RANGES[marker]).toBeDefined();
        expect(BLOOD_MARKER_RANGES[marker].decreaseIsGood).toBeNull();
      });
    });

    it('contains TSH with correct range', () => {
      expect(BLOOD_MARKER_RANGES.tsh).toEqual({
        min: 0.4,
        max: 4.0,
        decreaseIsGood: null,
      });
    });
  });

  describe('Vitamin and Mineral Markers', () => {
    it('contains vitamin D with correct range', () => {
      expect(BLOOD_MARKER_RANGES.vitaminD).toEqual({
        min: 30,
        max: 80,
        decreaseIsGood: false, // Higher vitamin D is better
      });
    });

    it('contains vitamin B12 with correct range', () => {
      expect(BLOOD_MARKER_RANGES.vitaminB12).toEqual({
        min: 200,
        max: 1100,
        decreaseIsGood: false,
      });
    });

    it('contains folate with correct range', () => {
      expect(BLOOD_MARKER_RANGES.folate).toEqual({
        min: 3.4,
        max: 40,
        decreaseIsGood: false,
      });
    });
  });

  describe('Inflammation Markers', () => {
    it('contains CRP with correct range', () => {
      expect(BLOOD_MARKER_RANGES.crp).toEqual({
        min: 0,
        max: 1.0,
        decreaseIsGood: true,
      });
    });

    it('contains homocysteine with correct range', () => {
      expect(BLOOD_MARKER_RANGES.homocysteine).toEqual({
        min: 0,
        max: 15,
        decreaseIsGood: true,
      });
    });
  });

  describe('Iron Panel Markers', () => {
    const ironMarkers = ['ferritin', 'serumIron', 'tibc', 'transferrinSaturation'];

    it('contains all iron panel markers', () => {
      ironMarkers.forEach(marker => {
        expect(BLOOD_MARKER_RANGES[marker]).toBeDefined();
        expect(BLOOD_MARKER_RANGES[marker].decreaseIsGood).toBeNull();
      });
    });

    it('contains ferritin with correct range', () => {
      expect(BLOOD_MARKER_RANGES.ferritin).toEqual({
        min: 20,
        max: 345,
        decreaseIsGood: null,
      });
    });
  });

  describe('Electrolyte Markers', () => {
    const electrolytes = ['sodium', 'potassium', 'calcium', 'phosphorus', 'bicarbonate', 'chloride'];

    it('contains all electrolyte markers', () => {
      electrolytes.forEach(marker => {
        expect(BLOOD_MARKER_RANGES[marker]).toBeDefined();
        expect(BLOOD_MARKER_RANGES[marker].decreaseIsGood).toBeNull();
      });
    });

    it('contains sodium with correct range', () => {
      expect(BLOOD_MARKER_RANGES.sodium).toEqual({
        min: 135,
        max: 146,
        decreaseIsGood: null,
      });
    });
  });

  describe('Additional Markers', () => {
    it('contains creatine kinase with correct range', () => {
      expect(BLOOD_MARKER_RANGES.creatinekinase).toEqual({
        min: 44,
        max: 1083,
        decreaseIsGood: null,
      });
    });

    it('contains cortisol with correct range', () => {
      expect(BLOOD_MARKER_RANGES.cortisol).toEqual({
        min: 4,
        max: 22,
        decreaseIsGood: null,
      });
    });

    it('contains IGF-1 with correct range', () => {
      expect(BLOOD_MARKER_RANGES.igf1).toEqual({
        min: 88,
        max: 240,
        decreaseIsGood: null,
      });
    });
  });

  describe('Marker Categorization by decreaseIsGood', () => {
    it('categorizes markers that are better when decreased', () => {
      const decreaseBetterMarkers = Object.entries(BLOOD_MARKER_RANGES)
        .filter(([_, range]) => range.decreaseIsGood === true)
        .map(([key, _]) => key);

      const expectedDecreaseBetter = [
        'totalCholesterol', 'ldl', 'triglycerides', 'apoB', 'lpA',
        'hba1c', 'fastingInsulin', 'glucose',
        'alt', 'ast', 'ggt',
        'cystatinC', 'bun', 'creatinine',
        'crp', 'homocysteine'
      ];

      expectedDecreaseBetter.forEach(marker => {
        expect(decreaseBetterMarkers).toContain(marker);
      });
    });

    it('categorizes markers that are better when increased', () => {
      const increaseBetterMarkers = Object.entries(BLOOD_MARKER_RANGES)
        .filter(([_, range]) => range.decreaseIsGood === false)
        .map(([key, _]) => key);

      const expectedIncreaseBetter = [
        'hdl', 'egfr', 'vitaminD', 'vitaminB12', 'folate'
      ];

      expectedIncreaseBetter.forEach(marker => {
        expect(increaseBetterMarkers).toContain(marker);
      });
    });

    it('categorizes neutral markers', () => {
      const neutralMarkers = Object.entries(BLOOD_MARKER_RANGES)
        .filter(([_, range]) => range.decreaseIsGood === null)
        .map(([key, _]) => key);

      // Should have a significant number of neutral markers
      expect(neutralMarkers.length).toBeGreaterThan(30);
    });
  });
});

describe('OWNER_ID', () => {
  it('is defined and is a string', () => {
    expect(OWNER_ID).toBeDefined();
    expect(typeof OWNER_ID).toBe('string');
  });

  it('has the expected format', () => {
    expect(OWNER_ID).toBe('usr_W2LWz83EurLxZwfjqT_EL');
    expect(OWNER_ID).toMatch(/^usr_[A-Za-z0-9_]+$/);
  });

  it('is not empty', () => {
    expect(OWNER_ID.length).toBeGreaterThan(0);
  });
});

describe('BloodMarkerRange Type', () => {
  it('type definition is correctly implemented', () => {
    const testRange: BloodMarkerRange = {
      min: 10,
      max: 20,
      decreaseIsGood: true,
    };

    expect(typeof testRange.min).toBe('number');
    expect(typeof testRange.max).toBe('number');
    expect(typeof testRange.decreaseIsGood).toBe('boolean');

    const testRangeWithNull: BloodMarkerRange = {
      min: 10,
      max: 20,
      decreaseIsGood: null,
    };

    expect(testRangeWithNull.decreaseIsGood).toBeNull();
  });
});
