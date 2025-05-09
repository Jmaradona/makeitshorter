/*
  # Update Users Table to Better Support Assistant ID

  1. Schema Updates
    - Ensure the assistant_id column exists
    - Rename to match TypeScript interface field names
  
  2. Migration Notes
    - Updates existing code to handle the proper assistant persistence
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