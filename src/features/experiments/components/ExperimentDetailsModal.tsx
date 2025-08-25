'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '@providers/ThemeProvider';

// Import types and sub-components
import { 
  Experiment,
  ExperimentDetailsModalProps,
  ExperimentFitnessData,
  ExperimentBloodMarkerData 
} from '../types/experiment';
import ModalHeader from './modal/ModalHeader';
import ExperimentOverview from './modal/ExperimentOverview';
import FitnessMetricCard from './modal/FitnessMetricCard';
import BloodMarkerCard from './modal/BloodMarkerCard';
import EmptyMetricsState from './modal/EmptyMetricsState';
import LoadingState from './modal/LoadingState';

export default function ExperimentDetailsModal({
  experiment,
  experimentFitnessData,
  experimentBloodMarkerData,
  isLoadingFitnessData,
  isLoadingBloodMarkerData,
  onClose
}: ExperimentDetailsModalProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [chartWidth, setChartWidth] = useState(800);
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';

  // Ensure portal is only used on client side
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Update chart width on window resize
  useEffect(() => {
    const updateChartWidth = () => {
      if (typeof window !== 'undefined') {
        // Much more conservative sizing for mobile to prevent horizontal scroll
        const isMobile = window.innerWidth < 640;
        const modalPadding = 32; // Account for modal padding (p-4 = 16px each side)
        const chartMargins = 40; // Account for chart margins
        const availableWidth = window.innerWidth - modalPadding - chartMargins;
        
        let newWidth;
        if (isMobile) {
          // On mobile, be very conservative - use 70% of available width, max 400px
          newWidth = Math.max(280, Math.min(400, availableWidth * 0.7));
        } else {
          // On desktop, can be more generous
          newWidth = Math.max(400, Math.min(800, availableWidth * 0.9));
        }
        
        setChartWidth(newWidth);
        console.log('Chart sizing:', { isMobile, windowWidth: window.innerWidth, availableWidth, newWidth });
      }
    };

    // Set initial width
    updateChartWidth();

    // Add resize listener
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', updateChartWidth);
      return () => window.removeEventListener('resize', updateChartWidth);
    }
  }, []);

  if (!isMounted || !experiment) return null;

  const hasMetrics = (experiment.fitnessMarkers?.length > 0 || experiment.bloodMarkers?.length > 0);
  const isLoading = isLoadingFitnessData || isLoadingBloodMarkerData;

  const modalContent = (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-[100] p-4 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-[90vw] max-w-4xl min-h-0 max-h-[calc(100vh-2rem)] overflow-y-auto my-4">
        
        {/* Header */}
        <ModalHeader experiment={experiment} onClose={onClose} />

        {/* Progress and Overview */}
        <ExperimentOverview experiment={experiment} />

        {/* Tracked Metrics */}
        <div className="p-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            Tracked Metrics
          </h3>
          
          {isLoading ? (
            <LoadingState />
          ) : hasMetrics ? (
            <div className="space-y-8">
              {/* Fitness Metrics */}
              {experiment.fitnessMarkers?.map((metricType) => {
                const metricData = experimentFitnessData[metricType] || [];
                
                return (
                  <FitnessMetricCard
                    key={metricType}
                    metricType={metricType}
                    metricData={metricData}
                    experiment={experiment}
                    chartWidth={chartWidth}
                    isDarkMode={isDarkMode}
                  />
                );
              })}

              {/* Blood Markers */}
              {experiment.bloodMarkers?.map((markerName) => {
                const markerData = experimentBloodMarkerData[markerName] || [];
                
                return (
                  <BloodMarkerCard
                    key={markerName}
                    markerName={markerName}
                    markerData={markerData}
                    experiment={experiment}
                    isLoadingBloodMarkerData={isLoadingBloodMarkerData}
                  />
                );
              })}
            </div>
          ) : (
            <EmptyMetricsState />
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}