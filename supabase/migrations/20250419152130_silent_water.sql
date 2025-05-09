/*
  # Update Users Table Schema for Signature Information

  1. Schema Updates
    - Add signature information fields to users preferences
  
  2. Migration Notes
    - This updates the default preferences JSON structure
    - Existing users will maintain their current preferences
*/

-- Update the default preferences JSON structure for new users
ALTER TABLE public.users 
ALTER COLUMN preferences 
SET DEFAULT '{"name": "", "tone": "professional", "style": "gen-z", "length": "balanced", "traits": ["Tech-savvy", "Concise", "Emoji-friendly 😊"], "company": "", "contact": "", "context": "Tech Company", "position": "", "formality": "balanced"}'::jsonb;

-- Update the handle_new_user function to include the new fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, preferences)
  VALUES (new.id, new.email, '{"name": "", "tone": "professional", "style": "gen-z", "length": "balanced", "traits": ["Tech-savvy", "Concise", "Emoji-friendly 😊"], "company": "", "contact": "", "context": "Tech Company", "position": "", "formality": "balanced"}'::jsonb);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;