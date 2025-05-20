import { supabase } from '@/lib/supabase-client';

// Constants
const GUEST_MAX_MESSAGES = 5;

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
    const usage = localStorage.getItem('guest_usage');
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
    localStorage.setItem('guest_usage', newUsage.toString());
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
      // Get the current user's access token
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('No active session');
      }
      
      // Call the backend API to check usage
      const response = await fetch('/api/user/profile', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch profile: ${response.statusText}`);
      }
      
      const userData = await response.json();
      const canMakeRequest = userData.paid || userData.daily_free_messages > 0;
      const requiresPayment = !userData.paid && userData.daily_free_messages <= 0;

      return {
        canMakeRequest,
        remainingMessages: userData.daily_free_messages,
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
export const recordUsage = async (userId?: string | null): Promise<number> => {
  // For authenticated users, the backend handles this
  if (userId) {
    try {
      // Update happens via API when the request is made
      // Just return the current count
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('No active session');
      }
      
      // Get the updated profile to see remaining messages
      const response = await fetch('/api/user/profile', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch profile: ${response.statusText}`);
      }
      
      const userData = await response.json();
      return userData.daily_free_messages;
    } catch (error) {
      console.error('Error recording user usage:', error);
      return 0;
    }
  }
  
  // For guest users, increment the usage counter
  const newGuestUsage = incrementGuestUsage();
  const remainingMessages = Math.max(0, GUEST_MAX_MESSAGES - newGuestUsage);
  return remainingMessages;
};