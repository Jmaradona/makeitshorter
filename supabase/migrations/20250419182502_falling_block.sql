/*
  # Fix Invalid Assistant IDs

  1. Database Updates
    - Update all users with invalid assistant_id format to use a valid OpenAI assistant ID
    - Update the handle_new_user function to use proper assistant_id format
  
  2. Migration Notes
    - This fixes the issue with 'default-assistant-id-fallback' causing application crashes
    - Ensures all new and existing users have a valid assistant_id that starts with 'asst_'
*/

-- Update any existing users with invalid assistant_id format
UPDATE public.users 
SET assistant_id = 'asst_F4jvQcayYieO8oghTPxC7Qel'
WHERE assistant_id = 'default-assistant-id-fallback' OR assistant_id IS NULL;

-- Update the handle_new_user function to use valid assistant_id
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, preferences, assistant_id)
  VALUES (
    new.id, 
    new.email, 
    '{"name": "", "tone": "professional", "style": "gen-z", "length": "balanced", "traits": ["Tech-savvy", "Concise", "Emoji-friendly 😊"], "company": "", "contact": "", "context": "Tech Company", "position": "", "formality": "balanced", "favoriteGoodbye": "best"}'::jsonb,
    'asst_F4jvQcayYieO8oghTPxC7Qel'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;