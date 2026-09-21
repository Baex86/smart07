'use server';

import { cookies } from 'next/headers';
import { supabase } from '@/lib/supabaseClient';

export async function setAuthCookies(data: any) {
  const cookieStore = await cookies();
  
  cookieStore.set('smart_system_session', data.session_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  });
  
  cookieStore.set('smart_system_uid', data.buku_induk_id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  });
  
  if (data.role === 'admin' || data.role === 'developer') {
    return { redirectTo: '/admin' };
  }
  
  if (data.role === 'warga') {
    if (!data.is_approved) {
      return { redirectTo: '/menunggu-verifikasi' };
    }
    if (!data.is_completed) {
      return { redirectTo: '/onboarding' };
    }
    return { redirectTo: '/dashboard' };
  }
  return { redirectTo: '/' };
}

export async function logoutUser() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('smart_system_session')?.value;
  
  if (sessionToken) {
    await supabase.from('users').update({ session_token: null }).eq('session_token', sessionToken);
  }
  
  cookieStore.delete('smart_system_session');
  cookieStore.delete('smart_system_uid');
  
  return { success: true };
}

export async function verifyRoleSwitch(password: string) {
  const cookieStore = await cookies();
  
  const sessionToken = cookieStore.get('smart_system_session')?.value;
  if (!sessionToken) throw new Error('Sesi tidak valid.');

  const { data: user, error: errUser } = await supabase
    .from('users')
    .select('no_wa')
    .eq('session_token', sessionToken)
    .single();
    
  if (errUser || !user) throw new Error('Identitas akun tidak ditemukan.');

  const { data: loginData, error: errLogin } = await supabase.rpc('login_user', {
    p_no_wa: user.no_wa,
    p_password: password
  });

  if (errLogin || !loginData) throw new Error('Kata sandi salah. Akses ditolak.');
  
  cookieStore.set('smart_system_session', loginData.session_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  });
  
  cookieStore.set('smart_system_uid', loginData.buku_induk_id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  });
  
  return { success: true };
}

// --- FUNGSI LUPA SANDI ---
export async function requestResetPassword(no_wa: string, nik_akhir: string) {
  const { data: success, error } = await supabase.rpc('ajukan_reset_password', {
    p_no_wa: no_wa,
    p_nik_akhir: nik_akhir
  });

  if (error || !success) {
    throw new Error('Data tidak cocok. Pastikan Nomor WA & 6 digit akhir NIK benar.');
  }
  return { success: true };
}

export async function executeResetPassword(token: string, new_password: string) {
  const { data: success, error } = await supabase.rpc('eksekusi_reset_password', {
    p_token: token,
    p_new_password: new_password
  });

  if (error || !success) {
    throw new Error(error?.message || 'Token tidak valid atau sudah kedaluwarsa.');
  }
  return { success: true };
}