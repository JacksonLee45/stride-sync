// API Routes for Training Plans
// app/api/plans/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// GET handler to fetch all training plans
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    // Parse query parameters for filtering
    const url = new URL(request.url);
    const category = url.searchParams.get('category');
    const difficulty = url.searchParams.get('difficulty');
    const duration = url.searchParams.get('duration');
    const search = url.searchParams.get('search');
    
    // Build query
    let query = supabase
      .from('plans')
      .select('*');
    
    // Apply filters
    if (category && category !== 'all') {
      query = query.eq('category', category);
    }
    
    if (difficulty && difficulty !== 'all') {
      query = query.eq('difficulty_level', difficulty);
    }
    
    if (duration && duration !== 'all') {
      switch (duration) {
        case 'short':
          query = query.lte('duration_weeks', 8);
          break;
        case 'medium':
          query = query.gt('duration_weeks', 8).lte('duration_weeks', 12);
          break;
        case 'long':
          query = query.gt('duration_weeks', 12);
          break;
      }
    }
    
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }
    
    // Execute query
    const { data: plans, error } = await query;
    
    if (error) {
      console.error('Error fetching plans:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json(plans);
  } catch (err: any) {
    console.error('Error in GET /api/plans:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}