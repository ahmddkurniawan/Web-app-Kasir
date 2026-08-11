-- Jalankan script ini di SQL Editor Supabase untuk memperbaiki error
-- "Could not find the 'password' column of 'users'"

-- 1. Tambahkan kolom password ke tabel users jika belum ada
ALTER TABLE users ADD COLUMN IF NOT EXISTS password text;

-- 2. Pastikan RLS untuk tabel users mengizinkan semua operasi (insert, update, delete) untuk anon 
-- agar owner bisa menambahkan user dengan lancar dari frontend
DROP POLICY IF EXISTS "Anon all users" ON users;

CREATE POLICY "Anon all users" ON users
FOR ALL TO anon
USING (true)
WITH CHECK (true);
