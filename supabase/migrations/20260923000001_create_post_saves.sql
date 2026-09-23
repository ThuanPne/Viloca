-- post_saves: bookmarked posts per user
CREATE TABLE IF NOT EXISTS public.post_saves (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id    UUID        NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id    UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (post_id, user_id)
);

ALTER TABLE public.post_saves ENABLE ROW LEVEL SECURITY;

-- Chỉ xem saves của chính mình
CREATE POLICY "saves_select_own"
  ON public.post_saves FOR SELECT
  USING (auth.uid() = user_id);

-- Authenticated user có thể lưu bài
CREATE POLICY "saves_insert_auth"
  ON public.post_saves FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Chỉ xóa save của chính mình
CREATE POLICY "saves_delete_own"
  ON public.post_saves FOR DELETE
  USING (auth.uid() = user_id);
