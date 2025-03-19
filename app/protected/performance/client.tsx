// app/protected/performance/client.tsx
'use client';

import dynamic from 'next/dynamic';

// Use dynamic import with no SSR to avoid hydration issues with charts
const PerformanceTrackingPage = dynamic(
  () => import('@/components/performance/PerformanceTrackingPage'),
  { ssr: false }
);

export default function PerformanceClient() {
  return <PerformanceTrackingPage />;
}