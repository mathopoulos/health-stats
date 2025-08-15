import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard - Health Stats',
  description: 'Upload and manage your health data. Track biomarkers, fitness metrics, and health protocols in one place.',
  keywords: 'health dashboard, upload health data, biomarker tracking, fitness metrics, health protocols',
};

export default function UploadLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
