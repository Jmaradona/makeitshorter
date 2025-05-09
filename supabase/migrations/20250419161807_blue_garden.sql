/*
  # Migration to ensure assistant_id column exists and update default preferences

  1. Schema Updates
    - Ensure assistant_id column exists in users table
    - Update default preferences JSON structure
  
  2. Migration Notes
    - This adds support for preventing assistant setup from showing
*/

-- First check if the assistant_id column exists, if not - create it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'users'
    AND column_name = 'assistant_id'
  ) THEN
    ALTER TABLE public.users
    ADD COLUMN assistant_id text;
  END IF;
END
$$;

-- Update the default preferences JSON structure for new users
ALTER TABLE public.users 
ALTER COLUMN preferences 
SET DEFAULT '{"name": "", "tone": "professional", "style": "gen-z", "length": "balanced", "traits": ["Tech-savvy", "Concise", "Emoji-friendly 😊"], "company": "", "contact": "", "context": "Tech Company", "position": "", "formality": "balanced", "favoriteGoodbye": "best"}'::jsonb;

-- Update the handle_new_user function to include a default assistant_id 
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, preferences, assistant_id)
  VALUES (
    new.id, 
    new.email, 
    '{"name": "", "tone": "professional", "style": "gen-z", "length": "balanced", "traits": ["Tech-savvy", "Concise", "Emoji-friendly 😊"], "company": "", "contact": "", "context": "Tech Company", "position": "", "formality": "balanced", "favoriteGoodbye": "best"}'::jsonb,
    'default-assistant-id-fallback'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update any existing users with a default assistant_id if they don't have one
UPDATE public.users 
SET assistant_id = 'default-assistant-id-fallback'
WHERE assistant_id IS NULL;