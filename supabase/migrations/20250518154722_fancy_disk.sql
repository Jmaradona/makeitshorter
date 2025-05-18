/*
  # Add Subscription Webhook Tracking

  1. Schema Updates
    - Add webhook tracking fields to stripe_subscriptions table
    - Update views to include new fields
  
  2. Security
    - Maintain existing security model
*/

-- Add webhook tracking fields to stripe_subscriptions
DO $$
BEGIN
  -- Add webhook_received field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'stripe_subscriptions'
    AND column_name = 'webhook_received'
  ) THEN
    ALTER TABLE public.stripe_subscriptions
    ADD COLUMN webhook_received BOOLEAN DEFAULT FALSE;
  END IF;

  -- Add webhook_timestamp field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'stripe_subscriptions'
    AND column_name = 'webhook_timestamp'
  ) THEN
    ALTER TABLE public.stripe_subscriptions
    ADD COLUMN webhook_timestamp TIMESTAMP WITH TIME ZONE;
  END IF;

  -- Add metadata field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'stripe_subscriptions'
    AND column_name = 'metadata'
  ) THEN
    ALTER TABLE public.stripe_subscriptions
    ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
  END IF;

  -- Add latest_invoice_id field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'stripe_subscriptions'
    AND column_name = 'latest_invoice_id'
  ) THEN
    ALTER TABLE public.stripe_subscriptions
    ADD COLUMN latest_invoice_id TEXT;
  END IF;
END
$$;

-- Update the stripe_user_subscriptions view to include new fields
CREATE OR REPLACE VIEW stripe_user_subscriptions WITH (security_invoker = true) AS
SELECT
    c.customer_id,
    s.subscription_id,
    s.status as subscription_status,
    s.price_id,
    s.current_period_start,
    s.current_period_end,
    s.cancel_at_period_end,
    s.payment_method_brand,
    s.payment_method_last4,
    s.webhook_received,
    s.webhook_timestamp,
    s.metadata,
    s.latest_invoice_id
FROM stripe_customers c
LEFT JOIN stripe_subscriptions s ON c.customer_id = s.customer_id
WHERE c.user_id = auth.uid()
AND c.deleted_at IS NULL
AND s.deleted_at IS NULL;