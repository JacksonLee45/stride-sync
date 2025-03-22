// app/protected/coach/page.tsx
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import CoachClient from './client';

export default async function CoachPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  return <CoachClient />;
}