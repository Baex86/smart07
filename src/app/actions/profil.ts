'use server';

import { cookies } from 'next/headers';
import { supabase } from '@/lib/supabaseClient';

export async function getProfilWarga() {
  const cookieStore = await cookies();
  const uid = cookieStore.get('smart_system_uid')?.value;

  if (!uid) {
    throw new Error('Sesi tidak valid. Harap login kembali.');
  }

  const { data: profil, error: errProfil } = await supabase
    .from('buku_induk')
    .select('*')
    .eq('id', uid)
    .single();

  if (errProfil || !profil) throw new Error('Gagal menarik data profil.');

  const familyReferenceId = profil.kepala_keluarga_id ? profil.kepala_keluarga_id : profil.id;

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

export async function ajukanPerubahanData(formData: any, password: string) {
  const cookieStore = await cookies();
  const uid = cookieStore.get('smart_system_uid')?.value;

  if (!uid) throw new Error('Sesi tidak valid.');

  const { data: bukuInduk } = await supabase.from('buku_induk').select('user_id').eq('id', uid).single();
  
  if (!bukuInduk?.user_id) throw new Error('Akses ditolak. Akun belum terikat.');

  const { data: isPasswordValid, error: rpcError } = await supabase.rpc('verify_user_password', {
    p_user_id: bukuInduk.user_id,
    p_password: password
  });

  if (rpcError || !isPasswordValid) {
    throw new Error('Kata sandi salah. Verifikasi gagal.');
  }

  const { error } = await supabase.from('draft_perubahan_data').insert([{
    buku_induk_id: uid,
    data_baru: formData,
    status: 'menunggu'
  }]);

  if (error) throw new Error(error.message);

  return { success: true };
}

export async function tambahKeluarga(data: any) {
  const cookieStore = await cookies();
  const uid = cookieStore.get('smart_system_uid')?.value;

  if (!uid) throw new Error('Sesi tidak valid.');

  const { data: profil } = await supabase.from('buku_induk').select('nomor_rumah').eq('id', uid).single();

  const { error } = await supabase.from('buku_induk').insert([{
    kepala_keluarga_id: uid,
    nama_lengkap: data.nama_lengkap,
    status_hubungan: data.status_hubungan,
    nik: data.nik || null,
    no_wa: data.no_wa || null,
    nomor_rumah: profil?.nomor_rumah || '-',
    is_completed: false // FIX: Harus false agar Middleware SmaRT O7 memaksa anggota masuk ke halaman Onboarding
  }]);

  if (error) throw new Error(error.message);
  return { success: true };
}

export async function editKeluarga(data: any) {
  const { error } = await supabase.from('buku_induk').update({
    nama_lengkap: data.nama_lengkap,
    status_hubungan: data.status_hubungan,
    nik: data.nik || null,
    no_wa: data.no_wa || null
  }).eq('id', data.id);

  if (error) throw new Error(error.message);
  return { success: true };
}

export async function hapusKeluarga(id: string) {
  const { error } = await supabase.from('buku_induk').delete().eq('id', id);
  if (error) throw new Error(error.message);
  return { success: true };
}