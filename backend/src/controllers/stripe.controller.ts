import { Request, Response, NextFunction } from 'express';
import { AppError } from '../middleware/errorHandler.js';
import { stripe, STRIPE_PRODUCTS } from '../utils/stripe.js';
import { supabaseAdmin } from '../utils/supabase.js';

// Create a checkout session
export const createCheckoutSession = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { price_id, success_url, cancel_url, mode = 'subscription' } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError('User authentication required', 401);
    }

    if (!price_id) {
      throw new AppError('Price ID is required', 400);
    }

    if (!success_url || !cancel_url) {
      throw new AppError('Success and cancel URLs are required', 400);
    }

    // Get user from Supabase
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('email')
      .eq('id', userId)
      .single();

    if (userError || !userData) {
      throw new AppError('User not found', 404);
    }

    // Check if user already has a customer ID in the database
    const { data: customerData, error: customerError } = await supabaseAdmin
      .from('stripe_customers')
      .select('customer_id')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .maybeSingle();

    let customerId: string;

    if (customerData?.customer_id) {
      // Use existing customer
      customerId = customerData.customer_id;
    } else {
      // Create new customer in Stripe
      const customer = await stripe.customers.create({
        email: userData.email,
        metadata: {
          user_id: userId
        }
      });

      customerId = customer.id;

      // Save customer ID to database
      await supabaseAdmin
        .from('stripe_customers')
        .insert({
          user_id: userId,
          customer_id: customerId
        });
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: price_id,
          quantity: 1,
        },
      ],
      mode: mode as 'subscription' | 'payment',
      success_url: success_url,
      cancel_url: cancel_url,
      automatic_tax: { enabled: true },
      customer_update: {
        address: 'auto',
        name: 'auto',
      },
      tax_id_collection: {
        enabled: true,
      }
    });

    res.status(200).json({
      url: session.url,
      sessionId: session.id
    });
  } catch (error) {
    next(error);
  }
};

// Handle Stripe webhook events
export const handleWebhook = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const signature = req.headers['stripe-signature'] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!signature || !webhookSecret) {
      throw new AppError('Stripe webhook signature required', 400);
    }

    // Verify webhook signature
    let event;
    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        signature,
        webhookSecret
      );
    } catch (err) {
      console.error(`Webhook signature verification failed:`, err);
      throw new AppError('Invalid webhook signature', 400);
    }

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object);
        break;
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object);
        break;
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    next(error);
  }
};

// Get user subscription
export const getUserSubscription = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError('User authentication required', 401);
    }

    const { data, error } = await supabaseAdmin
      .from('stripe_user_subscriptions')
      .select('*')
      .maybeSingle();

    if (error) {
      throw new AppError('Failed to fetch subscription', 500, error);
    }

    res.status(200).json(data || null);
  } catch (error) {
    next(error);
  }
};

// Get user orders
export const getUserOrders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError('User authentication required', 401);
    }

    const { data, error } = await supabaseAdmin
      .from('stripe_user_orders')
      .select('*')
      .order('order_date', { ascending: false });

    if (error) {
      throw new AppError('Failed to fetch orders', 500, error);
    }

    res.status(200).json(data || []);
  } catch (error) {
    next(error);
  }
};

// Check if user has active subscription
export const hasActiveSubscription = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError('User authentication required', 401);
    }

    const subscription = await checkActiveSubscription(userId);
    
    res.status(200).json({ active: subscription });
  } catch (error) {
    next(error);
  }
};

// Helper function to check if a user has an active subscription
export async function checkActiveSubscription(userId: string): Promise<boolean> {
  try {
    // First get the customer ID
    const { data: customerData } = await supabaseAdmin
      .from('stripe_customers')
      .select('customer_id')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .maybeSingle();

    if (!customerData?.customer_id) {
      return false;
    }

    // Then check subscription status
    const { data: subscriptionData } = await supabaseAdmin
      .from('stripe_subscriptions')
      .select('status')
      .eq('customer_id', customerData.customer_id)
      .is('deleted_at', null)
      .maybeSingle();

    if (!subscriptionData) {
      return false;
    }

    // Check if subscription is active
    return ['active', 'trialing'].includes(subscriptionData.status);
  } catch (error) {
    console.error('Error checking subscription status:', error);
    return false;
  }
}

// Handler for checkout.session.completed event
async function handleCheckoutSessionCompleted(session: any) {
  // Extract important data from the session
  const { customer, subscription, payment_intent } = session;

  if (!customer) {
    console.error('No customer found in checkout session');
    return;
  }

  // Get customer from database
  const { data: customerData } = await supabaseAdmin
    .from('stripe_customers')
    .select('user_id')
    .eq('customer_id', customer)
    .is('deleted_at', null)
    .maybeSingle();

  if (!customerData?.user_id) {
    console.error('No user found for customer:', customer);
    return;
  }

  // If this was a subscription purchase
  if (subscription) {
    // Subscription details will be updated by the customer.subscription.created/updated event
    console.log('Subscription created/updated:', subscription);
  } 
  // If this was a one-time purchase
  else if (payment_intent) {
    // Get payment details
    const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent);
    
    // Create order record
    await supabaseAdmin.from('stripe_orders').insert({
      checkout_session_id: session.id,
      payment_intent_id: payment_intent,
      customer_id: customer,
      amount_subtotal: session.amount_subtotal,
      amount_total: session.amount_total,
      currency: session.currency,
      payment_status: session.payment_status,
      status: 'completed'
    });
    
    // Mark user as paid
    await supabaseAdmin
      .from('users')
      .update({ paid: true })
      .eq('id', customerData.user_id);
  }
}

