import { createClient } from '@supabase/supabase-js';

// Create a Supabase client with the service role key for server-side operations
export const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  {
    auth: {
      persistSession: false
    }
  }
);