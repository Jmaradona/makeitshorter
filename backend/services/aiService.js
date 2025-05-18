import OpenAI from 'openai';
import { countWords, extractEmailParts } from '../utils/textUtils.js';

// Constants for token control
const MAX_INPUT_TOKENS = 16000;
const MAX_OUTPUT_TOKENS = 8000;
const TOKENS_PER_WORD = 1.3;

// Initialize OpenAI client
let openai = null;
try {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not set in environment variables');
  }
  
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: 'https://api.openai.com/v1',
  });
  
  console.log('OpenAI client initialized successfully');
} catch (error) {
  console.error('Failed to initialize OpenAI:', error.message);
}

// Function to estimate tokens
function estimateTokens(text) {
  return Math.ceil(countWords(text) * TOKENS_PER_WORD);
}

export async function enhanceEmail({ content, tone, targetWords, inputType, enforceExactWordCount = false }) {
  if (!openai) {
    return {
      error: 'AI enhancement is currently unavailable. Please check the server configuration.'
    };
  }

  try {
    if (!content?.trim()) {
      return { error: 'Content is required' };
    }

    if (!targetWords || targetWords < 1) {
      return { error: 'Invalid target word count' };
    }

    const estimatedInputTokens = estimateTokens(content);
    if (estimatedInputTokens > MAX_INPUT_TOKENS) {
      return { 
        error: `Input too long. Maximum ${MAX_INPUT_TOKENS} tokens allowed.`
      };
    }

    // Significantly increased token allocation for longer outputs
    const maxOutputTokens = Math.min(
      MAX_OUTPUT_TOKENS,
      Math.max(2000, Math.ceil(targetWords * TOKENS_PER_WORD * 2.5))
    );

    // Completely redesigned prompt with extreme emphasis on exact word count
    const systemPrompt = `You are a writing assistant that rewrites text to ${enforceExactWordCount ? 'EXACTLY' : 'approximately'} the requested word count.

CRITICAL WORD COUNT REQUIREMENT:
Your output MUST contain ${enforceExactWordCount ? 'EXACTLY' : 'approximately'} ${targetWords} words - ${enforceExactWordCount ? 'no more, no less' : 'aim for within 5% of this target'}.

Word counting rules:
1. Words are separated by spaces
2. Hyphenated terms like "state-of-the-art" count as ONE word
3. Contractions like "don't" count as ONE word
4. Acronyms like "AI" or "USA" count as ONE word
5. Numbers like "2024" count as ONE word
6. For emails, the "Subject:" line is NOT counted in the word limit

TASK:
Rewrite the following ${inputType} in ${tone} tone with ${enforceExactWordCount ? 'EXACTLY' : 'approximately'} ${targetWords} words.

FORMAT:
${inputType === 'email' 
  ? 'Subject: [Your subject line]\n\n[Your content with ' + (enforceExactWordCount ? 'EXACTLY' : 'approximately') + ' ' + targetWords + ' words]' 
  : '[Your content with ' + (enforceExactWordCount ? 'EXACTLY' : 'approximately') + ' ' + targetWords + ' words]'}

MANDATORY VERIFICATION PROCESS:
1. Write your response
2. Count the words by splitting on spaces and counting the resulting array length
3. If not ${enforceExactWordCount ? 'EXACTLY' : 'within 5% of'} ${targetWords} words, adjust and recount
4. Only submit when you have ${enforceExactWordCount ? 'EXACTLY' : 'approximately'} ${targetWords} words

This is a strict requirement - the ${enforceExactWordCount ? 'exact' : 'approximate'} word count is more important than preserving all details from the original text.`;

    console.log(`Processing request for ${enforceExactWordCount ? 'EXACTLY' : 'approximately'} ${targetWords} words of content...`);

    // First attempt with standard settings
    let completion = await openai.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content }
      ],
      model: "gpt-3.5-turbo",
      temperature: 0.7,
      max_tokens: maxOutputTokens,
      presence_penalty: 0.1,
      frequency_penalty: 0.1,
    });

    let enhancedContent = completion.choices[0]?.message?.content?.trim();
    
    if (!enhancedContent) {
      throw new Error('No content received from AI');
    }

    // Verify word count in backend for accuracy
    const subjectMatch = enhancedContent.match(/^Subject:.*?\n(.*)/s);
    const textToCount = subjectMatch ? subjectMatch[1].trim() : enhancedContent.trim();
    let wordCount = countWords(textToCount);

    console.log(`First attempt: AI returned ${wordCount} words (requested ${targetWords})`);
    
    // If word count is significantly off, try again with a more explicit approach
    if (enforceExactWordCount && wordCount !== targetWords) {
      console.log(`Word count is off (${wordCount} vs ${targetWords}), trying second attempt...`);
      
      // Second attempt with more explicit instructions and examples
      const retryPrompt = `You previously generated text with ${wordCount} words, but I need EXACTLY ${targetWords} words.

CRITICAL: Count words by splitting on spaces and counting. Each space-separated token is ONE word.

Examples of counting:
- "Hello world" = 2 words
- "state-of-the-art technology" = 3 words
- "don't worry about it" = 4 words
- "AI in 2024" = 3 words

Original content:
${enhancedContent}

Please adjust to EXACTLY ${targetWords} words. The exact count is critical.`;

      completion = await openai.chat.completions.create({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content },
          { role: "assistant", content: enhancedContent },
          { role: "user", content: retryPrompt }
        ],
        model: "gpt-3.5-turbo",
        temperature: 0.5, // Lower temperature for more precise following of instructions
        max_tokens: maxOutputTokens,
        presence_penalty: 0.2,
        frequency_penalty: 0.2,
      });

      enhancedContent = completion.choices[0]?.message?.content?.trim();
      
      // Re-verify word count
      const subjectMatch = enhancedContent.match(/^Subject:.*?\n(.*)/s);
      const textToCount = subjectMatch ? subjectMatch[1].trim() : enhancedContent.trim();
      wordCount = countWords(textToCount);
      
      console.log(`Second attempt: AI returned ${wordCount} words (requested ${targetWords})`);
    }
    
    // Final check and response
    const tolerance = enforceExactWordCount ? 0 : Math.max(5, Math.floor(targetWords * 0.05)); // 5% tolerance
    const minWords = targetWords - tolerance;
    const maxWords = targetWords + tolerance;
    
    let warning = undefined;
    if (wordCount < minWords || wordCount > maxWords) {
      console.warn(`Word count outside tolerance: requested ${targetWords}, got ${wordCount}`);
      warning = enforceExactWordCount
        ? `The AI generated ${wordCount} words instead of maintaining the exact ${targetWords} words.`
        : `The AI generated ${wordCount} words instead of the requested ${targetWords} words.`;
    }

    return { 
      enhancedContent,
      wordCount,
      warning
    };
  } catch (error) {
    console.error('Error in enhanceEmail:', error);
    
    const errorMessage = error.message?.includes('API key') 
      ? 'OpenAI API key is invalid or not properly configured. Please check your environment variables.'
      : 'Failed to connect to OpenAI. Please try again later.';
    
    return { 
      error: errorMessage
    };
  }
}