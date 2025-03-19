'use client';

// app/protected/performance/client.tsx
import dynamic from 'next/dynamic';

// Use dynamic import with no SSR to avoid hydration issues with charts
const PerformanceTrackingPage = dynamic(
  () => import('@/components/performance-tracking-page'), 
  { ssr: false }
);

export default function PerformanceClient() {
  return <PerformanceTrackingPage />;
}