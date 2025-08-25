import React from 'react';
import BloodMarkerChart from '@features/blood-markers/components/BloodMarkerChart';
import { TrendIndicator } from '@components/TrendIndicator';

import { Experiment, BloodMarkerDataPoint } from '../../../types/experiment';
import { calculateBloodMarkerTrend } from '../../../utils/experimentCalculations';
import { getBloodMarkerColors } from '../../../utils/experimentDisplay';

interface BloodMarkerCardProps {
  markerName: string;
  markerData: BloodMarkerDataPoint[];
  experiment: Experiment;
  isLoadingBloodMarkerData: boolean;
}

export default function BloodMarkerCard({
  markerName,
  markerData,
  experiment,
  isLoadingBloodMarkerData
}: BloodMarkerCardProps) {
  const hasData = markerData.length > 0;
  const trend = hasData ? calculateBloodMarkerTrend(markerData, experiment) : null;

  return (
    <div className="bg-gray-50 dark:bg-gray-900/30 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
            {markerName}
          </h4>
          {trend && (
            <TrendIndicator
              current={trend.current}
              previous={trend.previous}
              min={trend.min}
              max={trend.max}
              showTimeRange={false}
              customColors={getBloodMarkerColors()}
              className="ml-2"
            />
          )}
        </div>
        {isLoadingBloodMarkerData && (
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600" data-testid="loading-spinner"></div>
        )}
      </div>
      
      {hasData ? (
        <div className="h-64 w-full min-w-0">
          <BloodMarkerChart 
            data={markerData}
            markerName={markerName}
            height="h-full"
            showReferenceBar={true}
          />
        </div>
      ) : (
        <div className="h-[200px] flex items-center justify-center text-gray-500 dark:text-gray-400" data-testid="no-data-message">
          No {markerName.toLowerCase()} data available for this experiment period
        </div>
      )}
    </div>
  );
}
