import { useState } from 'react';

interface BloodMarker {
  name: string;
  value: number;
  unit: string;
  category: string;
}

interface Props {
  markers: BloodMarker[];
  onConfirm: (markers: BloodMarker[]) => void;
  onCancel: () => void;
}

export default function BloodTestPreview({ markers, onConfirm, onCancel }: Props) {
  const [editedMarkers, setEditedMarkers] = useState(markers);
  const [selectedMarkers, setSelectedMarkers] = useState<Set<string>>(new Set(markers.map(m => m.name)));

  const handleValueChange = (index: number, value: string) => {
    const newMarkers = [...editedMarkers];
    newMarkers[index] = { 
      ...newMarkers[index], 
      value: parseFloat(value) || 0 
    };
    setEditedMarkers(newMarkers);
  };

  const toggleMarker = (markerName: string) => {
    const newSelected = new Set(selectedMarkers);
    if (newSelected.has(markerName)) {
      newSelected.delete(markerName);
    } else {
      newSelected.add(markerName);
    }
    setSelectedMarkers(newSelected);
  };

  const toggleCategory = (category: string, markers: BloodMarker[]) => {
    const categoryMarkerNames = new Set(markers.map(m => m.name));
    const allSelected = markers.every(m => selectedMarkers.has(m.name));
    
    const newSelected = new Set(selectedMarkers);
    markers.forEach(m => {
      if (allSelected) {
        newSelected.delete(m.name);
      } else {
        newSelected.add(m.name);
      }
    });
    setSelectedMarkers(newSelected);
  };

  // Group markers by category
  const groupedMarkers = editedMarkers.reduce((acc, marker) => {
    if (!acc[marker.category]) {
      acc[marker.category] = [];
    }
    acc[marker.category].push(marker);
    return acc;
  }, {} as Record<string, BloodMarker[]>);

  const handleSave = () => {
    const selectedMarkersList = editedMarkers.filter(m => selectedMarkers.has(m.name));
    onConfirm(selectedMarkersList);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl mx-auto">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Review Blood Test Results
        </h3>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Select which markers you want to save and edit any incorrect values.
        </p>
      </div>

      <div className="p-6 space-y-6">
        {Object.entries(groupedMarkers).map(([category, markers]) => (
          <div key={category} className="space-y-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={markers.every(m => selectedMarkers.has(m.name))}
                onChange={() => toggleCategory(category, markers)}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <h4 className="font-medium text-gray-900 dark:text-white">{category}</h4>
            </div>
            <div className="grid grid-cols-1 gap-4 ml-6">
              {markers.map((marker, index) => (
                <div key={marker.name} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={selectedMarkers.has(marker.name)}
                      onChange={() => toggleMarker(marker.name)}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {marker.name}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      value={marker.value}
                      onChange={(e) => handleValueChange(index, e.target.value)}
                      className="block w-24 rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700"
                      step="any"
                    />
                    <span className="text-sm text-gray-500 dark:text-gray-400 w-16">
                      {marker.unit}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900 rounded-b-lg flex justify-between items-center">
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {selectedMarkers.size} markers selected
        </div>
        <div className="flex space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={selectedMarkers.size === 0}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save Selected Markers
          </button>
        </div>
      </div>
    </div>
  );
} 