/*
  # Update Users preferences schema to include favoriteGoodbye field

  1. Schema Updates
    - Update default preferences JSON structure to include favoriteGoodbye field
  
  2. Migration Notes
    - This updates the default preferences JSON structure for new users
    - Existing users will need to set this preference
*/

-- Update the default preferences JSON structure for new users
ALTER TABLE public.users 
ALTER COLUMN preferences 
SET DEFAULT '{"name": "", "tone": "professional", "style": "gen-z", "length": "balanced", "traits": ["Tech-savvy", "Concise", "Emoji-friendly 😊"], "company": "", "contact": "", "context": "Tech Company", "position": "", "formality": "balanced", "favoriteGoodbye": "best"}'::jsonb;

-- Update the handle_new_user function to include the new field
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, preferences)
  VALUES (new.id, new.email, '{"name": "", "tone": "professional", "style": "gen-z", "length": "balanced", "traits": ["Tech-savvy", "Concise", "Emoji-friendly 😊"], "company": "", "contact": "", "context": "Tech Company", "position": "", "formality": "balanced", "favoriteGoodbye": "best"}'::jsonb);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;