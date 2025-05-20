import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';
import { supabase } from '@/lib/supabase-server';
import { AIRequestPayload, AIResponse } from 'shared/src/types';
import { countWords, extractEmailParts, cleanAIResponse } from 'shared/src/utils/textUtils';

// Constants for token control
const MAX_INPUT_TOKENS = 16000;
const MAX_OUTPUT_TOKENS = 4000;
const TOKENS_PER_WORD = 1.3;

// Default assistant ID to use if user doesn't have one assigned
const DEFAULT_ASSISTANT_ID = 'asst_F4jvQcayYieO8oghTPxC7Qel';

// Function to estimate tokens
function estimateTokens(text: string): number {
  return Math.ceil(countWords(text) * TOKENS_PER_WORD);
}

// Initialize OpenAI client with beta header
let openai: OpenAI | null = null;
try {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    defaultHeaders: {
      'OpenAI-Beta': 'assistants=v2'
    }
  });
} catch (error) {
  console.error("Failed to initialize OpenAI client:", error);
  openai = null;
}

// Check if user has reached usage limit
async function checkUsage(userId?: string | null): Promise<{
  canMakeRequest: boolean;
  remainingMessages: number;
  requiresAuth: boolean;
  requiresPayment: boolean;
}> {
  const GUEST_MAX_MESSAGES = 5;
  const DAILY_FREE_MESSAGES = 5;

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
      
      return {
        canMakeRequest: false,
        remainingMessages: 0,
        requiresAuth: false,
        requiresPayment: true
      };
    }
  }
  
  // For guest users, use hardcoded values
  return {
    canMakeRequest: true, // Allow guests in API mode as frontend will handle checks
    remainingMessages: GUEST_MAX_MESSAGES,
    requiresAuth: false,
    requiresPayment: false
  };
}

