import { Router } from 'express';
import { 
  createCheckoutSession, 
  handleWebhook,
  getUserSubscription,
  getUserOrders,
  hasActiveSubscription
} from '../controllers/stripe.controller.js';
import { validateToken } from '../middleware/auth.middleware.js';

export const stripeRouter = Router();

// POST /api/stripe/create-checkout-session - Create a Stripe checkout session
stripeRouter.post('/create-checkout-session', validateToken, createCheckoutSession);

// POST /api/stripe/webhook - Handle Stripe webhooks
stripeRouter.post('/webhook', handleWebhook);

// GET /api/stripe/subscription - Get user subscription
stripeRouter.get('/subscription', validateToken, getUserSubscription);

// GET /api/stripe/orders - Get user orders
stripeRouter.get('/orders', validateToken, getUserOrders);

// GET /api/stripe/has-subscription - Check if user has active subscription
stripeRouter.get('/has-subscription', validateToken, hasActiveSubscription);