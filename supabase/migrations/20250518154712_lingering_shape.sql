/*
  # Add Order Status Management Functions

  1. Schema Updates
    - Create functions to update order status
    - Add ability to track order fulfillment
  
  2. Security
    - Ensure proper security for update functions
*/

-- Create a function to mark an order as fulfilled
CREATE OR REPLACE FUNCTION mark_order_fulfilled(
  order_id BIGINT,
  fulfilled_metadata JSONB DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_id UUID;
  can_update BOOLEAN := FALSE;
  order_customer_id TEXT;
BEGIN
  -- Get the current user's ID
  SELECT auth.uid() INTO user_id;
  
  -- Check if this order belongs to the current user
  SELECT c.customer_id INTO order_customer_id
  FROM stripe_orders o
  JOIN stripe_customers c ON o.customer_id = c.customer_id
  WHERE o.id = order_id
  AND c.user_id = user_id
  AND o.deleted_at IS NULL
  AND c.deleted_at IS NULL;
  
  IF order_customer_id IS NOT NULL THEN
    can_update := TRUE;
  END IF;
  
  -- Only proceed if user is authorized
  IF can_update THEN
    -- Update the order
    UPDATE stripe_orders
    SET 
      status = 'completed',
      updated_at = NOW(),
      metadata = COALESCE(metadata, '{}'::jsonb) || 
                COALESCE(fulfilled_metadata, '{}'::jsonb) ||
                jsonb_build_object('fulfilled_by', user_id, 'fulfilled_at', NOW())
    WHERE id = order_id;
    
    RETURN TRUE;
  ELSE
    RETURN FALSE;
  END IF;
END;
$$;

-- Create a function to cancel an order
CREATE OR REPLACE FUNCTION cancel_order(
  order_id BIGINT,
  cancel_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_id UUID;
  can_update BOOLEAN := FALSE;
  order_customer_id TEXT;
BEGIN
  -- Get the current user's ID
  SELECT auth.uid() INTO user_id;
  
  -- Check if this order belongs to the current user
  SELECT c.customer_id INTO order_customer_id
  FROM stripe_orders o
  JOIN stripe_customers c ON o.customer_id = c.customer_id
  WHERE o.id = order_id
  AND c.user_id = user_id
  AND o.deleted_at IS NULL
  AND c.deleted_at IS NULL;
  
  IF order_customer_id IS NOT NULL THEN
    can_update := TRUE;
  END IF;
  
  -- Only proceed if user is authorized
  IF can_update THEN
    -- Update the order
    UPDATE stripe_orders
    SET 
      status = 'canceled',
      updated_at = NOW(),
      metadata = COALESCE(metadata, '{}'::jsonb) || 
                jsonb_build_object(
                  'canceled_by', user_id,
                  'canceled_at', NOW(),
                  'cancel_reason', cancel_reason
                )
    WHERE id = order_id;
    
    RETURN TRUE;
  ELSE
    RETURN FALSE;
  END IF;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION mark_order_fulfilled(BIGINT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION cancel_order(BIGINT, TEXT) TO authenticated;