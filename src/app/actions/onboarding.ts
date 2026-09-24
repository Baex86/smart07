'use server';

import { cookies } from 'next/headers';
import { supabase } from '@/lib/supabaseClient';

export async function getOnboardingContext() {
  const cookieStore = await cookies();
  const uid = cookieStore.get('smart_system_uid')?.value;
  
  if (!uid) return null;

  const { data } = await supabase.from('buku_induk').select('kepala_keluarga_id, no_kk, status_tinggal').eq('id', uid).single();
  
  if (data?.kepala_keluarga_id) {
    // Kalau dia Anggota, tarik data Bapaknya
    const { data: parentData } = await supabase.from('buku_induk').select('no_kk, status_tinggal').eq('id', data.kepala_keluarga_id).single();
    return { isAnggota: true, parentData };
  }
  
  return { isAnggota: false, parentData: null };
}

export async function submitOnboarding(formData: any) {
  const cookieStore = await cookies();
  const uid = cookieStore.get('smart_system_uid')?.value;

  if (!uid) return { success: false, error: 'Sesi tidak valid. Harap login kembali.' };

  const { data: biData, error: biError } = await supabase
    .from('buku_induk')
    .select('user_id, kepala_keluarga_id')
    .eq('id', uid)
    .single();

  if (biError || !biData?.user_id) return { success: false, error: 'Data referensi tidak ditemukan.' };

  let finalNoKk = formData.no_kk;
  let finalStatusTinggal = formData.status_tinggal;

  // PROTEKSI SERVER: Paksakan No KK dan Status Tinggal mengikuti Kepala Keluarga
  if (biData.kepala_keluarga_id) {
    const { data: parentData } = await supabase
      .from('buku_induk')
      .select('no_kk, status_tinggal')
      .eq('id', biData.kepala_keluarga_id)
      .single();
      
    if (parentData) {
      finalNoKk = parentData.no_kk;
      finalStatusTinggal = parentData.status_tinggal;
    }
  }

  const { error } = await supabase.rpc('complete_onboarding', {
    p_user_id: biData.user_id,
    p_nik: formData.nik,
    p_no_kk: finalNoKk,
    p_jenis_kelamin: formData.jenis_kelamin,
    p_tempat_lahir: formData.tempat_lahir,
    p_tanggal_lahir: formData.tanggal_lahir,
    p_agama: formData.agama,
    p_pekerjaan: formData.pekerjaan,
    p_status_tinggal: finalStatusTinggal,
    p_keluarga: formData.keluarga,
  });

  if (error) return { success: false, error: error.message };
  await supabase.from('buku_induk').update({ status_perkawinan: formData.status_perkawinan }).eq('id', uid);

  return { success: true };
}