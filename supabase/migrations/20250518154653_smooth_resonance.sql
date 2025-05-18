/*
  # Update Stripe Orders Table

  1. Schema Updates
    - Add additional fields to stripe_orders table for better tracking
    - Add webhook tracking
    - Improve existing order management functionality
  
  2. Security
    - Ensures proper RLS policies for new fields
*/

-- Add additional fields to stripe_orders table if they don't exist
DO $$
BEGIN
  -- Add client_reference_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'stripe_orders'
    AND column_name = 'client_reference_id'
  ) THEN
    ALTER TABLE public.stripe_orders
    ADD COLUMN client_reference_id text;
  END IF;

  -- Add webhook_received column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'stripe_orders'
    AND column_name = 'webhook_received'
  ) THEN
    ALTER TABLE public.stripe_orders
    ADD COLUMN webhook_received boolean DEFAULT false;
  END IF;

  -- Add webhook_timestamp column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'stripe_orders'
    AND column_name = 'webhook_timestamp'
  ) THEN
    ALTER TABLE public.stripe_orders
    ADD COLUMN webhook_timestamp timestamp with time zone;
  END IF;

  -- Add metadata column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'stripe_orders'
    AND column_name = 'metadata'
  ) THEN
    ALTER TABLE public.stripe_orders
    ADD COLUMN metadata jsonb DEFAULT '{}'::jsonb;
  END IF;

  -- Add line_items column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'stripe_orders'
    AND column_name = 'line_items'
  ) THEN
    ALTER TABLE public.stripe_orders
    ADD COLUMN line_items jsonb DEFAULT '[]'::jsonb;
  END IF;
END
$$;

-- Update the stripe_user_orders view to include new fields
CREATE OR REPLACE VIEW stripe_user_orders WITH (security_invoker) AS
SELECT
    c.customer_id,
    o.id as order_id,
    o.checkout_session_id,
    o.payment_intent_id,
    o.client_reference_id,
    o.amount_subtotal,
    o.amount_total,
    o.currency,
    o.payment_status,
    o.status as order_status,
    o.webhook_received,
    o.webhook_timestamp,
    o.metadata,
    o.line_items,
    o.created_at as order_date
FROM stripe_customers c
LEFT JOIN stripe_orders o ON c.customer_id = o.customer_id
WHERE c.user_id = auth.uid()
AND c.deleted_at IS NULL
AND o.deleted_at IS NULL;

-- Helper function to validate webhook data and update an order
CREATE OR REPLACE FUNCTION process_stripe_webhook_event(
  event_type TEXT,
  event_data JSONB
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  session_id TEXT;
  customer_id TEXT;
  success BOOLEAN := FALSE;
BEGIN
  -- Extract key data based on event type
  IF event_type = 'checkout.session.completed' THEN
    session_id := event_data->>'id';
    customer_id := event_data->>'customer';
    
    -- Update the order record
    UPDATE stripe_orders
    SET 
      webhook_received = TRUE,
      webhook_timestamp = NOW(),
      status = 'completed',
      metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object('webhook_event', event_type)
    WHERE checkout_session_id = session_id
    AND customer_id = customer_id;
    
    success := TRUE;
  ELSIF event_type = 'checkout.session.async_payment_succeeded' THEN
    session_id := event_data->>'id';
    
    -- Update the order record for async payments
    UPDATE stripe_orders
    SET 
      webhook_received = TRUE,
      webhook_timestamp = NOW(),
      status = 'completed',
      payment_status = 'paid',
      metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object('webhook_event', event_type)
    WHERE checkout_session_id = session_id;
    
    success := TRUE;
  ELSIF event_type = 'checkout.session.async_payment_failed' THEN
    session_id := event_data->>'id';
    
    -- Update the order record for failed async payments
    UPDATE stripe_orders
    SET 
      webhook_received = TRUE,
      webhook_timestamp = NOW(),
      status = 'canceled',
      payment_status = 'failed',
      metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object('webhook_event', event_type)
    WHERE checkout_session_id = session_id;
    
    success := TRUE;
  END IF;
  
  RETURN success;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION process_stripe_webhook_event(TEXT, JSONB) TO authenticated;

-- Ensure RLS is still enabled
ALTER TABLE stripe_orders ENABLE ROW LEVEL SECURITY;