/*
  # Fix invalid assistant ID format and update database

  1. Schema Updates
    - Update users with invalid assistant_id format
    - Fix the handle_new_user function
  
  2. Migration Notes
    - This updates all records with invalid assistant IDs to use a valid default
    - Ensures new users will get a valid assistant ID format
*/

-- Update any existing users with invalid assistant_id format
UPDATE public.users 
SET assistant_id = 'asst_F4jvQcayYieO8oghTPxC7Qel'
WHERE assistant_id IS NULL 
   OR assistant_id = 'default-assistant-id-fallback'
   OR NOT assistant_id LIKE 'asst_%';

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