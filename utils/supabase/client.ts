import { createBrowserClient } from "@supabase/ssr";

// We'll use a server API route to get credentials instead of exposing them directly
export const createClient = async () => {
  try {
    // Get the credentials from the server
    const response = await fetch('/api/supabase-credentials');
    if (!response.ok) {
      throw new Error('Failed to get Supabase credentials');
    }
    
    const { supabaseUrl, supabaseAnonKey } = await response.json();
    
    return createBrowserClient(
      supabaseUrl,
      supabaseAnonKey,
    );
  } catch (error) {
    console.error('Error creating Supabase client:', error);
    throw error;
  }
};