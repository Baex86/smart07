'use server';

import { cookies } from 'next/headers';
import { supabase } from '@/lib/supabaseClient';

export async function setAuthCookies(data: any) {
  const cookieStore = await cookies();

  // Set Cookie untuk Session Token
  cookieStore.set('smart_system_session', data.session_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  });

  // Set Cookie untuk ID Buku Induk
  cookieStore.set('smart_system_uid', data.buku_induk_id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  });

  // Logika Redirect berlapis
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
    // 1. Bunuh token di Database (Supabase) agar tidak bisa dibajak
    await supabase.from('users').update({ session_token: null }).eq('session_token', sessionToken);
  }

  // 2. Sapu bersih cookie dari sisi Server
  cookieStore.delete('smart_system_session');
  cookieStore.delete('smart_system_uid');

  return { success: true };
}