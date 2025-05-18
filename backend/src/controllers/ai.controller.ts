import { Request, Response, NextFunction } from 'express';
import { openai, DEFAULT_ASSISTANT_ID, estimateTokens, MAX_INPUT_TOKENS, cleanAIResponse } from '../utils/openai.js';
import { AppError } from '../middleware/errorHandler.js';
import { supabaseAdmin } from '../utils/supabase.js';
import { checkAndUpdateUsage } from '../services/usage.service.js';
import { extractEmailParts } from '../utils/textUtils.js';

interface EnhanceEmailPayload {
  content: string;
  tone: string;
  targetWords: number;
  inputType: string;
  enforceExactWordCount?: boolean;
}

// Enhance email content using OpenAI
export const enhanceEmail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { content, tone, targetWords, inputType, enforceExactWordCount } = req.body as EnhanceEmailPayload;
    const userId = req.user?.id;
    
    // Validate required fields
    if (!content?.trim()) {
      throw new AppError('Content is required', 400);
    }

    if (!targetWords || targetWords < 1) {
      throw new AppError('Invalid target word count', 400);
    }

    // Estimate tokens to prevent exceeding limits
    const estimatedInputTokens = estimateTokens(content);
    if (estimatedInputTokens > MAX_INPUT_TOKENS) {
      throw new AppError(`Input too long. Maximum ${MAX_INPUT_TOKENS} tokens allowed.`, 400);
    }

    // Check usage limits
    const canProceed = await checkAndUpdateUsage(userId);
    if (!canProceed.canMakeRequest) {
      if (canProceed.requiresAuth) {
        throw new AppError('Authentication required to continue', 401);
      }
      if (canProceed.requiresPayment) {
        throw new AppError('Upgrade required to continue', 402);
      }
      throw new AppError('Usage limit reached', 429);
    }

    // If user is authenticated, get their assistant ID
    let assistantId = DEFAULT_ASSISTANT_ID;
    if (userId) {
      const { data: userData } = await supabaseAdmin
        .from('users')
        .select('assistant_id')
        .eq('id', userId)
        .single();

      if (userData?.assistant_id && userData.assistant_id.startsWith('asst_')) {
        assistantId = userData.assistant_id;
      }
    }

    // Enhance the content using the OpenAI Assistants API
    const result = await useAssistantsAPI(
      { content, tone, targetWords, inputType, enforceExactWordCount }, 
      assistantId
    );
    
    // Send the enhanced content back to the client
    res.status(200).json({
      enhancedContent: result.content,
      ...(result.warning && { warning: result.warning })
    });

  } catch (error) {
    next(error);
  }
};

