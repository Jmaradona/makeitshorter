import { AIResponse } from '../types';
import { useUserStore } from '../store/userStore';
import { checkUsage, recordUsage } from './usageService';
import { generateTestModeResponse } from '../utils/testMode';
import { supabase } from '../lib/supabase';
import env from '../env';

interface EnhanceEmailPayload {
  content: string;
  tone: string;
  targetWords: number;
  inputType: string;
  enforceExactWordCount?: boolean;
}

// Main export function for enhancing emails
export async function enhanceEmail(payload: EnhanceEmailPayload): Promise<AIResponse> {
  const { isOfflineMode } = useUserStore.getState();
  const { user, remainingMessages, setRemainingMessages, setIsPaid } = useUserStore.getState();
  
  if (!payload.content?.trim()) {
    return { 
      enhancedContent: '',
      error: 'Content is required' 
    };
  }

  if (!payload.targetWords || payload.targetWords < 1) {
    return { 
      enhancedContent: '',
      error: 'Invalid target word count' 
    };
  }

  // Check usage limits
  const usageCheck = await checkUsage(user?.id);
  if (!usageCheck.canMakeRequest) {
    if (usageCheck.requiresAuth) {
      return {
        enhancedContent: '',
        error: 'login_required'
      };
    }
    if (usageCheck.requiresPayment) {
      return {
        enhancedContent: '',
        error: 'payment_required'
      };
    }
    
    return {
      enhancedContent: '',
      error: 'Usage limit reached'
    };
  }

  try {
    let enhancedContent = '';
    let warning = '';
    
    if (isOfflineMode) {
      // Use test mode for offline development
      enhancedContent = generateTestModeResponse(
        payload.content, 
        payload.targetWords, 
        payload.inputType,
        payload.enforceExactWordCount
      );
    } else {
      // Use backend API for actual enhancement
      const apiUrl = `${env.API_URL}/api/ai/enhance`;
      
      // Prepare request headers
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };
      
      // Add authorization header if user is logged in
      if (user) {
        const { data } = await supabase.auth.getSession();
        if (data.session?.access_token) {
          headers['Authorization'] = `Bearer ${data.session.access_token}`;
        }
      }
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        
        if (response.status === 401) {
          return { enhancedContent: '', error: 'login_required' };
        } else if (response.status === 402) {
          return { enhancedContent: '', error: 'payment_required' };
        } else if (response.status === 429) {
          return { enhancedContent: '', error: 'Rate limit exceeded. Please try again later.' };
        }
        
        throw new Error(errorData.error?.message || 'Failed to enhance content');
      }
      
      const data = await response.json();
      enhancedContent = data.enhancedContent;
      warning = data.warning || '';
    }
    
    // Record successful usage
    await recordUsage(user?.id);
    
    // Update remaining messages count in store
    const updatedUsage = await checkUsage(user?.id);
    setRemainingMessages(updatedUsage.remainingMessages);
    if (user) {
      setIsPaid(updatedUsage.requiresPayment);
    }
    
    return { 
      enhancedContent,
      warning
    };
  } catch (error: any) {
    console.error('Error in enhanceEmail:', error);
    
    if (isOfflineMode) {
      return { 
        enhancedContent: '',
        error: 'Error generating content in test mode.'
      };
    } else {
      return { 
        enhancedContent: '',
        error: error.message || 'Failed to connect to API. Please try again later.'
      };
    }
  }
}