/*
  # Add Usage Tracking Fields to Users Table

  1. Schema Updates
    - Add daily_free_messages field to track daily message limit
    - Add last_reset_date field to track when messages were last reset
    - Add paid field to track payment status
  
  2. Migration Notes
    - Updates default values for new users
    - Adds fields needed for freemium model implementation
*/

-- Add fields to users table if they don't exist
DO $$
BEGIN
  -- Add daily_free_messages field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'users'
    AND column_name = 'daily_free_messages'
  ) THEN
    ALTER TABLE public.users
    ADD COLUMN daily_free_messages INTEGER DEFAULT 5;
  END IF;

  -- Add last_reset_date field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'users'
    AND column_name = 'last_reset_date'
  ) THEN
    ALTER TABLE public.users
    ADD COLUMN last_reset_date DATE DEFAULT CURRENT_DATE;
  END IF;

  -- Add paid field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'users'
    AND column_name = 'paid'
  ) THEN
    ALTER TABLE public.users
    ADD COLUMN paid BOOLEAN DEFAULT FALSE;
  END IF;
END
$$;

-- Update the handle_new_user function to include new fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (
    id, 
    email, 
    preferences, 
    assistant_id, 
    daily_free_messages, 
    last_reset_date, 
    paid
  )
  VALUES (
    new.id, 
    new.email, 
    '{"name": "", "tone": "professional", "style": "gen-z", "length": "balanced", "traits": ["Tech-savvy", "Concise", "Emoji-friendly 😊"], "company": "", "contact": "", "context": "Tech Company", "position": "", "formality": "balanced", "favoriteGoodbye": "best"}'::jsonb,
    'asst_F4jvQcayYieO8oghTPxC7Qel',
    5,
    CURRENT_DATE,
    FALSE
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;