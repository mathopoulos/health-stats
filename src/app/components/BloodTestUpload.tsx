import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'react-hot-toast';
import BloodTestPreview from './BloodTestPreview';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

interface Props {
  onUploadComplete: () => void;
}

interface BloodMarker {
  name: string;
  value: number;
  unit: string;
  category: string;
}

export default function BloodTestUpload({ onUploadComplete }: Props) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [parsedMarkers, setParsedMarkers] = useState<BloodMarker[] | null>(null);
  const [testDate, setTestDate] = useState<Date>(new Date());

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast.error('Please upload a PDF file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB
      toast.error('File size must be less than 10MB');
      return;
    }

    setIsUploading(true);
    setUploadProgress('Getting upload URL...');

    try {
      // Get presigned URL
      const urlResponse = await fetch('/api/upload-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
        }),
      });

      if (!urlResponse.ok) {
        throw new Error('Failed to get upload URL');
      }

      const { url, key } = await urlResponse.json();

      // Upload to S3
      setUploadProgress('Uploading file...');
      const uploadResponse = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type,
        },
        body: file,
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file');
      }

      // Process the blood test
      setUploadProgress('Processing blood test...');
      const parseResponse = await fetch('/api/parse-blood-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ key }),
      });

      if (!parseResponse.ok) {
        throw new Error('Failed to parse blood test');
      }

      const data = await parseResponse.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to parse blood test');
      }

      if (!data.data || data.data.length === 0) {
        toast.error('No blood markers found in the PDF');
        return;
      }

      setParsedMarkers(data.data);
      setUploadProgress('Blood test parsed successfully');
      toast.success(`Found ${data.data.length} blood markers`);
    } catch (error) {
      console.error('Error uploading blood test:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to parse blood test');
    } finally {
      setIsUploading(false);
      setUploadProgress('');
    }
  }, []);

  const handleConfirm = async (markers: BloodMarker[]) => {
    try {
      const response = await fetch('/api/blood-markers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: testDate,
          markers: markers,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save blood test results');
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to save blood test results');
      }

      toast.success('Blood test results saved successfully');
      setParsedMarkers(null);
      onUploadComplete();
    } catch (error) {
      console.error('Error saving blood test results:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save blood test results');
    }
  };

  const handleCancel = () => {
    setParsedMarkers(null);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
    },
    maxFiles: 1,
    disabled: isUploading,
  });

  if (parsedMarkers) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-end space-x-2">
          <label className="text-sm text-gray-600 dark:text-gray-400">
            Test Date:
          </label>
          <DatePicker
            selected={testDate}
            onChange={(date: Date | null) => date && setTestDate(date)}
            className="block rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700"
          />
        </div>
        <BloodTestPreview
          markers={parsedMarkers}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      </div>
    );
  }

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-lg p-8 text-center ${
        isDragActive
          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
          : 'border-gray-300 dark:border-gray-700'
      } ${isUploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <input {...getInputProps()} />
      <div className="space-y-4">
        {isUploading ? (
          <>
            <div className="w-full h-1 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden">
              <div className="h-full bg-indigo-500 animate-progress"></div>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {uploadProgress}
            </p>
          </>
        ) : (
          <>
            <div className="flex justify-center">
              <svg
                className="w-12 h-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>
            <div>
              <p className="text-base text-gray-600 dark:text-gray-400">
                Drop your blood test PDF here, or click to select
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                PDF file up to 10MB
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
} 