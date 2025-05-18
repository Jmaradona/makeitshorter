import Stripe from 'stripe';
import { config } from './config.js';

const stripeSecretKey = config.stripe.secretKey;

if (!stripeSecretKey) {
  console.error('Missing Stripe secret key environment variable');
  if (config.nodeEnv === 'production') {
    console.error('Please configure this in your Render.com environment variables');
  }
}

export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2023-10-16',
});

// Stripe product configuration (same as frontend)
export const STRIPE_PRODUCTS = [
  {
    id: 'prod_SHiabmf6OYL4wX',
    name: 'Tier 1',
    priceId: 'price_1RN99NCcR8fg5De6TvPK79bE',
    description: 'lots of emails',
    price: '5.00 €',
    mode: 'subscription',
    features: [
      'Up to 100 emails per day',
      'Basic email templates',
      'Standard support'
    ]
  },
  {
    id: 'prod_SHiaOmkSyiheyG',
    name: 'Tier 2',
    priceId: 'price_1RN99nCcR8fg5De69dvPqzGt',
    description: 'lots and lots of emails',
    price: '9.99 €',
    mode: 'subscription',
    features: [
      'Up to 500 emails per day',
      'Advanced email templates',
      'Priority support',
      'Analytics dashboard'
    ]
  },
  {
    id: 'prod_SHibDjNjuRyRNu',
    name: 'Tier 3',
    priceId: 'price_1RN9AVCcR8fg5De6urHNPn40',
    description: 'feel free to share the password with you colleagues',
    price: '20.00 €',
    mode: 'subscription',
    features: [
      'Unlimited emails',
      'Team access (up to 5 users)',
      'Premium templates',
      'Advanced analytics',
      'Dedicated support',
      'Custom branding'
    ]
  }
];

// Helper function to get product by price ID
export function getProductByPriceId(priceId: string) {
  return STRIPE_PRODUCTS.find(product => product.priceId === priceId);
}

// Helper function to get product by ID
export function getProductById(id: string) {
  return STRIPE_PRODUCTS.find(product => product.id === id);
}