// Function to use OpenAI Assistants API for enhancement
async function useAssistantsAPI(
  payload: EnhanceEmailPayload, 
  assistantId: string
): Promise<{content: string, warning?: string}> {
  try {
    const exactWordMode = payload.enforceExactWordCount === true;
    
    // Get user signature preferences from payload tone
    const toneInfo = payload.tone || '';

    // Create a thread
    const thread = await openai.beta.threads.create();

    // Extract email parts to preserve structure if needed
    let extractedSubject = '';
    let extractedGreeting = '';
    let extractedSignature = '';
    
    if (payload.inputType === 'email') {
      const { subject, greeting, signature } = extractEmailParts(payload.content);
      extractedSubject = subject || '';
      extractedGreeting = greeting || '';
      extractedSignature = signature || '';
    }

    // Prepare the user message with all necessary instructions
    let userMessage = `Please enhance this ${payload.inputType} with ${exactWordMode ? 'EXACTLY' : 'approximately'} ${payload.targetWords} words in the main body.

Content to enhance:
${payload.content}

Requirements:
- Writing Style: ${toneInfo}
- Word Count: The main body should have ${exactWordMode ? 'EXACTLY' : 'approximately'} ${payload.targetWords} words
- Content: Keep the original meaning and intent while improving clarity and impact
`;

    if (payload.inputType === 'email') {
      userMessage += `
Email Format Requirements:
- Subject: ${extractedSubject || 'Create an appropriate subject line'}
- Greeting: ${extractedGreeting || 'Include an appropriate greeting'}
- Body: Main content (${payload.targetWords} words)
- Signature: ${extractedSignature || 'Include an appropriate signature'}
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
        throw new AppError(`Assistant run failed with status: ${runStatus.status}`, 500);
      }

      await new Promise(resolve => setTimeout(resolve, pollInterval));
      attempts++;
    }

    if (!completedRun) {
      throw new AppError('Assistant run timed out', 500);
    }

    // Fetch the assistant's response
    const messages = await openai.beta.threads.messages.list(thread.id);
    
    // Get the latest assistant message
    const assistantMessages = messages.data.filter(msg => msg.role === 'assistant');
    if (assistantMessages.length === 0) {
      throw new AppError('No response from assistant', 500);
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
      throw new AppError('Empty response from assistant', 500);
    }

    // Verify word count in the body
    const { body } = extractEmailParts(enhancedContent);
    const bodyWordCount = countWords(body);
    
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
    throw new AppError(error.message || 'Failed to enhance content', 500);
  }
}

// Helper function to count words
function countWords(text: string): number {
  if (!text || typeof text !== 'string') return 0;
  
  // Remove extra whitespace and split into words
  const words = text
    .trim()
    .replace(/[\r\n]+/g, ' ')
    .replace(/\s+/g, ' ')
    .split(' ')
    .filter(word => word.length > 0);

  return words.length;
}

// Extract email parts for accurate word counting
export function extractEmailParts(emailText: string): { 
  subject: string, 
  greeting: string, 
  body: string, 
  signature: string 
} {
  if (!emailText || typeof emailText !== 'string') {
    return { subject: '', greeting: '', body: emailText || '', signature: '' };
  }
  
  // Default result
  const result = { subject: '', greeting: '', body: emailText, signature: '' };
  
  // Step 1: Extract subject line
  const subjectMatch = emailText.match(/^Subject:\s*(.+?)(?=\n\n|\n[A-Za-z])/si);
  if (subjectMatch && subjectMatch[1]) {
    result.subject = subjectMatch[1].trim();
    
    // Remove subject from text for further processing
    emailText = emailText.substring(emailText.indexOf(subjectMatch[0]) + subjectMatch[0].length).trim();
  }
  
  // Step 2: Split content into lines for further processing
  const lines = emailText.split('\n').map(line => line.trim());
  const nonEmptyLines = lines.filter(line => line.length > 0);
  
  // Step 3: Extract greeting (first non-empty line if it looks like a greeting)
  if (nonEmptyLines.length > 0) {
    const firstLine = nonEmptyLines[0];
    if (/^(hi|hello|dear|good\s*day|greetings|hey)/i.test(firstLine) && firstLine.length < 60) {
      result.greeting = firstLine;
      // Remove greeting for further processing
      const greetingIndex = emailText.indexOf(firstLine);
      if (greetingIndex !== -1) {
        emailText = emailText.substring(greetingIndex + firstLine.length).trim();
      }
    }
  }
  
  // Step 4: Extract signature (typically after "Regards," "Sincerely," etc.)
  const signaturePatterns = [
    /\n\s*(regards|sincerely|thank you|best|cheers|yours|truly|thanks|thank you|warm regards)/i,
    /\n\s*--\s*\n/,
    /\n\s*-{2,}\s*\n/
  ];
  
  let signatureMatch = null;
  for (const pattern of signaturePatterns) {
    const match = emailText.match(pattern);
    if (match) {
      signatureMatch = match;
      break;
    }
  }
  
  if (signatureMatch) {
    const signatureIndex = signatureMatch.index;
    if (signatureIndex !== undefined && signatureIndex > 0) {
      // Extract signature part
      result.signature = emailText.substring(signatureIndex).trim();
      // Remove signature from body
      emailText = emailText.substring(0, signatureIndex).trim();
    }
  }
  
  // Step 5: The remaining text is the body
  result.body = emailText.trim();
  
  return result;
}