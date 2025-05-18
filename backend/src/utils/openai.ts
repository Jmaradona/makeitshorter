import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  console.error('Missing OpenAI API key environment variable');
  process.exit(1);
}

// Initialize OpenAI client with beta header
export const openai = new OpenAI({
  apiKey,
  defaultHeaders: {
    'OpenAI-Beta': 'assistants=v2'
  }
});

// Default assistant ID to use if user doesn't have one assigned
export const DEFAULT_ASSISTANT_ID = 'asst_F4jvQcayYieO8oghTPxC7Qel';

// Constants for token control
export const MAX_INPUT_TOKENS = 16000;
export const MAX_OUTPUT_TOKENS = 4000;
export const TOKENS_PER_WORD = 1.3;

// Function to estimate tokens
export function estimateTokens(text: string): number {
  const wordCount = text.split(/\s+/).filter(word => word.length > 0).length;
  return Math.ceil(wordCount * TOKENS_PER_WORD);
}

// Helper to clean AI response text
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