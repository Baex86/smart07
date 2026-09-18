'use server';

import { cookies } from 'next/headers';
import { supabase } from '@/lib/supabaseClient';

export async function getProfilWarga() {
  const cookieStore = await cookies();
  const uid = cookieStore.get('smart_system_uid')?.value;

  if (!uid) {
    throw new Error('Sesi tidak valid. Harap login kembali.');
  }

  // 1. Tarik profil yang sedang login
  const { data: profil, error: errProfil } = await supabase
    .from('buku_induk')
    .select('*')
    .eq('id', uid)
    .single();

  if (errProfil || !profil) throw new Error('Gagal menarik data profil.');

  // 2. Logic rujukan hierarki keluarga
  const familyReferenceId = profil.kepala_keluarga_id ? profil.kepala_keluarga_id : profil.id;

  // 3. Tarik semua entitas keluarga yang terikat dengan ID tersebut
  const { data: familyData, error: errFamily } = await supabase
    .from('buku_induk')
    .select('*')
    .or(`id.eq.${familyReferenceId},kepala_keluarga_id.eq.${familyReferenceId}`)
    .order('created_at', { ascending: true });

  let keluarga: any[] = [];
  if (!errFamily && familyData) {
    keluarga = familyData.filter((member: any) => member.id !== profil.id);
  }

  return { profil, keluarga };
}

export async function ajukanPerubahanData(formData: any) {
  const cookieStore = await cookies();
  const uid = cookieStore.get('smart_system_uid')?.value;

  if (!uid) throw new Error('Sesi tidak valid.');

  const { error } = await supabase.from('draft_perubahan_data').insert([{
    buku_induk_id: uid,
    data_baru: formData,
    status: 'menunggu'
  }]);

  if (error) throw new Error(error.message);
  return { success: true };
}

// --- FUNGSI MANAJEMEN KELUARGA DIRECT ---

export async function tambahKeluarga(data: any) {
  const cookieStore = await cookies();
  const uid = cookieStore.get('smart_system_uid')?.value;
  if (!uid) throw new Error('Sesi tidak valid.');

  const { data: profil } = await supabase.from('buku_induk').select('nomor_rumah').eq('id', uid).single();

  const { error } = await supabase.from('buku_induk').insert([{
    kepala_keluarga_id: uid, // Ikat ke ID parent
    nama_lengkap: data.nama_lengkap,
    status_hubungan: data.status_hubungan,
    nik: data.nik || null,
    nomor_rumah: profil?.nomor_rumah || '-',
    is_completed: true
  }]);

  if (error) throw new Error(error.message);
  return { success: true };
}

export async function editKeluarga(data: any) {
  const { error } = await supabase.from('buku_induk').update({
    nama_lengkap: data.nama_lengkap,
    status_hubungan: data.status_hubungan,
    nik: data.nik || null
  }).eq('id', data.id);

  if (error) throw new Error(error.message);
  return { success: true };
}

export async function hapusKeluarga(id: string) {
  // Hanya bisa hapus jika dia belum punya akun login (user_id null) 
  // atau kita hapus paksa relasinya
  const { error } = await supabase.from('buku_induk').delete().eq('id', id);
  if (error) throw new Error(error.message);
  return { success: true };
}