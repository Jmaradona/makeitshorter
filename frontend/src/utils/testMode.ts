import { countWords, extractEmailParts } from './textUtils';
import { useUserStore } from '../store/userStore';

// Test mode function that generates content without calling the API
export function generateTestModeResponse(
  content: string, 
  targetWords: number, 
  inputType: string,
  enforceExactWordCount: boolean = false
): string {
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
  
  // Combine all parts
  let result = '';
  if (inputType === 'email') {
    result = subject + greeting + finalBody + signature;
  } else {
    result = finalBody;
  }
  
  return result;
}