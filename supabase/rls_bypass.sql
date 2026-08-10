-- Karena kita menggunakan Anon Key langsung dari Frontend di Netlify,
-- kita perlu membuka akses (bypass RLS) ke tabel-tabel utama agar aplikasi 
-- bisa insert/update/delete data dengan bebas layaknya Backend Admin.
--
-- JALANKAN SCRIPT INI DI SQL EDITOR SUPABASE.

-- 1. Tabel Transactions (Izinkan semua operasi untuk ANON)
DROP POLICY IF EXISTS "Public read transactions" ON transactions;
DROP POLICY IF EXISTS "Anon insert transactions" ON transactions;
DROP POLICY IF EXISTS "Anon all transactions" ON transactions;

CREATE POLICY "Anon all transactions" ON transactions
FOR ALL TO anon
USING (true)
WITH CHECK (true);

-- 2. Tabel Products (Izinkan semua operasi untuk ANON)
DROP POLICY IF EXISTS "Public read products" ON products;
DROP POLICY IF EXISTS "Anon all products" ON products;

CREATE POLICY "Anon all products" ON products
FOR ALL TO anon
USING (true)
WITH CHECK (true);

-- 3. Tabel Devices (Izinkan semua operasi untuk ANON)
DROP POLICY IF EXISTS "Public read devices" ON devices;
DROP POLICY IF EXISTS "Anon all devices" ON devices;

CREATE POLICY "Anon all devices" ON devices
FOR ALL TO anon
USING (true)
WITH CHECK (true);

-- 4. Tabel Inventory Movements (Izinkan semua operasi untuk ANON)
DROP POLICY IF EXISTS "Public read movements" ON inventory_movements;
DROP POLICY IF EXISTS "Anon all movements" ON inventory_movements;

CREATE POLICY "Anon all movements" ON inventory_movements
FOR ALL TO anon
USING (true)
WITH CHECK (true);
