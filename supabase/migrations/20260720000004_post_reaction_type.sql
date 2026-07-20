-- Extend post_likes with reaction_type (backward compatible — existing rows default to 'like')
ALTER TABLE public.post_likes
  ADD COLUMN IF NOT EXISTS reaction_type TEXT DEFAULT 'like'
  CHECK (reaction_type IN ('like', 'love', 'haha', 'wow', 'sad', 'angry'));

UPDATE public.post_likes SET reaction_type = 'like' WHERE reaction_type IS NULL;
