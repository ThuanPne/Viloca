-- Fix Storage RLS: INSERT policy phải kiểm tra path ownership
-- Lỗi cũ: bất kỳ user đã đăng nhập nào cũng upload được vào folder của user khác
-- Fix: storage.foldername(name)[1] = segment đầu của path = user.id

DROP POLICY IF EXISTS "post_images_insert_auth" ON storage.objects;

CREATE POLICY "post_images_insert_auth"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'post-images'
    AND auth.uid() IS NOT NULL
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
