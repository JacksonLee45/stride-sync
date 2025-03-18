import { NextResponse } from "next/server";

export async function GET() {
  // Only return the public anon key that is meant for browser usage
  return NextResponse.json({
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
  });
}