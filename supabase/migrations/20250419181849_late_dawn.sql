/*
  # Fix default assistant_id to use valid OpenAI format

  1. Schema Updates
    - Update any existing users with invalid assistant_id format
    - Modify the function for new users to use valid assistant_id
  
  2. Migration Notes
    - Changes default_assistant_id from 'default-assistant-id-fallback' to valid OpenAI format
    - This ensures API calls don't fail with 400 errors
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