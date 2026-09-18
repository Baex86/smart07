'use server';

import { cookies } from 'next/headers';

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