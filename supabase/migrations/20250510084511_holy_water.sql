/*
  # Add Database Function for Atomic Decrement

  1. Schema Updates
    - Add function to atomically decrement daily_free_messages
  
  2. Migration Notes
    - This function ensures atomic decrement operations
    - Prevents race conditions when multiple requests are made
*/

-- Create a function to atomically decrement a user's daily message count
CREATE OR REPLACE FUNCTION decrement_daily_messages(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_messages INTEGER;
  user_paid BOOLEAN;
BEGIN
  -- First, get current values atomically
  SELECT daily_free_messages, paid INTO current_messages, user_paid
  FROM users
  WHERE id = user_id
  FOR UPDATE;
  
  -- If user is paid, don't decrement
  IF user_paid THEN
    RETURN TRUE;
  END IF;
  
  -- If user has no messages left, return false
  IF current_messages <= 0 THEN
    RETURN FALSE;
  END IF;
  
  -- Decrement the counter
  UPDATE users
  SET daily_free_messages = current_messages - 1
  WHERE id = user_id;
  
  RETURN TRUE;
END;
$$;