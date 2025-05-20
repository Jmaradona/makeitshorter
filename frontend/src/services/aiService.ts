import { AIResponse, AIRequestPayload } from 'shared/src/types';
import { extractEmailParts, countWords, cleanAIResponse } from 'shared/src/utils/textUtils';
import { supabase } from '@/lib/supabase-client';
import { useUserStore } from '@/store/userStore';
import { checkUsage, recordUsage } from './usageService';
import env from '@/env';

// Implementation of a test mode response generator with no API calls
export function generateTestModeResponse(content: string, targetWords: number, inputType: string, enforceExactWordCount: boolean = false): string {
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

// The main enhance function that calls the backend
export async function enhanceEmail(payload: AIRequestPayload): Promise<AIResponse> {
  try {
    const { isOfflineMode, user } = useUserStore.getState();
    
    // Basic validation
    if (!payload.content?.trim()) {
      return { enhancedContent: '', error: 'Content is required' };
    }

    if (!payload.targetWords || payload.targetWords < 1) {
      return { enhancedContent: '', error: 'Invalid target word count' };
    }
    
    // Check usage limits
    const usageCheck = await checkUsage(user?.id);
    if (!usageCheck.canMakeRequest) {
      if (usageCheck.requiresAuth) {
        return { enhancedContent: '', error: 'login_required' };
      }
      if (usageCheck.requiresPayment) {
        return { enhancedContent: '', error: 'payment_required' };
      }
      
      return { enhancedContent: '', error: 'Usage limit reached' };
    }
    
    // If in offline/test mode, use local generation
    if (isOfflineMode) {
      const enhancedContent = generateTestModeResponse(
        payload.content,
        payload.targetWords,
        payload.inputType,
        payload.enforceExactWordCount
      );
      
      // Record usage for the test mode request
      await recordUsage(user?.id);
      
      return { enhancedContent };
    }
    
    // Get authentication token if user is logged in
    const { data: { session } } = await supabase.auth.getSession();
    const authHeader = session ? { 'Authorization': `Bearer ${session.access_token}` } : {};
    
    // Call the backend API
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/ai/enhance`, {
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
    
    // Record successful usage
    await recordUsage(user?.id);
    
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