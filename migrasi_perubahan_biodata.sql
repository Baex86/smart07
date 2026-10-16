-- ============================================================
-- Migrasi: Perbaikan alur perubahan biodata + audit log
-- Jalankan di Supabase SQL Editor
-- ============================================================

-- 1) Tambah kolom data_lama pada draft_perubahan_data (jika belum ada)
ALTER TABLE public.draft_perubahan_data
  ADD COLUMN IF NOT EXISTS data_lama jsonb;

-- 2) Tabel log audit perubahan data (idempoten)
CREATE TABLE IF NOT EXISTS public.log_perubahan_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  draft_id uuid,
  buku_induk_id uuid,
  aksi text NOT NULL,
  data_lama jsonb,
  data_baru jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Hapus policy lama (jika ada dari percobaan sebelumnya) supaya bisa di-run ulang tanpa error
DROP POLICY IF EXISTS "log_select" ON public.log_perubahan_data;
DROP POLICY IF EXISTS "log_insert" ON public.log_perubahan_data;

-- Nonaktifkan RLS agar konsisten dengan tabel lain (semua unrestricted)
ALTER TABLE public.log_perubahan_data DISABLE ROW LEVEL SECURITY;