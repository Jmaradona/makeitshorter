export type EmailTone = {
  id: string;
  label: string;
  description: string;
};

export type AIRequestPayload = {
  content: string;
  tone: string;
  lengthAdjustment: number;
  inputType: string;
};

export type AIResponse = {
  enhancedContent: string;
  error?: string;
  warning?: string;
};

export interface UserPreferences {
  style: string;
  formality: string;
  traits: string[];
  context: string;
  tone: string;
  length: string;
  name?: string;
  position?: string;
  company?: string;
  contact?: string;
  favoriteGoodbye?: string;
}