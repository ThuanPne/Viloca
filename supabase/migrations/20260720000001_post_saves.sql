-- Post saves (bookmark) table
CREATE TABLE public.post_saves (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id    UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  user_id    UUID REFERENCES auth.users(id)  ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

ALTER TABLE public.post_saves ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own saves" ON public.post_saves
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
