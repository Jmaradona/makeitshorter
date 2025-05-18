import { supabaseAdmin } from "../utils/supabase.js";
import { checkActiveSubscription } from "../controllers/stripe.controller.js";

// Constants for usage limits
const GUEST_MAX_MESSAGES = 5;
const DAILY_FREE_MESSAGES = 5;

// Storage key for guest usage (for non-logged in users)
const STORAGE_KEY = 'guest_usage';

// Types
export interface UsageResponse {
  canMakeRequest: boolean;
  remainingMessages: number;
  requiresAuth: boolean;
  requiresPayment: boolean;
}

// Check if a date is today
function isToday(date: Date): boolean {
  const today = new Date();
  return date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();
}

// Reset user's daily messages if needed
async function resetUserMessagesIfNeeded(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('last_reset_date')
      .eq('id', userId)
      .single();

    if (error) throw error;

    if (!data || !data.last_reset_date) {
      // No data or reset date, update with default values
      await supabaseAdmin
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
      await supabaseAdmin
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
}

// Decrement user's daily message count
async function decrementUserMessages(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabaseAdmin.rpc('decrement_daily_messages', {
      user_id: userId
    });

    if (error) throw error;
    
    return data === true;
  } catch (error) {
    console.error('Error decrementing user messages:', error);
    return false;
  }
}

// Track guest usage in memory (for non-authenticated API users)
let guestUsage = new Map<string, { count: number, date: Date }>();

// Clean up old guest usage data (runs periodically)
function cleanupGuestUsage() {
  const now = new Date();
  
  for (const [ip, data] of guestUsage.entries()) {
    // If date is not today, remove the entry
    if (!isToday(data.date)) {
      guestUsage.delete(ip);
    }
  }
}

// Run cleanup every hour
setInterval(cleanupGuestUsage, 3600000);

// Get guest usage by IP
function getGuestUsage(ip: string): number {
  const data = guestUsage.get(ip);
  
  if (!data || !isToday(data.date)) {
    guestUsage.set(ip, { count: 0, date: new Date() });
    return 0;
  }
  
  return data.count;
}

// Increment guest usage
function incrementGuestUsage(ip: string): number {
  const currentUsage = getGuestUsage(ip);
  const newUsage = currentUsage + 1;
  
  guestUsage.set(ip, { count: newUsage, date: new Date() });
  
  return newUsage;
}

// Check if a user can make a new request
export const checkUserUsage = async (userId?: string): Promise<UsageResponse> => {
  // For authenticated users
  if (userId) {
    try {
      // Reset daily messages if needed
      await resetUserMessagesIfNeeded(userId);

      // Get current usage
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('daily_free_messages, paid')
        .eq('id', userId)
        .single();

      if (error) throw error;

      // If user has paid subscription, always allow
      if (data.paid) {
        return {
          canMakeRequest: true,
          remainingMessages: 999999, // Unlimited
          requiresAuth: false,
          requiresPayment: false
        };
      }
      
      // Otherwise check if they have free messages left
      const isPaid = await checkActiveSubscription(userId);
      const canMakeRequest = isPaid || data.daily_free_messages > 0;
      const requiresPayment = !isPaid && data.daily_free_messages <= 0;

      return {
        canMakeRequest,
        remainingMessages: data.daily_free_messages,
        requiresAuth: false,
        requiresPayment
      };
    } catch (error) {
      console.error('Error checking user usage:', error);
      
      return {
        canMakeRequest: false,
        remainingMessages: 0,
        requiresAuth: false,
        requiresPayment: true
      };
    }
  }
  
  // For guest users (use IP address to track)
  const ip = 'guest'; // In a real implementation, use req.ip
  const guestUsageCount = getGuestUsage(ip);
  const remainingMessages = Math.max(0, GUEST_MAX_MESSAGES - guestUsageCount);
  const canMakeRequest = guestUsageCount < GUEST_MAX_MESSAGES;
  const requiresAuth = guestUsageCount >= GUEST_MAX_MESSAGES;

  return {
    canMakeRequest,
    remainingMessages,
    requiresAuth,
    requiresPayment: false
  };
};

// Record a usage and update limits
export const recordUserUsage = async (userId?: string): Promise<UsageResponse> => {
  // For authenticated users
  if (userId) {
    try {
      // Check if user has a paid subscription
      const isPaid = await checkActiveSubscription(userId);
      
      if (!isPaid) {
        // Decrement the user's daily message count
        const success = await decrementUserMessages(userId);
        if (!success) {
          throw new Error('Failed to decrement message count');
        }
      }
      
      // Get updated usage
      return await checkUserUsage(userId);
    } catch (error) {
      console.error('Error recording user usage:', error);
      
      return {
        canMakeRequest: false,
        remainingMessages: 0,
        requiresAuth: false,
        requiresPayment: true
      };
    }
  }
  
  // For guest users
  const ip = 'guest'; // In a real implementation, use req.ip
  const newGuestUsage = incrementGuestUsage(ip);
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

// Reset a user's usage (for testing or admin purposes)
export const resetUserUsage = async (userId: string): Promise<UsageResponse> => {
  try {
    await supabaseAdmin
      .from('users')
      .update({
        daily_free_messages: DAILY_FREE_MESSAGES,
        last_reset_date: new Date().toISOString().split('T')[0]
      })
      .eq('id', userId);
      
    return await checkUserUsage(userId);
  } catch (error) {
    console.error('Error resetting user usage:', error);
    throw error;
  }
};

// Check and update usage in one operation (used by controllers)
export const checkAndUpdateUsage = async (userId?: string): Promise<UsageResponse> => {
  const usageStatus = await checkUserUsage(userId);
  
  // If user can't make request, return early
  if (!usageStatus.canMakeRequest) {
    return usageStatus;
  }
  
  // If this is not a paid user or guest, decrement their count
  if (userId && usageStatus.remainingMessages < 999999) {
    return await recordUserUsage(userId);
  }
  
  return usageStatus;
};