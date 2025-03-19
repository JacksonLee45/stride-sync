// app/protected/performance/page.tsx
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import PerformanceClient from './client';

export default async function PerformancePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  return <PerformanceClient />;
}