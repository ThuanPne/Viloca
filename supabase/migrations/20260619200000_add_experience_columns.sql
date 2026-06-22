-- Chạy script này trong Supabase SQL Editor
-- Thêm cột lưu thông tin experience trực tiếp vào trip_items
-- (không dùng FK join vì experiences là mock data ở client)

alter table public.trip_items
  add column if not exists experience_title    text,
  add column if not exists experience_location text,
  add column if not exists experience_image    text,
  add column if not exists experience_category text;
