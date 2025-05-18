import { createClient } from '@supabase/supabase-js';
import env from '../env';

// Get Supabase config from environment variables via our centralized env file
const supabaseUrl = env.SUPABASE_URL;
const supabaseAnonKey = env.SUPABASE_ANON_KEY;

let isDemo = false;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase configuration is incomplete. Authentication features may be limited.');
  console.warn('Please ensure Supabase environment variables are set in Netlify.');
  isDemo = true;
}

// Create a single supabase client for the entire app
export const supabase = createClient(
  supabaseUrl || 'https://example.supabase.co',
  supabaseAnonKey || 'demo-mode',
  {
    auth: {
      // Configure Supabase Auth for Netlify - use deployed URL or localhost in development
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
    
    console.log(`Fetching user profile for userId: ${userId}`);
    
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) {
      // If we get a 404, it means the user doesn't exist yet
      if (error.code === 'PGRST116') {
        console.log('User profile not found, will need to be created');
        return null;
      }
      throw error;
    }
    
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
    
    // First get the existing user to ensure we have email
    const existingUser = await getUserProfile(profile.id);
    if (!existingUser && !profile.email) {
      console.error('Cannot update profile: user does not exist and no email provided');
      return false;
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
    
    // Create a complete profile object with all required fields
    const completeProfile = {
      id: profile.id,
      email: profile.email || existingUser?.email,
      preferences: profile.preferences || existingUser?.preferences,
      assistantId: profile.assistantId || existingUser?.assistantId,
      daily_free_messages: profile.daily_free_messages !== undefined 
        ? profile.daily_free_messages 
        : existingUser?.daily_free_messages,
      last_reset_date: profile.last_reset_date || existingUser?.last_reset_date,
      paid: profile.paid !== undefined ? profile.paid : existingUser?.paid,
      updated_at: new Date().toISOString()
    };
    
    console.log('Complete profile for update:', JSON.stringify(completeProfile, null, 2));
    
    // Only proceed if we have the required email field
    if (!completeProfile.email) {
      console.error('Cannot update profile: missing email field');
      return false;
    }
    
    const { error, data } = await supabase
      .from('users')
      .upsert(completeProfile)
      .select();
    
    if (error) {
      console.error('Supabase error updating profile:', error);
      throw error;
    }
    
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