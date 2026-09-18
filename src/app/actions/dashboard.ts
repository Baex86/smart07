'use server';

import { cookies } from 'next/headers';
import { supabase } from '@/lib/supabaseClient';

export async function getDashboardData() {
  const cookieStore = await cookies();
  const uid = cookieStore.get('smart_system_uid')?.value;

  if (!uid) return { profil: null, tagihan: null, pengumuman: [] };

  const now = new Date().toISOString();

  // Tarik 3 data krusial sekaligus dengan aman lewat jalur Server
  const [profilRes, iuranRes, pengumumanRes] = await Promise.allSettled([
    supabase.from('buku_induk').select('nama_lengkap, nomor_rumah').eq('id', uid).single(),
    supabase.from('iuran_kas').select('*').eq('buku_induk_id', uid).order('tahun', { ascending: false }).order('bulan', { ascending: false }).limit(1).single(),
    supabase.from('pengumuman').select('id, pesan, batas_waktu').gte('batas_waktu', now).order('batas_waktu', { ascending: true })
  ]);

  return {
    profil: profilRes.status === 'fulfilled' ? profilRes.value.data : null,
    tagihan: iuranRes.status === 'fulfilled' ? iuranRes.value.data : null,
    pengumuman: pengumumanRes.status === 'fulfilled' && pengumumanRes.value.data ? pengumumanRes.value.data : []
  };
}