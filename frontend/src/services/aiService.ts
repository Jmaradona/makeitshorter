import { AIResponse } from '../types';
import { countWords } from '../utils/textUtils';
import { useUserStore } from '../store/userStore';
import { checkUsage } from './usageService';
import env from '../env';

interface EnhanceEmailPayload {
  content: string;
  tone: string;
  targetWords: number;
  inputType: string;
  enforceExactWordCount?: boolean;
}

export async function enhanceEmail(payload: EnhanceEmailPayload): Promise<AIResponse> {
  const { isOfflineMode } = useUserStore.getState();
  const { user } = useUserStore.getState();
  
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
      // Use simplified test mode for development/offline use
      enhancedContent = generateTestModeResponse(
        payload.content, 
        payload.targetWords, 
        payload.inputType,
        payload.enforceExactWordCount
      );
    } else {
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
    
    return { 
      enhancedContent,
      warning
    };
  } catch (error: any) {
    console.error('Error in enhanceEmail:', error);
    
    return { 
      enhancedContent: '',
      error: error.message || 'Failed to enhance content. Please try again later.'
    };
  }
}

// Import necessary functions and variables
import { supabase } from '../lib/supabase';
import { generateTestModeResponse } from '../utils/testMode';