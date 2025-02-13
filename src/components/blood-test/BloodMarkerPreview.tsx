'use client';

import { Card } from "@/components/ui/card";

interface BloodMarker {
  name: string;
  value: number;
  unit: string;
  flag: 'High' | 'Low' | null;
  category: string;
}

interface BloodMarkerPreviewProps {
  markers: BloodMarker[];
  isLoading?: boolean;
}

export function BloodMarkerPreview({ markers, isLoading = false }: BloodMarkerPreviewProps) {
  if (isLoading) {
    return (
      <Card className="p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </Card>
    );
  }

  if (!markers?.length) {
    return null;
  }

  return (
    <Card className="p-4">
      <div className="space-y-4">
        {markers.map((marker, index) => (
          <div key={index} className="flex justify-between items-center">
            <div>
              <h3 className="font-medium">{marker.name}</h3>
              <p className="text-sm text-gray-500">{marker.category}</p>
            </div>
            <div className="text-right">
              <p className={`font-medium ${marker.flag === 'High' ? 'text-red-500' : marker.flag === 'Low' ? 'text-yellow-500' : ''}`}>
                {marker.value} {marker.unit}
              </p>
              {marker.flag && (
                <span className="text-sm text-gray-500">
                  {marker.flag}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
} 