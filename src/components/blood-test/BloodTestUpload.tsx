'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Icons } from '@/components/icons';
import { BloodMarkerPreview } from './BloodMarkerPreview';
import { useToast } from '@/components/ui/use-toast';
import * as pdfjsLib from 'pdfjs-dist/build/pdf.mjs';

// Initialize PDF.js worker
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
}

interface ExtractedData {
  markers: Record<string, number | null>;
  testDate: string | null;
}

export function BloodTestUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const { toast } = useToast();

  const resetUpload = useCallback(() => {
    setExtractedData(null);
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
          .map((item: any) => item.str)
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
      toast({
        title: 'Invalid file type',
        description: 'Please upload a PDF file',
        variant: 'destructive',
      });
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
      setExtractedData(data);
    } catch (error) {
      console.error('Error processing PDF:', error);
      toast({
        title: 'Error',
        description: 'Failed to process PDF file. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  }, [toast]);

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
        <Card
          {...getRootProps()}
          className={`p-8 border-2 border-dashed ${
            isDragActive ? 'border-primary' : 'border-muted'
          } rounded-lg cursor-pointer hover:border-primary transition-colors`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="p-3 rounded-full bg-primary/10">
              <Icons.upload className="w-6 h-6 text-primary" />
            </div>
            {isUploading ? (
              <div className="flex items-center space-x-2">
                <Icons.spinner className="w-4 h-4 animate-spin" />
                <p>Processing PDF...</p>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <p className="text-sm font-medium">
                    Drop your blood test PDF here, or click to select
                  </p>
                  <p className="text-sm text-muted-foreground">
                    PDF file up to 10MB
                  </p>
                </div>
                <Button variant="secondary" size="sm">
                  Select PDF
                </Button>
              </>
            )}
          </div>
        </Card>
      ) : (
        <BloodMarkerPreview
          markers={extractedData.markers}
          testDate={extractedData.testDate}
          onReset={resetUpload}
        />
      )}
    </div>
  );
} 