-- Comment replies: add parent_id for 1-level nesting
ALTER TABLE public.post_comments
  ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.post_comments(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS post_comments_parent_id_idx ON public.post_comments(parent_id);

-- Comment likes table
CREATE TABLE IF NOT EXISTS public.comment_likes (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id UUID REFERENCES public.post_comments(id) ON DELETE CASCADE NOT NULL,
  user_id    UUID REFERENCES auth.users(id)            ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(comment_id, user_id)
);

ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own comment likes" ON public.comment_likes
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
