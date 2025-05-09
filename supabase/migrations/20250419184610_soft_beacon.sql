/*
  # Fix assistant IDs in database to prevent login freezes

  1. Schema Updates
    - Update all users to use the standard assistant ID
  
  2. Migration Notes
    - This fixes issues where users who logged in were getting stuck
    - Sets a default assistant ID for all users
*/

-- Update ALL users to have the same working assistant_id
UPDATE public.users 
SET assistant_id = 'asst_F4jvQcayYieO8oghTPxC7Qel';

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