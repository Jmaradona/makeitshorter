import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import env from '../env';

// Constants
const GUEST_MAX_MESSAGES = 5;
const STORAGE_KEY = 'guest_usage';

// Types
interface UsageResponse {
  canMakeRequest: boolean;
  remainingMessages: number;
  requiresAuth: boolean;
  requiresPayment: boolean;
}

// Guest usage tracking
const getGuestUsage = (): number => {
  try {
    const usage = localStorage.getItem(STORAGE_KEY);
    return usage ? parseInt(usage, 10) : 0;
  } catch (e) {
    console.error('Error retrieving guest usage:', e);
    return 0;
  }
};

const incrementGuestUsage = (): number => {
  try {
    const currentUsage = getGuestUsage();
    const newUsage = currentUsage + 1;
    localStorage.setItem(STORAGE_KEY, newUsage.toString());
    return newUsage;
  } catch (e) {
    console.error('Error incrementing guest usage:', e);
    return GUEST_MAX_MESSAGES; // Assume max to prevent further usage on error
  }
};

// Check if a request can be made
export const checkUsage = async (userId?: string | null): Promise<UsageResponse> => {
  // For authenticated users
  if (userId) {
    try {
      // Get token for API request
      const { data } = await supabase.auth.getSession();
      if (!data.session?.access_token) {
        throw new Error('No valid session');
      }

      // Call backend API to check usage
      const response = await fetch(`${env.API_URL}/api/usage/check`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${data.session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to check usage');
      }

      return await response.json();
    } catch (error) {
      console.error('Error checking user usage:', error);
      toast.error('Failed to check usage limits');
      
      // Fallback to guest mode on error
      const guestUsage = getGuestUsage();
      const remainingMessages = Math.max(0, GUEST_MAX_MESSAGES - guestUsage);
      
      return {
        canMakeRequest: remainingMessages > 0,
        remainingMessages,
        requiresAuth: remainingMessages <= 0,
        requiresPayment: false
      };
    }
  }
  
  // For guest users
  const guestUsage = getGuestUsage();
  const remainingMessages = Math.max(0, GUEST_MAX_MESSAGES - guestUsage);
  const canMakeRequest = guestUsage < GUEST_MAX_MESSAGES;
  const requiresAuth = guestUsage >= GUEST_MAX_MESSAGES;

  return {
    canMakeRequest,
    remainingMessages,
    requiresAuth,
    requiresPayment: false
  };
};

// Record a successful API request
export const recordUsage = async (userId?: string | null): Promise<UsageResponse> => {
  // For authenticated users
  if (userId) {
    try {
      // Get token for API request
      const { data } = await supabase.auth.getSession();
      if (!data.session?.access_token) {
        throw new Error('No valid session');
      }

      // Call backend API to record usage
      const response = await fetch(`${env.API_URL}/api/usage/record`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${data.session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to record usage');
      }

      return await response.json();
    } catch (error) {
      console.error('Error recording user usage:', error);
      toast.error('Failed to update usage limits');
      
      // Fallback on error
      return {
        canMakeRequest: false,
        remainingMessages: 0,
        requiresAuth: false,
        requiresPayment: true
      };
    }
  }
  
  // For guest users
  const newGuestUsage = incrementGuestUsage();
  const remainingMessages = Math.max(0, GUEST_MAX_MESSAGES - newGuestUsage);
  const canMakeRequest = newGuestUsage < GUEST_MAX_MESSAGES;
  const requiresAuth = newGuestUsage >= GUEST_MAX_MESSAGES;

  return {
    canMakeRequest,
    remainingMessages,
    requiresAuth,
    requiresPayment: false
  };
};