// app/protected/performance/page.tsx
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import dynamic from 'next/dynamic';

// Use dynamic import with no SSR to avoid hydration issues with charts
const PerformanceTrackingPage = dynamic(
  () => import('@/components/performance-tracking-page'), 
  { ssr: false }
);

export default async function PerformancePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  return <PerformanceTrackingPage />;
}