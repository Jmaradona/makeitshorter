// Shared type definitions
export type EmailTone = {
  id: string;
  label: string;
  description: string;
};

export type AIRequestPayload = {
  content: string;
  tone: string;
  targetWords: number;
  inputType: string;
  enforceExactWordCount?: boolean;
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

export type UserProfile = {
  id: string;
  email?: string;
  preferences: UserPreferences;
  assistantId?: string;
  created_at?: string;
  updated_at?: string;
  daily_free_messages?: number;
  last_reset_date?: string;
  paid?: boolean;
};

export interface StripeSubscription {
  customer_id: string;
  subscription_id: string | null;
  subscription_status: string;
  price_id: string | null;
  current_period_start: number | null;
  current_period_end: number | null;
  cancel_at_period_end: boolean;
  payment_method_brand: string | null;
  payment_method_last4: string | null;
  webhook_received?: boolean;
  webhook_timestamp?: string | null;
  metadata?: any;
  latest_invoice_id?: string | null;
}

export interface StripeOrder {
  customer_id: string;
  order_id: number;
  checkout_session_id: string;
  payment_intent_id: string;
  amount_subtotal: number;
  amount_total: number;
  currency: string;
  payment_status: string;
  order_status: string;
  order_date: string;
}

export type StripeProduct = {
  id: string;
  name: string;
  priceId: string;
  description: string;
  price: string;
  mode: 'subscription' | 'payment';
  features: string[];
};