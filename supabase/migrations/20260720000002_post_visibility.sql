-- Post visibility column
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'public'
  CHECK (visibility IN ('public', 'friends', 'only_me'));

UPDATE public.posts SET visibility = 'public' WHERE visibility IS NULL;
