import { AIResponse, AIRequestPayload } from 'shared/src/types';
import { extractEmailParts, countWords } from 'shared/src/utils/textUtils';
import { supabase } from '@/lib/supabase-client';

// The main enhance function that calls the backend
export async function enhanceEmail(payload: AIRequestPayload): Promise<AIResponse> {
  try {
    // Get authentication token if user is logged in
    const { data: { session } } = await supabase.auth.getSession();
    const authHeader = session ? { 'Authorization': `Bearer ${session.access_token}` } : {};
    
    const response = await fetch('/api/ai/enhance', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeader
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json();
      
      // Special error handling for authentication and payment issues
      if (response.status === 401) {
        return { enhancedContent: '', error: 'login_required' };
      }
      
      if (response.status === 402) {
        return { enhancedContent: '', error: 'payment_required' };
      }
      
      throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return { 
      enhancedContent: data.enhancedContent,
      warning: data.warning
    };
  } catch (error: any) {
    console.error('Error in enhanceEmail:', error);
    
    return { 
      enhancedContent: '',
      error: error.message || 'Failed to connect to AI service. Please try again later.'
    };
  }
}

// Implementation of a test mode response generator with no API calls
export function generateTestModeResponse(content: string, targetWords: number, inputType: string): string {
  // This is a utility function that creates a sample response
  // The implementation is minimal as this will be replaced by the backend call
  
  // Extract email parts if it's an email
  const { subject, greeting, body, signature } = extractEmailParts(content);
  
  // For simplicity, we'll just truncate or expand the body to match the target word count
  const words = body.split(/\s+/);
  const currentWords = words.length;
  
  let newBody: string;
  
  if (currentWords > targetWords) {
    // If too many words, truncate
    newBody = words.slice(0, targetWords).join(' ');
  } else if (currentWords < targetWords) {
    // If too few words, duplicate until we reach the target
    const repeats = Math.ceil(targetWords / currentWords);
    newBody = Array(repeats).fill(body).join(' ').split(/\s+/).slice(0, targetWords).join(' ');
  } else {
    newBody = body;
  }
  
  // Reconstruct the email if it's an email
  if (inputType === 'email') {
    let result = '';
    if (subject) {
      result += `Subject: ${subject}\n\n`;
    }
    if (greeting) {
      result += `${greeting}\n\n`;
    }
    result += newBody;
    if (signature) {
      result += `\n\n${signature}`;
    }
    return result;
  }
  
  // Otherwise just return the body
  return newBody;
}