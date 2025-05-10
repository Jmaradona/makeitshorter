import { AIResponse } from '../types';
import { countWords, cleanAIResponse, extractEmailParts } from '../utils/textUtils';
import { useUserStore } from '../store/userStore';
import { checkUsage, recordUsage } from './usageService';
import env from '../env';
import OpenAI from 'openai';

interface EnhanceEmailPayload {
  content: string;
  tone: string;
  targetWords: number;
  inputType: string;
  enforceExactWordCount?: boolean;
}

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
    apiKey: env.OPENAI_API_KEY,
    dangerouslyAllowBrowser: true,
    defaultHeaders: {
      'OpenAI-Beta': 'assistants=v2'
    }
  });
} catch (error) {
  console.error("Failed to initialize OpenAI client:", error);
  openai = null;
}

// ==================== TEST MODE ====================
// Test mode function that never calls the OpenAI API
function generateTestModeResponse(content: string, targetWords: number, inputType: string, enforceExactWordCount: boolean = false): string {
  console.log(`TEST MODE: Generating ${enforceExactWordCount ? 'EXACTLY' : 'about'} ${targetWords} words for ${inputType}`);
  
  // Extract existing parts if it's an email
  let subject = '';
  let greeting = '';
  let signature = '';
  let mainContent = content;
  
  if (inputType === 'email') {
    // Extract email parts from original content if possible
    const { subject: extractedSubject, greeting: extractedGreeting, body, signature: extractedSignature } = 
      extractEmailParts(content);
    
    if (extractedSubject) {
      subject = `Subject: ${extractedSubject}\n\n`;
    } else {
      // Generate a subject based on content
      const firstLine = content.split(/[.!?]/, 1)[0].trim();
      const keywords = firstLine.split(/\s+/).filter(word => word.length > 3).slice(0, 3);
      
      if (keywords.length > 0) {
        subject = `Subject: ${keywords.join(' ')} - Update\n\n`;
      } else {
        const subjectOptions = [
          'Update on our recent discussion',
          'Follow-up regarding our project',
          'Important information about your request', 
          'Response to your inquiry',
          'Next steps for our collaboration'
        ];
        subject = `Subject: ${subjectOptions[Math.floor(Math.random() * subjectOptions.length)]}\n\n`;
      }
    }
    
    if (extractedGreeting) {
      greeting = extractedGreeting + '\n\n';
    } else {
      const greetings = ['Hi there,', 'Hello,', 'Dear team,', 'Good day,', 'Greetings,'];
      greeting = `${greetings[Math.floor(Math.random() * greetings.length)]}\n\n`;
    }
    
    if (extractedSignature) {
      signature = `\n\n${extractedSignature}`;
    } else {
      // Use the user's preferred goodbye if available, otherwise choose randomly
      const { preferences } = useUserStore.getState();
      const favoriteGoodbye = preferences.favoriteGoodbye;
      
      let closingText = '';
      if (favoriteGoodbye === 'best') {
        closingText = 'Best regards,';
      } else if (favoriteGoodbye === 'sincerely') {
        closingText = 'Sincerely,';
      } else if (favoriteGoodbye === 'thanks') {
        closingText = 'Thanks,';
      } else if (favoriteGoodbye === 'cheers') {
        closingText = 'Cheers,';
      } else if (favoriteGoodbye === 'regards') {
        closingText = 'Regards,';
      } else {
        // AI decide or default case
        const closings = ['Best regards,', 'Kind regards,', 'Thanks,', 'Sincerely,', 'Regards,'];
        closingText = closings[Math.floor(Math.random() * closings.length)];
      }
      
      signature = `\n\n${closingText}`;
      
      // Add name if available
      if (preferences.name) {
        signature += `\n${preferences.name}`;
        
        // Add position and company if available
        if (preferences.position) {
          signature += `\n${preferences.position}`;
        }
        
        if (preferences.company) {
          signature += `\n${preferences.company}`;
        }
        
        // Add contact info if available
        if (preferences.contact) {
          signature += `\n${preferences.contact}`;
        }
      }
    }
    
    mainContent = body || content;
  }
  
  // Generate exact word count content for the body only
  const words = mainContent.split(/\s+/).filter(word => word.length > 0);
  const currentWords = words.length;
  
  // For exact word count mode (balanced), try to keep the content more similar to original
  const keepOriginalContent = enforceExactWordCount && targetWords === currentWords;
  
  // Filler words for expanding content if needed
  const fillerWords = [
    'effectively', 'efficiently', 'specifically', 'particularly',
    'notably', 'significantly', 'consequently', 'furthermore',
    'additionally', 'moreover', 'therefore', 'however',
    'nevertheless', 'meanwhile', 'subsequently', 'accordingly'
  ];
  
  // Create body with EXACT word count
  let bodyText = '';
  
  if (keepOriginalContent) {
    // For balanced mode, we use the original content with minor changes
    // to improve it while maintaining exact word count
    bodyText = words.join(' ');
    
    // Make a few random replacements to simulate enhancement while preserving length
    const replacements = [
      { from: 'good', to: 'excellent' },
      { from: 'bad', to: 'poor' },
      { from: 'big', to: 'substantial' },
      { from: 'small', to: 'minimal' },
      { from: 'said', to: 'mentioned' },
      { from: 'think', to: 'believe' },
      { from: 'use', to: 'utilize' },
      { from: 'make', to: 'create' },
      { from: 'get', to: 'obtain' },
      { from: 'want', to: 'desire' }
    ];
    
    let modifiedWords = words.slice();
    let replacementsMade = 0;
    
    // Apply up to 5 replacements or 10% of words, whichever is smaller
    const maxReplacements = Math.min(5, Math.floor(currentWords * 0.1));
    
    for (const replacement of replacements) {
      if (replacementsMade >= maxReplacements) break;
      
      for (let i = 0; i < modifiedWords.length; i++) {
        if (modifiedWords[i].toLowerCase() === replacement.from) {
          modifiedWords[i] = replacement.to;
          replacementsMade++;
          break;
        }
      }
    }
    
    bodyText = modifiedWords.join(' ');
  } else if (targetWords > currentWords) {
    // Need to expand the content
    const wordsNeeded = targetWords - currentWords;
    
    // Create an array of filler words
    const fillers = Array(wordsNeeded)
      .fill(0)
      .map(() => fillerWords[Math.floor(Math.random() * fillerWords.length)]);
    
    // Mix original words with fillers
    const newWords = [];
    let fillerIndex = 0;
    
    for (let i = 0; i < words.length; i++) {
      newWords.push(words[i]);
      if (fillerIndex < fillers.length && Math.random() > 0.5) {
        newWords.push(fillers[fillerIndex++]);
      }
    }
    
    // Add any remaining fillers
    while (fillerIndex < fillers.length) {
      newWords.push(fillers[fillerIndex++]);
    }
    
    bodyText = newWords.slice(0, targetWords).join(' ');
  } else if (targetWords < currentWords) {
    // Need to shorten the content
    bodyText = words.slice(0, targetWords).join(' ');
  } else {
    // Current length matches target
    bodyText = words.join(' ');
  }
  
  // Format the body with paragraphs
  const sentences = bodyText.match(/[^.!?]+[.!?]+/g) || [bodyText];
  const paragraphs = [];
  let currentParagraph = '';
  
  for (let i = 0; i < sentences.length; i++) {
    currentParagraph += sentences[i].trim() + ' ';
    
    // Create a new paragraph every 2-3 sentences or at the end
    if ((i + 1) % 3 === 0 || i === sentences.length - 1) {
      paragraphs.push(currentParagraph.trim());
      currentParagraph = '';
    }
  }
  
  const formattedBody = paragraphs.join('\n\n');
  
  // Verify exact word count of body
  const bodyWordCount = countWords(formattedBody);
  
  // Make final adjustments if needed
  let finalBody = formattedBody;
  if (bodyWordCount !== targetWords) {
    const diff = targetWords - bodyWordCount;
    if (diff > 0) {
      // Add exact words needed
      const extraWords = Array(diff).fill('additional').join(' ');
      finalBody = formattedBody + ' ' + extraWords;
    } else {
      // Remove exact words needed
      const allWords = formattedBody.split(/\s+/);
      finalBody = allWords.slice(0, allWords.length + diff).join(' ');
    }
  }
  
  // Verify final count once more
  const finalBodyWords = countWords(finalBody);
  console.log(`TEST MODE: Generated body with ${finalBodyWords} words (target: ${targetWords})`);
  
  // Combine all parts
  let result = '';
  if (inputType === 'email') {
    result = subject + greeting + finalBody + signature;
  } else {
    result = finalBody;
  }
  
  return result;
}

