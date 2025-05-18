import { Request, Response, NextFunction } from 'express';
import { AppError } from '../middleware/errorHandler.js';
import { supabaseAdmin } from '../utils/supabase.js';

// Get the authenticated user's profile
export const getUserProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError('User authentication required', 401);
    }

    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      throw new AppError('Error fetching user profile', 500, error);
    }

    if (!data) {
      throw new AppError('User profile not found', 404);
    }

    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

// Update the authenticated user's profile
export const updateUserProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const profile = req.body;

    if (!userId) {
      throw new AppError('User authentication required', 401);
    }

    // Ensure user can only update their own profile
    if (profile.id && profile.id !== userId) {
      throw new AppError('Cannot update another user\'s profile', 403);
    }

    // Set the correct user ID in the profile
    profile.id = userId;

    // Ensure preferences is valid JSON if present
    if (profile.preferences && typeof profile.preferences === 'object') {
      // Ensure traits is an array
      if (profile.preferences.traits && !Array.isArray(profile.preferences.traits)) {
        profile.preferences.traits = [profile.preferences.traits.toString()];
      }
    }

    // Update the profile in the database
    const { data, error } = await supabaseAdmin
      .from('users')
      .upsert({
        ...profile,
        updated_at: new Date().toISOString()
      })
      .select();

    if (error) {
      throw new AppError('Error updating user profile', 500, error);
    }

    res.status(200).json(data[0]);
  } catch (error) {
    next(error);
  }
};