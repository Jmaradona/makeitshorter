import { createClient } from '@supabase/supabase-js';
import env from '../env';

// Get Supabase config from environment variables via our centralized env file
const supabaseUrl = env.SUPABASE_URL;
const supabaseAnonKey = env.SUPABASE_ANON_KEY;

let isDemo = false;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase configuration is incomplete. Authentication features may be limited.');
  console.warn('Please ensure Supabase environment variables are set.');
  isDemo = true;
}

// Create a single supabase client for the entire app
export const supabase = createClient(
  supabaseUrl || 'https://example.supabase.co',
  supabaseAnonKey || 'demo-mode',
  {
    auth: {
      // Configure Supabase Auth - use deployed URL or localhost in development
      redirectTo: import.meta.env.PROD ? 
        window.location.origin : 
        'http://localhost:5173',
      persistSession: true
    }
  }
);

// Type definitions for user profiles
export type UserProfile = {
  id: string;
  email?: string;
  preferences: {
    style: string;
    formality: string;
    traits: string[];
    context: string;
    favoriteGoodbye?: string;
    name?: string;
    position?: string;
    company?: string;
    contact?: string;
  };
  assistantId?: string;
  created_at?: string;
  updated_at?: string;
  daily_free_messages?: number;
  last_reset_date?: string;
  paid?: boolean;
};

// Helper functions for user management
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    if (isDemo) {
      console.warn('Running in demo mode - authentication features are disabled');
      return null;
    }
    
    // Get token for API request
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error('No valid session');
    }

    // Call backend API to get profile
    const response = await fetch(`${env.API_URL}/api/users/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      // If we get a 404, it means the user doesn't exist yet
      if (response.status === 404) {
        console.log('User profile not found, will need to be created');
        return null;
      }
      throw new Error('Failed to fetch user profile');
    }
    
    const data = await response.json();
    console.log('Retrieved user profile:', data);
    return data;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
}

export async function updateUserProfile(profile: Partial<UserProfile>): Promise<boolean> {
  try {
    if (isDemo) {
      console.warn('Running in demo mode - authentication features are disabled');
      return false;
    }
    
    console.log('Updating user profile with data:', JSON.stringify(profile, null, 2));
    
    if (!profile.id) {
      console.error('Cannot update profile: missing user ID');
      return false;
    }
    
    // Get token for API request
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error('No valid session');
    }

    // Ensure preferences is valid JSON if present
    if (profile.preferences && typeof profile.preferences === 'object') {
      console.log('Preferences before update:', JSON.stringify(profile.preferences, null, 2));
      
      // Ensure traits is an array
      if (profile.preferences.traits && !Array.isArray(profile.preferences.traits)) {
        console.warn('Fixing traits array in updateUserProfile');
        profile.preferences.traits = [profile.preferences.traits.toString()];
      }
    }
    
    // Call backend API to update profile
    const response = await fetch(`${env.API_URL}/api/users/profile`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(profile)
    });

    if (!response.ok) {
      throw new Error('Failed to update user profile');
    }
    
    const data = await response.json();
    console.log('Profile updated successfully:', data);
    return true;
  } catch (error) {
    console.error('Error updating user profile:', error);
    return false;
  }
}

// Subscribe to auth changes
export function onAuthStateChange(callback: (session: any) => void) {
  return supabase.auth.onAuthStateChange((_, session) => {
    callback(session);
  });
}