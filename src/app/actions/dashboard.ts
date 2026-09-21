'use server';

import { cookies } from 'next/headers';
import { supabase } from '@/lib/supabaseClient';

export async function getDashboardData() {
  const cookieStore = await cookies();
  const uid = cookieStore.get('smart_system_uid')?.value;

  if (!uid) return { profil: null, tagihan: null, pengumuman: [], notifikasi: [] };

  const now = new Date().toISOString();

  // Tarik profil, tagihan tunggakan paling lama, pengumuman, dan riwayat aktivitas terbaru
  const [profilRes, iuranRes, pengumumanRes, suratNotifRes, iuranNotifRes] = await Promise.allSettled([
    supabase.from('buku_induk').select('nama_lengkap, nomor_rumah').eq('id', uid).single(),
    supabase.from('iuran_kas')
      .select('*')
      .eq('buku_induk_id', uid)
      .neq('status', 'lunas') 
      .order('tahun', { ascending: true }) 
      .order('bulan', { ascending: true })
      .limit(1)
      .single(),
    supabase.from('pengumuman').select('id, pesan, batas_waktu').gte('batas_waktu', now).order('batas_waktu', { ascending: true }),
    supabase.from('surat_pengantar').select('id, jenis_surat, status, created_at').eq('buku_induk_id', uid).in('status', ['selesai', 'ditolak']).order('created_at', { ascending: false }).limit(5),
    supabase.from('iuran_kas').select('id, nama_iuran, bulan, tahun, status, created_at').eq('buku_induk_id', uid).eq('status', 'lunas').order('created_at', { ascending: false }).limit(5)
  ]);

  let tagihan = null;
  if (iuranRes.status === 'fulfilled' && iuranRes.value.data) {
    tagihan = iuranRes.value.data;
  }

  let rawNotif: any[] = [];
  
  if (suratNotifRes.status === 'fulfilled' && suratNotifRes.value.data) {
    suratNotifRes.value.data.forEach((s: any) => {
      rawNotif.push({
        id: `surat-${s.id}`,
        tipe: 'surat',
        judul: `Pengajuan ${s.jenis_surat} Anda ${s.status === 'selesai' ? 'telah Selesai Dicetak' : 'Ditolak'}`,
        waktu: s.created_at,
        status: s.status
      });
    });
  }

  if (iuranNotifRes.status === 'fulfilled' && iuranNotifRes.value.data) {
    iuranNotifRes.value.data.forEach((i: any) => {
      rawNotif.push({
        id: `iuran-${i.id}`,
        tipe: 'iuran',
        judul: `Pembayaran ${i.nama_iuran} periode ${i.bulan}/${i.tahun} Berhasil Dikonfirmasi`,
        waktu: i.created_at,
        status: i.status
      });
    });
  }

  // Urutkan notifikasi gabungan dari yang paling baru
  rawNotif.sort((a, b) => new Date(b.waktu).getTime() - new Date(a.waktu).getTime());

  return {
    profil: profilRes.status === 'fulfilled' ? profilRes.value.data : null,
    tagihan: tagihan,
    pengumuman: pengumumanRes.status === 'fulfilled' && pengumumanRes.value.data ? pengumumanRes.value.data : [],
    notifikasi: rawNotif
  };
}