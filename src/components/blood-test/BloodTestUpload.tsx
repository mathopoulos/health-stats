'use client';

import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'react-hot-toast';
import * as pdfjsLib from 'pdfjs-dist/build/pdf.mjs';

interface BloodMarker {
  name: string;
  value: number;
  unit: string;
  flag: 'High' | 'Low' | null;
  category: string;
}

export function BloodTestUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [extractedData, setExtractedData] = useState<{
    markers: BloodMarker[];
    testDate: string | null;
  } | null>(null);

  // Initialize PDF.js worker
  useEffect(() => {
    if (typeof window !== 'undefined') {
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
    }
  }, []);

  const extractTextFromPdf = async (file: File): Promise<string> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';
      
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map(item => ('str' in item ? item.str : ''))
          .join(' ');
        fullText += pageText + '\n';
      }
      
      return fullText;
    } catch (error) {
      console.error('Error extracting text from PDF:', error);
      throw new Error('Failed to extract text from PDF');
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    if (file.type !== 'application/pdf') {
      toast.error('Please upload a PDF file');
      return;
    }

    setIsUploading(true);
    try {
      const extractedText = await extractTextFromPdf(file);
      
      const response = await fetch('/api/pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: extractedText }),
      });

      if (!response.ok) {
        throw new Error('Failed to process PDF');
      }

      const data = await response.json();
      if (data.success) {
        setExtractedData({
          markers: data.markers,
          testDate: data.testDate
        });
        toast.success('Blood markers extracted successfully');
      } else {
        toast.error(data.error || 'Failed to extract blood markers');
      }
    } catch (error) {
      console.error('Error processing PDF:', error);
      toast.error('Failed to process PDF file. Please try again.');
    } finally {
      setIsUploading(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
    },
    maxFiles: 1,
  });

  return (
    <div className="w-full max-w-2xl mx-auto">
      {!extractedData ? (
        <div
          {...getRootProps()}
          className={`p-8 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
            isDragActive ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-gray-300 dark:border-gray-700'
          }`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="p-3 rounded-full bg-indigo-100 dark:bg-indigo-900/20">
              {isUploading ? (
                <svg className="w-6 h-6 animate-spin text-indigo-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              )}
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {isUploading ? 'Processing PDF...' : 'Drop your blood test PDF here, or click to select'}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                PDF file up to 10MB
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Extracted Blood Markers
            </h3>
            {extractedData.testDate && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Test Date: {new Date(extractedData.testDate).toLocaleDateString()}
              </p>
            )}
            <div className="space-y-4">
              {extractedData.markers.map((marker, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">{marker.name}</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{marker.category}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-medium ${
                      marker.flag === 'High' ? 'text-red-500' :
                      marker.flag === 'Low' ? 'text-yellow-500' :
                      'text-gray-900 dark:text-white'
                    }`}>
                      {marker.value} {marker.unit}
                    </p>
                    {marker.flag && (
                      <span className={`text-sm px-2 py-1 rounded ${
                        marker.flag === 'High' ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400' :
                        'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
                      }`}>
                        {marker.flag}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => setExtractedData(null)}
              className="mt-4 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Upload Another PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 