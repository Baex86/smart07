'use server';

import { cookies } from 'next/headers';
import { supabase } from '../../lib/supabaseClient';

export async function getProfilWarga() {
  const cookieStore = await cookies();
  const uid = cookieStore.get('smart_system_uid')?.value;

  if (!uid) {
    throw new Error('Sesi tidak valid. Harap login kembali.');
  }

  // 1. Ambil data Kepala Keluarga (diri sendiri)
  const { data: kk, error: errKk } = await supabase
    .from('buku_induk')
    .select('*')
    .eq('id', uid)
    .single();

  if (errKk) throw new Error('Gagal menarik data utama: ' + errKk.message);

  // 2. Ambil data Anggota Keluarga yang menginduk ke KK ini
  const { data: anggota, error: errAnggota } = await supabase
    .from('buku_induk')
    .select('*')
    .eq('kepala_keluarga_id', uid);

  if (errAnggota) throw new Error('Gagal menarik data keluarga: ' + errAnggota.message);

  return { kk, anggota };
}