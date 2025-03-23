// app/protected/performance/client.tsx
'use client';

import dynamic from 'next/dynamic';

// Replace the old import with the enhanced performance page
const EnhancedPerformanceTrackingPage = dynamic(
  () => import('@/components/performance/EnhancedPerformanceTrackingPage'),
  { ssr: false }
);

export default function PerformanceClient() {
  // Make sure it's returning the enhanced component
  return <EnhancedPerformanceTrackingPage />;
}