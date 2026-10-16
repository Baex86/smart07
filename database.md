-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.pengaturan_rt (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nama_rt character varying NOT NULL,
  alamat_perumahan text NOT NULL,
  wa_admin character varying NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  nama_perumahan text,
  jalan text,
  rt_rw text,
  kelurahan text,
  kecamatan text,
  kota text,
  provinsi_kodepos text,
  CONSTRAINT pengaturan_rt_pkey PRIMARY KEY (id)
);
CREATE TABLE public.users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  no_wa character varying NOT NULL UNIQUE,
  password_hash text NOT NULL,
  role character varying DEFAULT 'warga'::character varying CHECK (role::text = ANY (ARRAY['admin'::character varying, 'warga'::character varying, 'developer'::character varying]::text[])),
  session_token uuid UNIQUE,
  is_approved boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT users_pkey PRIMARY KEY (id)
);
CREATE TABLE public.buku_induk (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE,
  nama_lengkap character varying NOT NULL,
  nomor_rumah character varying NOT NULL,
  nik character varying UNIQUE,
  no_kk character varying,
  jenis_kelamin character varying CHECK (jenis_kelamin::text = ANY (ARRAY['Laki-laki'::character varying, 'Perempuan'::character varying]::text[])),
  tempat_lahir character varying,
  tanggal_lahir date,
  agama character varying,
  pekerjaan character varying,
  status_tinggal character varying CHECK (status_tinggal::text = ANY (ARRAY['Tetap'::character varying, 'Kontrak'::character varying, 'Kos'::character varying]::text[])),
  is_completed boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  kepala_keluarga_id uuid,
  status_hubungan character varying,
  no_wa character varying,
  status_perkawinan character varying DEFAULT 'Belum Kawin'::character varying,
  CONSTRAINT buku_induk_pkey PRIMARY KEY (id),
  CONSTRAINT buku_induk_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT buku_induk_kepala_keluarga_id_fkey FOREIGN KEY (kepala_keluarga_id) REFERENCES public.buku_induk(id)
);
CREATE TABLE public.keluarga (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  induk_id uuid NOT NULL,
  nama character varying NOT NULL,
  status_hubungan character varying NOT NULL,
  no_wa character varying,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT keluarga_pkey PRIMARY KEY (id),
  CONSTRAINT keluarga_induk_id_fkey FOREIGN KEY (induk_id) REFERENCES public.buku_induk(id)
);
CREATE TABLE public.master_iuran (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nama character varying NOT NULL,
  tipe character varying CHECK (tipe::text = ANY (ARRAY['rutin'::character varying, 'insidental'::character varying]::text[])),
  nominal_default numeric NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  tgl_terbit_default integer DEFAULT 1,
  tgl_jatuh_tempo_default integer DEFAULT 10,
  CONSTRAINT master_iuran_pkey PRIMARY KEY (id)
);
CREATE TABLE public.kategori_kas (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nama character varying NOT NULL,
  tipe character varying CHECK (tipe::text = ANY (ARRAY['masuk'::character varying, 'keluar'::character varying]::text[])),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT kategori_kas_pkey PRIMARY KEY (id)
);
CREATE TABLE public.arus_kas (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tanggal date NOT NULL DEFAULT CURRENT_DATE,
  keterangan text NOT NULL,
  tipe character varying CHECK (tipe::text = ANY (ARRAY['masuk'::character varying, 'keluar'::character varying]::text[])),
  nominal numeric NOT NULL,
  kategori_id uuid,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT arus_kas_pkey PRIMARY KEY (id),
  CONSTRAINT arus_kas_kategori_id_fkey FOREIGN KEY (kategori_id) REFERENCES public.kategori_kas(id)
);
CREATE TABLE public.iuran_kas (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  buku_induk_id uuid NOT NULL,
  master_iuran_id uuid NOT NULL,
  nama_iuran character varying NOT NULL,
  bulan integer CHECK (bulan >= 1 AND bulan <= 12),
  tahun integer,
  nominal numeric NOT NULL,
  status character varying DEFAULT 'belum_lunas'::character varying CHECK (status::text = ANY (ARRAY['belum_lunas'::character varying, 'menunggu_konfirmasi'::character varying, 'lunas'::character varying]::text[])),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  batas_waktu date,
  CONSTRAINT iuran_kas_pkey PRIMARY KEY (id),
  CONSTRAINT iuran_kas_buku_induk_id_fkey FOREIGN KEY (buku_induk_id) REFERENCES public.buku_induk(id),
  CONSTRAINT iuran_kas_master_iuran_id_fkey FOREIGN KEY (master_iuran_id) REFERENCES public.master_iuran(id)
);
CREATE TABLE public.surat_pengantar (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  buku_induk_id uuid NOT NULL,
  jenis_surat character varying NOT NULL,
  keperluan text NOT NULL,
  status character varying DEFAULT 'menunggu'::character varying CHECK (status::text = ANY (ARRAY['menunggu'::character varying, 'diproses'::character varying, 'selesai'::character varying, 'ditolak'::character varying]::text[])),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  keterangan_admin text,
  CONSTRAINT surat_pengantar_pkey PRIMARY KEY (id),
  CONSTRAINT surat_pengantar_buku_induk_id_fkey FOREIGN KEY (buku_induk_id) REFERENCES public.buku_induk(id)
);
CREATE TABLE public.aduan_warga (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  buku_induk_id uuid NOT NULL,
  kode_tiket character varying NOT NULL UNIQUE,
  judul character varying NOT NULL,
  deskripsi text NOT NULL,
  status character varying DEFAULT 'open'::character varying CHECK (status::text = ANY (ARRAY['open'::character varying, 'progress'::character varying, 'resolved'::character varying]::text[])),
  tanggapan_admin text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT aduan_warga_pkey PRIMARY KEY (id),
  CONSTRAINT aduan_warga_buku_induk_id_fkey FOREIGN KEY (buku_induk_id) REFERENCES public.buku_induk(id)
);
CREATE TABLE public.usulan_warga (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  buku_induk_id uuid NOT NULL,
  judul character varying NOT NULL,
  deskripsi text NOT NULL,
  dukungan integer DEFAULT 0,
  status character varying DEFAULT 'review'::character varying CHECK (status::text = ANY (ARRAY['review'::character varying, 'diterima'::character varying, 'ditolak'::character varying]::text[])),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  kode_tiket character varying UNIQUE,
  tanggapan_admin text,
  CONSTRAINT usulan_warga_pkey PRIMARY KEY (id),
  CONSTRAINT usulan_warga_buku_induk_id_fkey FOREIGN KEY (buku_induk_id) REFERENCES public.buku_induk(id)
);
CREATE TABLE public.inventaris_rt (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nama_barang character varying NOT NULL,
  tgl_beli date,
  harga numeric,
  kondisi character varying CHECK (kondisi::text = ANY (ARRAY['Baik'::character varying, 'Rusak'::character varying]::text[])),
  lokasi character varying,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT inventaris_rt_pkey PRIMARY KEY (id)
);
CREATE TABLE public.draft_perubahan_data (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  buku_induk_id uuid NOT NULL,
  data_baru jsonb NOT NULL,
  status character varying DEFAULT 'menunggu'::character varying CHECK (status::text = ANY (ARRAY['menunggu'::character varying::text, 'disetujui'::character varying::text, 'ditolak'::character varying::text])),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  data_lama jsonb,
  CONSTRAINT draft_perubahan_data_pkey PRIMARY KEY (id),
  CONSTRAINT draft_perubahan_data_buku_induk_id_fkey FOREIGN KEY (buku_induk_id) REFERENCES public.buku_induk(id)
);
CREATE TABLE public.pengumuman (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  pesan text NOT NULL,
  batas_waktu timestamp with time zone NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT pengumuman_pkey PRIMARY KEY (id)
);
CREATE TABLE public.master_surat (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  jenis_surat character varying NOT NULL UNIQUE,
  konten_html text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT master_surat_pkey PRIMARY KEY (id)
);
CREATE TABLE public.tiket_reset_password (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  buku_induk_id uuid,
  token uuid DEFAULT gen_random_uuid() UNIQUE,
  status text DEFAULT 'menunggu'::text CHECK (status = ANY (ARRAY['menunggu'::text, 'disetujui'::text, 'selesai'::text])),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  expired_at timestamp with time zone,
  CONSTRAINT tiket_reset_password_pkey PRIMARY KEY (id),
  CONSTRAINT tiket_reset_password_buku_induk_id_fkey FOREIGN KEY (buku_induk_id) REFERENCES public.buku_induk(id)
);
CREATE TABLE public.kas_badan_usaha (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tanggal date NOT NULL DEFAULT CURRENT_DATE,
  nama_usaha character varying NOT NULL,
  keterangan text NOT NULL,
  tipe character varying CHECK (tipe::text = ANY (ARRAY['masuk'::character varying::text, 'keluar'::character varying::text])),
  nominal numeric NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT kas_badan_usaha_pkey PRIMARY KEY (id)
);
CREATE TABLE public.log_perubahan_data (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  draft_id uuid,
  buku_induk_id uuid,
  aksi text NOT NULL,
  data_lama jsonb,
  data_baru jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT log_perubahan_data_pkey PRIMARY KEY (id)
);