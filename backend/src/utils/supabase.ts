import { createClient } from '@supabase/supabase-js';
import { config } from './config.js';

const supabaseUrl = config.supabase.url;
const supabaseServiceKey = config.supabase.serviceKey;
const supabaseAnonKey = config.supabase.anonKey;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  if (config.nodeEnv === 'production') {
    console.error('Please configure these in your Render.com environment variables');
  }
}

// Create a Supabase client with the service key for admin access
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Create a Supabase client with the anonymous key for public access
export const supabasePublic = supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export async function getUserProfile(userId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
}

export async function updateUserProfile(profile: any) {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .upsert(profile)
      .select();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
}