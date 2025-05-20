export function countWords(text: string): number {
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

// Typography constants for more accurate word estimation
const TYPOGRAPHY = {
  // Average character width in pixels (for standard body text)
  charWidth: 8.1,
  // Standard line height in pixels (including spacing)
  lineHeight: 24,
  // Average characters per word (including space)
  charsPerWord: 6,
  // Container padding (horizontal + vertical)
  padding: {
    horizontal: 32,
    vertical: 16
  },
  // Font size in pixels
  fontSize: 16
};

export function calculateWordsFromHeight(height: number): number {
  if (height <= 0) return 0;
  
  // Calculate available content area (accounting for padding)
  const availableHeight = Math.max(0, height - TYPOGRAPHY.padding.vertical);
  
  // Approximate container width (typical column width)
  const containerWidth = 600;
  const availableWidth = containerWidth - TYPOGRAPHY.padding.horizontal;
  
  // Calculate number of characters per line based on available width
  const charsPerLine = Math.floor(availableWidth / TYPOGRAPHY.charWidth);
  
  // Calculate number of lines that can fit in the available height
  const numberOfLines = Math.floor(availableHeight / TYPOGRAPHY.lineHeight);
  
  // Calculate total characters that can fit
  const totalChars = numberOfLines * charsPerLine;
  
  // Convert characters to words
  const estimatedWords = Math.floor(totalChars / TYPOGRAPHY.charsPerWord);
  
  // Apply a density factor to account for real-world text behavior
  const densityFactor = 0.85; // Text rarely fills 100% of available space
  
  // Return rounded number (to nearest 5) with a minimum value
  return Math.max(20, Math.round((estimatedWords * densityFactor) / 5) * 5);
}

export function estimateHeightFromWords(wordCount: number): number {
  if (wordCount <= 0) return 50; // Minimum height
  
  // Convert words to characters
  const totalChars = wordCount * TYPOGRAPHY.charsPerWord;
  
  // Approximate container width
  const containerWidth = 600;
  const availableWidth = containerWidth - TYPOGRAPHY.padding.horizontal;
  
  // Calculate number of characters per line
  const charsPerLine = Math.floor(availableWidth / TYPOGRAPHY.charWidth);
  
  // Calculate number of lines needed
  const numberOfLines = Math.ceil(totalChars / charsPerLine);
  
  // Calculate required height
  const contentHeight = numberOfLines * TYPOGRAPHY.lineHeight;
  
  // Add padding
  return contentHeight + TYPOGRAPHY.padding.vertical;
}

export function cleanAIResponse(text: string): string {
  if (!text) return '';
  
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/`(.*?)`/g, '$1')
    .replace(/_{2,}/g, '')
    .replace(/#{1,6}\s/g, '')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    .trim();
}

// Extract all parts of an email for accurate word counting
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

// Extract subject line from email text (simplified version for backward compatibility)
export function extractSubject(emailText: string): { subject: string, body: string } {
  if (!emailText || typeof emailText !== 'string') {
    return { subject: '', body: emailText || '' };
  }
  
  // Look for subject line pattern
  const subjectMatch = emailText.match(/^Subject:\s*(.+?)(\n\n|\n[A-Za-z])/si);
  
  if (subjectMatch && subjectMatch[1]) {
    const subject = subjectMatch[1].trim();
    const subjectEndIndex = emailText.indexOf(subject) + subject.length;
    
    // Get the remaining text as body, handling different newline patterns
    let body = emailText.substring(subjectEndIndex).replace(/^\s+/, '');
    
    // If the first character is not a newline, add one for proper formatting
    if (body && body[0] !== '\n') {
      body = '\n' + body;
    }
    
    return { subject, body };
  }
  
  return { subject: '', body: emailText };
}

// Verify exact word count for a string
export function verifyWordCount(text: string, targetCount: number): boolean {
  const count = countWords(text);
  return count === targetCount;
}

// Adjust text to match exact word count
export function adjustTextToWordCount(text: string, targetCount: number): string {
  const words = text.split(/\s+/);
  const currentCount = words.length;
  
  if (currentCount === targetCount) {
    return text;
  }
  
  if (currentCount > targetCount) {
    // If too many words, truncate
    return words.slice(0, targetCount).join(' ');
  } else {
    // If too few words, add filler
    const fillerWords = [
      'additionally', 'furthermore', 'moreover', 'consequently',
      'specifically', 'particularly', 'certainly', 'definitely'
    ];
    
    const missing = targetCount - currentCount;
    const fillers = Array(missing)
      .fill(0)
      .map(() => fillerWords[Math.floor(Math.random() * fillerWords.length)]);
    
    return [...words, ...fillers].join(' ');
  }
}