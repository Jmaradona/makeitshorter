import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

// Constants
const GUEST_MAX_MESSAGES = 5;
const DAILY_FREE_MESSAGES = 5;
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

const resetGuestUsage = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error('Error resetting guest usage:', e);
  }
};

// Check if date is today
const isToday = (date: Date): boolean => {
  const today = new Date();
  return date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();
};

// Reset user's daily messages if needed
const resetUserMessagesIfNeeded = async (userId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('last_reset_date')
      .eq('id', userId)
      .single();

    if (error) throw error;

    if (!data || !data.last_reset_date) {
      // No data or reset date, update with default values
      await supabase
        .from('users')
        .update({
          daily_free_messages: DAILY_FREE_MESSAGES,
          last_reset_date: new Date().toISOString().split('T')[0]
        })
        .eq('id', userId);
      return true;
    }

    const lastResetDate = new Date(data.last_reset_date);
    if (!isToday(lastResetDate)) {
      // Reset date is not today, update counter and date
      await supabase
        .from('users')
        .update({
          daily_free_messages: DAILY_FREE_MESSAGES,
          last_reset_date: new Date().toISOString().split('T')[0]
        })
        .eq('id', userId);
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error resetting user messages:', error);
    return false;
  }
};

// Decrement user's daily message count
const decrementUserMessages = async (userId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase.rpc('decrement_daily_messages', {
      user_id: userId
    });

    if (error) throw error;
    
    return data === true;
  } catch (error) {
    console.error('Error decrementing user messages:', error);
    return false;
  }
};

// Check if a request can be made
export const checkUsage = async (userId?: string | null): Promise<UsageResponse> => {
  // For authenticated users
  if (userId) {
    try {
      // Reset daily messages if needed
      await resetUserMessagesIfNeeded(userId);

      // Get current usage
      const { data, error } = await supabase
        .from('users')
        .select('daily_free_messages, paid')
        .eq('id', userId)
        .single();

      if (error) throw error;

      const canMakeRequest = data.paid || data.daily_free_messages > 0;
      const requiresPayment = !data.paid && data.daily_free_messages <= 0;

      return {
        canMakeRequest,
        remainingMessages: data.daily_free_messages,
        requiresAuth: false,
        requiresPayment
      };
    } catch (error) {
      console.error('Error checking user usage:', error);
      toast.error('Failed to check usage limits');
      
      return {
        canMakeRequest: false,
        remainingMessages: 0,
        requiresAuth: false,
        requiresPayment: true
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
      // Decrement the user's daily message count
      const success = await decrementUserMessages(userId);
      if (!success) {
        throw new Error('Failed to decrement message count');
      }
      
      // Get updated usage
      return await checkUsage(userId);
    } catch (error) {
      console.error('Error recording user usage:', error);
      toast.error('Failed to update usage limits');
      
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