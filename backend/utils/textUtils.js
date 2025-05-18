// Count words in a text
export function countWords(text) {
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

// Clean AI response by removing markdown formatting
export function cleanAIResponse(text) {
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
export function extractEmailParts(emailText) {
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