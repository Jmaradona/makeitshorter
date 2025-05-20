import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase-server';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Get user ID from authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.substring(7);
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return res.status(401).json({ error: 'Invalid authentication token' });
  }

  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();
        
      if (error) {
        if (error.code === 'PGRST116') {
          // User not found, return empty profile
          return res.status(404).json({ error: 'User profile not found' });
        }
        throw error;
      }
      
      return res.status(200).json(data);
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      return res.status(500).json({ error: error.message || 'Failed to fetch profile' });
    }
  } else if (req.method === 'POST' || req.method === 'PUT') {
    try {
      const profile = req.body;
      
      if (!profile) {
        return res.status(400).json({ error: 'Profile data is required' });
      }
      
      // Ensure ID is set to authenticated user
      profile.id = user.id;
      
      // Ensure preferences is valid JSON if present
      if (profile.preferences && typeof profile.preferences === 'object') {
        // Ensure traits is an array
        if (profile.preferences.traits && !Array.isArray(profile.preferences.traits)) {
          profile.preferences.traits = [profile.preferences.traits.toString()];
        }
      }
      
      const { data, error } = await supabase
        .from('users')
        .upsert(profile)
        .select();
      
      if (error) {
        throw error;
      }
      
      return res.status(200).json(data[0]);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      return res.status(500).json({ error: error.message || 'Failed to update profile' });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}