// ==================== ASSISTANTS API MODE ====================
async function useAssistantsAPI(payload: EnhanceEmailPayload, assistantId: string): Promise<{content: string, warning?: string}> {
  try {
    if (!openai) {
      throw new Error("OpenAI client not initialized");
    }

    const exactWordMode = payload.enforceExactWordCount === true;
    console.log(`ASSISTANTS API: Requesting ${exactWordMode ? 'EXACTLY' : 'about'} ${payload.targetWords} words with ${payload.tone} tone`);

    // Get user signature preferences
    const { preferences } = useUserStore.getState();
    const { name, position, company, contact, favoriteGoodbye, style, formality, traits, context } = preferences;

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
- Writing Style: Use a ${style} style that is ${formality} in tone
- Communication Context: Write for a ${context} environment
- Key Traits to Emphasize: ${traits.join(', ')}
- Word Count: The main body should have ${exactWordMode ? 'EXACTLY' : 'approximately'} ${payload.targetWords} words
- Content: Keep the original meaning and intent while improving clarity and impact
`;

    if (payload.inputType === 'email') {
      userMessage += `
Email Format Requirements:
- Subject: ${extractedSubject || 'Create an appropriate subject line'}
- Greeting: ${extractedGreeting || 'Include an appropriate greeting'}
- Body: Main content (${payload.targetWords} words)
`;

      // Add signature instructions based on user preferences
      userMessage += `- Signature: `;
      
      // Add goodbye preference
      let goodbyeText = '';
      if (favoriteGoodbye === 'best') {
        goodbyeText = "Use 'Best regards,' as the closing";
      } else if (favoriteGoodbye === 'sincerely') {
        goodbyeText = "Use 'Sincerely,' as the closing";
      } else if (favoriteGoodbye === 'thanks') {
        goodbyeText = "Use 'Thanks,' as the closing";
      } else if (favoriteGoodbye === 'cheers') {
        goodbyeText = "Use 'Cheers,' as the closing";
      } else if (favoriteGoodbye === 'regards') {
        goodbyeText = "Use 'Regards,' as the closing";
      } else {
        goodbyeText = "Choose an appropriate closing based on the context";
      }
      
      userMessage += goodbyeText + "\n";
      
      // Check if any signature information exists
      if (name || position || company || contact) {
        userMessage += `Please include the following in the signature:\n`;
        if (name) userMessage += `  - Name: ${name}\n`;
        if (position) userMessage += `  - Position: ${position}\n`;
        if (company) userMessage += `  - Company: ${company}\n`;
        if (contact) userMessage += `  - Contact: ${contact}\n`;
      } else {
        userMessage += `Add a simple signature after the closing.`;
      }
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

// ==================== MAIN EXPORT FUNCTION ====================
export async function enhanceEmail(payload: EnhanceEmailPayload): Promise<AIResponse> {
  const { isOfflineMode } = useUserStore.getState();
  const { assistantId } = useUserStore.getState();
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

  const estimatedInputTokens = estimateTokens(payload.content);
  if (estimatedInputTokens > MAX_INPUT_TOKENS) {
    return { 
      enhancedContent: '',
      error: `Input too long. Maximum ${MAX_INPUT_TOKENS} tokens allowed.` 
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
      enhancedContent = generateTestModeResponse(
        payload.content, 
        payload.targetWords, 
        payload.inputType,
        payload.enforceExactWordCount
      );
      
      // Verify test mode output
      const { body } = extractEmailParts(enhancedContent);
      const bodyWordCount = countWords(body);
      
      // Use stricter tolerance for exact word count mode
      const tolerance = payload.enforceExactWordCount ? 0 : 3;
      
      if (Math.abs(bodyWordCount - payload.targetWords) > tolerance) {
        warning = `Test mode generated ${bodyWordCount} words instead of the requested ${payload.targetWords} words.`;
        console.warn(warning);
      }
    } else {
      // Check if API key is available
      if (!env.OPENAI_API_KEY) {
        console.error('OpenAI API key is missing');
        return {
          enhancedContent: '',
          error: 'OpenAI API key is not configured. Please check your environment variables.'
        };
      }

      if (!openai) {
        console.error('OpenAI client not initialized');
        return {
          enhancedContent: '',
          error: 'Failed to initialize OpenAI client. Please check your configuration.'
        };
      }

      // Use the provided assistant ID if available, otherwise use the default
      const effectiveAssistantId = assistantId && assistantId.startsWith('asst_') 
                                  ? assistantId 
                                  : DEFAULT_ASSISTANT_ID;
      
      console.log('Using assistant ID:', effectiveAssistantId);

      try {
        // Use the Assistants API
        const result = await useAssistantsAPI(payload, effectiveAssistantId);
        enhancedContent = result.content;
        warning = result.warning || '';
      } catch (error: any) {
        // Check for specific assistant ID error
        if (error.message?.includes('Invalid \'assistant_id\'') || 
            error.message?.includes('assistant_id')) {
          console.error('Invalid assistant ID format detected. Falling back to default ID.');
          
          // Try again with the default assistant ID
          try {
            const result = await useAssistantsAPI(payload, DEFAULT_ASSISTANT_ID);
            enhancedContent = result.content;
            warning = result.warning || 'Used default assistant due to configuration issue.';
          } catch (retryError: any) {
            throw new Error('Failed to process with default assistant: ' + retryError.message);
          }
        } else {
          // For any other errors, rethrow
          throw error;
        }
      }
    }
    
    // Record successful usage
    await recordUsage(user?.id);
    
    // Update remaining messages count in store
    const updatedUsage = await checkUsage(user?.id);
    const { setRemainingMessages, setIsPaid } = useUserStore.getState();
    setRemainingMessages(updatedUsage.remainingMessages);
    setIsPaid(updatedUsage.requiresPayment);
    
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
      const errorMessage = error.message?.includes('API key') 
        ? 'OpenAI API key is invalid or not properly configured. Please check your environment variables.'
        : 'Failed to connect to OpenAI. Please try again later.';
      
      return { 
        enhancedContent: '',
        error: errorMessage
      };
    }
  }
}