// Handler for customer.subscription.created/updated events
async function handleSubscriptionUpdated(subscription: any) {
  // Get subscription details
  const customerId = subscription.customer;

  // Prepare subscription data
  const subscriptionData = {
    subscription_id: subscription.id,
    price_id: subscription.items.data[0]?.price.id,
    current_period_start: subscription.current_period_start,
    current_period_end: subscription.current_period_end,
    cancel_at_period_end: subscription.cancel_at_period_end,
    status: subscription.status
  };

  // Get payment method if available
  if (subscription.default_payment_method) {
    try {
      const paymentMethod = await stripe.paymentMethods.retrieve(
        subscription.default_payment_method
      );
      
      if (paymentMethod.type === 'card' && paymentMethod.card) {
        subscriptionData['payment_method_brand'] = paymentMethod.card.brand;
        subscriptionData['payment_method_last4'] = paymentMethod.card.last4;
      }
    } catch (error) {
      console.error('Error getting payment method:', error);
    }
  }

  // Update subscription in database
  const { data, error } = await supabaseAdmin
    .from('stripe_subscriptions')
    .upsert({
      customer_id: customerId,
      ...subscriptionData,
      deleted_at: null, // Ensure it's not marked as deleted
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'customer_id'
    });

  if (error) {
    console.error('Error updating subscription in database:', error);
    return;
  }

  // Get customer's user ID
  const { data: customerData } = await supabaseAdmin
    .from('stripe_customers')
    .select('user_id')
    .eq('customer_id', customerId)
    .is('deleted_at', null)
    .maybeSingle();

  if (!customerData?.user_id) {
    console.error('No user found for customer:', customerId);
    return;
  }

  // Update user paid status based on subscription status
  const isPaid = ['active', 'trialing'].includes(subscription.status);
  
  await supabaseAdmin
    .from('users')
    .update({ paid: isPaid })
    .eq('id', customerData.user_id);

  console.log(`Updated subscription for user ${customerData.user_id} (paid: ${isPaid})`);
}

// Handler for customer.subscription.deleted event
async function handleSubscriptionDeleted(subscription: any) {
  const customerId = subscription.customer;

  // Soft delete the subscription
  await supabaseAdmin
    .from('stripe_subscriptions')
    .update({
      deleted_at: new Date().toISOString(),
      status: 'canceled'
    })
    .eq('customer_id', customerId);

  // Get customer's user ID
  const { data: customerData } = await supabaseAdmin
    .from('stripe_customers')
    .select('user_id')
    .eq('customer_id', customerId)
    .is('deleted_at', null)
    .maybeSingle();

  if (customerData?.user_id) {
    // Update user paid status
    await supabaseAdmin
      .from('users')
      .update({ paid: false })
      .eq('id', customerData.user_id);

    console.log(`Subscription deleted for user ${customerData.user_id}`);
  }
}

// Handler for invoice.payment_succeeded event
async function handleInvoicePaymentSucceeded(invoice: any) {
  if (invoice.billing_reason !== 'subscription_create' && 
      invoice.billing_reason !== 'subscription_update') {
    return;
  }

  const customerId = invoice.customer;
  const subscriptionId = invoice.subscription;

  // Get customer's user ID
  const { data: customerData } = await supabaseAdmin
    .from('stripe_customers')
    .select('user_id')
    .eq('customer_id', customerId)
    .is('deleted_at', null)
    .maybeSingle();

  if (!customerData?.user_id) {
    console.error('No user found for customer:', customerId);
    return;
  }

  // Update user paid status
  await supabaseAdmin
    .from('users')
    .update({ paid: true })
    .eq('id', customerData.user_id);

  console.log(`Payment succeeded for subscription ${subscriptionId} (user: ${customerData.user_id})`);
}

// Handler for invoice.payment_failed event
async function handleInvoicePaymentFailed(invoice: any) {
  const customerId = invoice.customer;
  const subscriptionId = invoice.subscription;

  // Get customer's user ID
  const { data: customerData } = await supabaseAdmin
    .from('stripe_customers')
    .select('user_id')
    .eq('customer_id', customerId)
    .is('deleted_at', null)
    .maybeSingle();

  if (!customerData?.user_id) {
    console.error('No user found for customer:', customerId);
    return;
  }

  // If invoice is for a subscription and it's final attempt, mark user as unpaid
  if (subscriptionId && invoice.attempt_count >= invoice.max_attempts) {
    await supabaseAdmin
      .from('users')
      .update({ paid: false })
      .eq('id', customerData.user_id);

    console.log(`Payment failed (final attempt) for subscription ${subscriptionId} (user: ${customerData.user_id})`);
  }
}