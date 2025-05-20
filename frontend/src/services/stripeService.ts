import { StripeSubscription, StripeOrder } from 'shared/src/types';
import { supabase } from '@/lib/supabase-client';
import { getProductByPriceId } from 'shared/src/config/stripe-config';

// Create a checkout session
export async function createCheckoutSession(priceId: string, mode: 'subscription' | 'payment' = 'subscription'): Promise<{ url: string, sessionId: string }> {
  try {
    // Get the current user's access token
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('You must be logged in to make a purchase');
    }
    
    // Prepare the success and cancel URLs
    const origin = window.location.origin;
    const successUrl = `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${origin}/checkout/cancel`;
    
    // Call the backend API to create a checkout session
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/stripe/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({
        price_id: priceId,
        success_url: successUrl,
        cancel_url: cancelUrl,
        mode
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create checkout session');
    }
    
    const { url, sessionId } = await response.json();
    
    if (!url) {
      throw new Error('No checkout URL returned');
    }
    
    return { url, sessionId };
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    throw new Error(error.message || 'Failed to create checkout session');
  }
}

// Get the current user's subscription
export async function getUserSubscription(): Promise<StripeSubscription | null> {
  try {
    // Get the current user's access token
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return null;
    }
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/stripe/subscription`, {
      headers: {
        'Authorization': `Bearer ${session.access_token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch subscription');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error in getUserSubscription:', error);
    return null;
  }
}

// Get the current user's order history
export async function getUserOrders(): Promise<StripeOrder[]> {
  try {
    // Get the current user's access token
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return [];
    }
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/stripe/orders`, {
      headers: {
        'Authorization': `Bearer ${session.access_token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch orders');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error in getUserOrders:', error);
    return [];
  }
}

// Check if user has an active subscription
export async function hasActiveSubscription(): Promise<boolean> {
  try {
    const subscription = await getUserSubscription();
    
    if (!subscription) {
      return false;
    }
    
    // Check if subscription is active
    return ['active', 'trialing'].includes(subscription.subscription_status);
  } catch (error) {
    console.error('Error checking subscription status:', error);
    return false;
  }
}

// Format currency amount from cents to display format
export function formatCurrency(amount: number, currency: string = 'eur'): string {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 2
  });
  
  return formatter.format(amount / 100);
}

// Format date from Unix timestamp
export function formatDate(timestamp: number | null): string {
  if (!timestamp) return 'N/A';
  
  return new Date(timestamp * 1000).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}