// Reset user's daily messages if needed
async function resetUserMessagesIfNeeded(userId: string): Promise<boolean> {
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
          daily_free_messages: 5,
          last_reset_date: new Date().toISOString().split('T')[0]
        })
        .eq('id', userId);
      return true;
    }

    const lastResetDate = new Date(data.last_reset_date);
    const today = new Date();
    const isToday = lastResetDate.getDate() === today.getDate() &&
                    lastResetDate.getMonth() === today.getMonth() &&
                    lastResetDate.getFullYear() === today.getFullYear();
                    
    if (!isToday) {
      // Reset date is not today, update counter and date
      await supabase
        .from('users')
        .update({
          daily_free_messages: 5,
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

// Record a successful API request
async function recordUsage(userId?: string | null): Promise<boolean> {
  if (!userId) return true; // Skip for guest users
  
  try {
    // Decrement the user's daily message count using RPC function
    const { data, error } = await supabase.rpc('decrement_daily_messages', {
      user_id: userId
    });

    if (error) throw error;
    return data === true;
  } catch (error) {
    console.error('Error recording user usage:', error);
    return false;
  }
}

// The main assistants API function
async function useAssistantsAPI(payload: AIRequestPayload, assistantId: string): Promise<{content: string, warning?: string}> {
  try {
    if (!openai) {
      throw new Error("OpenAI client not initialized");
    }

    const exactWordMode = payload.enforceExactWordCount === true;
    console.log(`ASSISTANTS API: Requesting ${exactWordMode ? 'EXACTLY' : 'about'} ${payload.targetWords} words with ${payload.tone} tone`);

    // Create a thread
    const thread = await openai.beta.threads.create();

    // Prepare the user message with all necessary instructions
    let userMessage = `Please enhance this ${payload.inputType} with ${exactWordMode ? 'EXACTLY' : 'approximately'} ${payload.targetWords} words in the main body.

Content to enhance:
${payload.content}

Requirements:
- Tone: ${payload.tone}
- Word Count: The main body should have ${exactWordMode ? 'EXACTLY' : 'approximately'} ${payload.targetWords} words
- Content: Keep the original meaning and intent while improving clarity and impact
`;

    if (payload.inputType === 'email') {
      const { subject, greeting, signature } = extractEmailParts(payload.content);
      
      userMessage += `
Email Format Requirements:
- Subject: ${subject || 'Create an appropriate subject line'}
- Greeting: ${greeting || 'Include an appropriate greeting'}
- Body: Main content (${payload.targetWords} words)
- Signature: ${signature || 'Include an appropriate signature'}
`;
    }

    if (exactWordMode) {
      userMessage += `
CRITICAL REQUIREMENT: This is a "Same Length" request. You MUST generate EXACTLY ${payload.targetWords} words in the main body (excluding subject, greeting, and signature). Count words carefully.
`;
    }

    // Add the message to the thread
    await openai.beta.threads.messages.create(thread.id, {
      role: "user",
      content: userMessage
    });

    // Run the assistant
    let run;
    try {
      run = await openai.beta.threads.runs.create(
        thread.id,
        {
          assistant_id: assistantId
        }
      );
    } catch (error: any) {
      // If there's an error with the provided assistant ID, try with the default
      console.error("Error with provided assistant ID, trying default:", error.message);
      
      // Only retry with default if the error is about assistant_id
      if (error.message?.includes('Invalid \'assistant_id\'') || 
          error.message?.includes('assistant_id')) {
        run = await openai.beta.threads.runs.create(
          thread.id,
          {
            assistant_id: DEFAULT_ASSISTANT_ID
          }
        );
      } else {
        throw error; // Re-throw if it's not an assistant_id issue
      }
    }

    // Poll for the run to complete
    let completedRun;
    let attempts = 0;
    const maxAttempts = 15;
    const pollInterval = 1000; // 1 second

    while (attempts < maxAttempts) {
      const runStatus = await openai.beta.threads.runs.retrieve(
        thread.id,
        run.id
      );

      if (runStatus.status === 'completed') {
        completedRun = runStatus;
        break;
      } else if (runStatus.status === 'failed' || runStatus.status === 'expired' || runStatus.status === 'cancelled') {
        throw new Error(`Assistant run failed with status: ${runStatus.status}`);
      }

      await new Promise(resolve => setTimeout(resolve, pollInterval));
      attempts++;
    }

    if (!completedRun) {
      throw new Error('Assistant run timed out');
    }

    // Fetch the assistant's response
    const messages = await openai.beta.threads.messages.list(thread.id);
    
    // Get the latest assistant message
    const assistantMessages = messages.data.filter(msg => msg.role === 'assistant');
    if (assistantMessages.length === 0) {
      throw new Error('No response from assistant');
    }

    const latestMessage = assistantMessages[0];
    let enhancedContent = '';

    // Process the message content
    if (latestMessage.content && latestMessage.content.length > 0) {
      const textContent = latestMessage.content.filter(content => content.type === 'text');
      if (textContent.length > 0 && 'text' in textContent[0]) {
        enhancedContent = textContent[0].text.value;
      }
    }

    if (!enhancedContent) {
      throw new Error('Empty response from assistant');
    }

    // Verify word count in the body
    const { body } = extractEmailParts(enhancedContent);
    const bodyWordCount = countWords(body);
    
    // Log the results
    console.log(`Assistant generated body with ${bodyWordCount} words (target: ${payload.targetWords}), diff: ${bodyWordCount - payload.targetWords}`);
    
    let warning = undefined;
    
    // Set different tolerance levels based on whether exact matching is required
    const tolerance = exactWordMode ? 0 : Math.max(10, Math.round(payload.targetWords * 0.05));
    
    if (Math.abs(bodyWordCount - payload.targetWords) > tolerance) {
      warning = exactWordMode 
        ? `The AI generated ${bodyWordCount} words instead of maintaining the exact ${payload.targetWords} words.`
        : `The AI generated ${bodyWordCount} words instead of the requested ${payload.targetWords} words.`;
    }
    
    return {
      content: enhancedContent,
      warning
    };
  } catch (error: any) {
    console.error('OpenAI Assistants API error:', error);
    throw error;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!openai) {
    return res.status(503).json({
      error: 'AI enhancement is currently unavailable. Please check the server configuration.'
    });
  }

  try {
    const payload = req.body as AIRequestPayload;
    
    // Basic validation
    if (!payload.content?.trim()) {
      return res.status(400).json({ error: 'Content is required' });
    }

    if (!payload.targetWords || payload.targetWords < 1) {
      return res.status(400).json({ error: 'Invalid target word count' });
    }

    const estimatedInputTokens = estimateTokens(payload.content);
    if (estimatedInputTokens > MAX_INPUT_TOKENS) {
      return res.status(400).json({ 
        error: `Input too long. Maximum ${MAX_INPUT_TOKENS} tokens allowed.`
      });
    }

    // Get user from token
    let userId = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const { data: { user } } = await supabase.auth.getUser(token);
        userId = user?.id;
      } catch (error) {
        console.error('Error verifying token:', error);
      }
    }

    // Check usage limits
    const usageCheck = await checkUsage(userId);
    if (!usageCheck.canMakeRequest) {
      if (usageCheck.requiresAuth) {
        return res.status(401).json({
          error: 'login_required'
        });
      }
      if (usageCheck.requiresPayment) {
        return res.status(402).json({
          error: 'payment_required'
        });
      }
      
      return res.status(429).json({
        error: 'Usage limit reached'
      });
    }

    // Get user's assistant ID if logged in
    let assistantId = DEFAULT_ASSISTANT_ID;
    if (userId) {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('assistant_id')
        .eq('id', userId)
        .single();
        
      if (!userError && userData && userData.assistant_id && userData.assistant_id.startsWith('asst_')) {
        assistantId = userData.assistant_id;
      }
    }

    // Process the enhancement request
    const result = await useAssistantsAPI(payload, assistantId);
    const enhancedContent = result.content;
    const warning = result.warning;
    
    // Record successful usage for authenticated users
    if (userId) {
      await recordUsage(userId);
    }

    return res.status(200).json({ 
      enhancedContent,
      warning 
    });
  } catch (error: any) {
    console.error('API Error:', error);
    
    if (error.status === 401) {
      return res.status(401).json({ 
        error: 'Invalid API key. Please check your OpenAI API key configuration.'
      });
    } else if (error.status === 429) {
      return res.status(429).json({ 
        error: 'Rate limit exceeded. Please try again in a moment.' 
      });
    } else {
      return res.status(500).json({ 
        error: error.message || 'Failed to enhance content. Please try again.' 
      });
    }
  }
}