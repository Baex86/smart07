'use server';

import { cookies } from 'next/headers';
import { supabase } from '../../lib/supabaseClient';

export async function submitOnboarding(formData: any) {
  const cookieStore = await cookies();
  const uid = cookieStore.get('smart_system_uid')?.value;

  if (!uid) {
    return { success: false, error: 'Sesi tidak valid. Harap login kembali.' };
  }

  const { data, error } = await supabase.rpc('complete_onboarding', {
    p_user_id: uid,
    p_nik: formData.nik,
    p_no_kk: formData.noKk,
    p_jenis_kelamin: formData.jenisKelamin,
    p_tempat_lahir: formData.tempatLahir,
    p_tanggal_lahir: formData.tanggalLahir,
    p_agama: formData.agama,
    p_pekerjaan: formData.pekerjaan,
    p_status_tinggal: formData.statusTinggal,
    p_keluarga: formData.keluarga,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}