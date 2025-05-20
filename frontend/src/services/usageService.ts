import { supabase } from '@/lib/supabase-client';
import { toast } from 'react-hot-toast';

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
      // Get the current user's access token
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('No active session');
      }
      
      // Call the backend API to check usage
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/user/profile`, {
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
export const recordUsage = async (userId?: string | null): Promise<UsageResponse> => {
  // For authenticated users
  if (userId) {
    try {
      // Get the current user's access token
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('No active session');
      }
      
      // Get the updated profile to see remaining messages
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/user/profile`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch profile: ${response.statusText}`);
      }
      
      const userData = await response.json();
      
      // Update state in user store
      const { setRemainingMessages, setIsPaid } = useUserStore.getState();
      setRemainingMessages(userData.daily_free_messages);
      setIsPaid(!userData.paid && userData.daily_free_messages <= 0);
      
      return {
        canMakeRequest: userData.paid || userData.daily_free_messages > 0,
        remainingMessages: userData.daily_free_messages,
        requiresAuth: false,
        requiresPayment: !userData.paid && userData.daily_free_messages <= 0
      };
    } catch (error) {
      console.error('Error recording user usage:', error);
      toast.error('Failed to update usage count');
      
      return {
        canMakeRequest: false,
        remainingMessages: 0,
        requiresAuth: false,
        requiresPayment: true
      };
    }
  }
  
  // For guest users, increment the usage counter
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