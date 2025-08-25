'use client';

import { useState, useEffect } from 'react';
import { getReferenceRanges, getBloodMarkerStatus, BLOOD_MARKER_STATUS_COLORS, type ReferenceRanges } from '@/lib/bloodMarkerRanges';
import BloodMarkerChart from '@features/blood-markers/components/BloodMarkerChart';

interface BloodMarker {
  value: number;
  unit: string;
  date: string;
  referenceRange?: { min: number; max: number };
}

interface BloodMarkerDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  markerName: string;
  data: BloodMarker[];
  userId: string;
}

// Use centralized color constants
const STATUS_COLORS = BLOOD_MARKER_STATUS_COLORS;

export default function BloodMarkerDetailModal({ 
  isOpen, 
  onClose, 
  markerName, 
  data, 
  userId 
}: BloodMarkerDetailModalProps) {
  const [referenceRanges, setReferenceRanges] = useState<ReferenceRanges>();

  useEffect(() => {
    if (data && data.length > 0) {
      setReferenceRanges(
        getReferenceRanges(markerName, data[0]?.referenceRange)
      );
    }
  }, [data, markerName]);

  // Force Recharts to recalculate dimensions once the modal is visible
  useEffect(() => {
    if (isOpen && typeof window !== 'undefined') {
      const id = setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 50); // allow DOM to paint before dispatching
      return () => clearTimeout(id);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentValue = data?.[0];
  const unit = currentValue?.unit || '';

  const getStatusColor = (value: number): string => {
    if (!referenceRanges) return STATUS_COLORS.normal;
    
    const status = getBloodMarkerStatus(value, markerName);
    return STATUS_COLORS[status];
  };

  const getStatus = (value: number): string => {
    if (!referenceRanges) return 'Unknown';
    
    const status = getBloodMarkerStatus(value, markerName);
    return status.charAt(0).toUpperCase() + status.slice(1);
  };




  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-[90vw] max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex-1 pr-2">
            <h2 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">{markerName}</h2>
            {currentValue && (
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mt-2">
                <span className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                  {currentValue.value} {unit}
                </span>
                <span 
                  className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium text-white w-fit`}
                  style={{ backgroundColor: getStatusColor(currentValue.value) }}
                >
                  {getStatus(currentValue.value)}
                </span>
              </div>
            )}
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
              Last tested: {currentValue ? new Date(currentValue.date).toLocaleDateString() : 'No data'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 flex-shrink-0"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Reference Ranges - Mobile responsive stacked layout */}
        {referenceRanges && (
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-center gap-3 sm:gap-8">
              <div className="flex items-center gap-2 text-xs sm:text-sm">
                <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0"></div>
                <span className="text-gray-600 dark:text-gray-400">Abnormal:</span>
                <span className="text-gray-900 dark:text-white font-medium">{referenceRanges.abnormalText}</span>
              </div>
              
              {referenceRanges.normalText && (
                <div className="flex items-center gap-2 text-xs sm:text-sm">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full flex-shrink-0"></div>
                  <span className="text-gray-600 dark:text-gray-400">Normal:</span>
                  <span className="text-gray-900 dark:text-white font-medium">{referenceRanges.normalText}</span>
                </div>
              )}
              
              <div className="flex items-center gap-2 text-xs sm:text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                <span className="text-gray-600 dark:text-gray-400">Optimal:</span>
                <span className="text-gray-900 dark:text-white font-medium">{referenceRanges.optimalText}</span>
              </div>
            </div>
          </div>
        )}

        {/* Chart - Responsive height and margins */}
        <div className="p-4 sm:p-6 w-full min-w-0">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">
            Historical Trend
          </h3>
          
          <BloodMarkerChart 
            data={data}
            markerName={markerName}
            height="h-[280px] sm:h-[340px]"
            showReferenceBar={true}
          />
        </div>

        {/* Recent History Table - Mobile optimized */}
        {data && data.length > 0 && (
          <div className="p-4 sm:p-6 pt-0">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">
              Recent History
            </h3>
            <div className="overflow-x-auto -mx-1">
              <table className="w-full text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-2 px-1 text-gray-600 dark:text-gray-400 font-medium">Date</th>
                    <th className="text-left py-2 px-1 text-gray-600 dark:text-gray-400 font-medium">Value</th>
                    <th className="text-left py-2 px-1 text-gray-600 dark:text-gray-400 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.slice(0, 5).map((item, index) => (
                    <tr key={index} className="border-b border-gray-100 dark:border-gray-700">
                      <td className="py-2 px-1 text-gray-900 dark:text-white">
                        {new Date(item.date).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric',
                          ...(typeof window !== 'undefined' && window.innerWidth >= 640 && { year: 'numeric' })
                        })}
                      </td>
                      <td className="py-2 px-1 text-gray-900 dark:text-white font-medium">
                        {item.value} {unit}
                      </td>
                      <td className="py-2 px-1">
                        <span 
                          className="px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium text-white"
                          style={{ backgroundColor: getStatusColor(item.value) }}
                        >
                          {getStatus(item.value)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 