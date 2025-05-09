/*
  # Add assistantId to users table

  1. Schema Updates
    - Add assistantId column to users table
  
  2. Migration Notes
    - This allows storing the OpenAI Assistant ID for each user
    - Helps persist assistant configuration across sessions
*/

-- Add assistantId column to users table if it doesn't exist
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

-- Update the handle_new_user function to handle the new column
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, preferences, assistant_id)
  VALUES (
    new.id, 
    new.email, 
    '{"name": "", "tone": "professional", "style": "gen-z", "length": "balanced", "traits": ["Tech-savvy", "Concise", "Emoji-friendly 😊"], "company": "", "contact": "", "context": "Tech Company", "position": "", "formality": "balanced", "favoriteGoodbye": "best"}'::jsonb,
    NULL
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;