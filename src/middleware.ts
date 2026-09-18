import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const session = request.cookies.get('smart_system_session')?.value;
  const path = request.nextUrl.pathname;

  // Daftar rute yang gak perlu login
  const isPublicPath = path === '/' || path.startsWith('/daftar');

  // 1. Kalau gak ada token dan maksa masuk ke dalam, tendang ke Login
  if (!session && !isPublicPath) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // 2. Kalau ada token, kita validasi ke Supabase via REST API
  if (session) {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      // Hit DB: Ambil role, is_approved, dan is_completed
      const res = await fetch(
        `${supabaseUrl}/rest/v1/users?session_token=eq.${session}&select=role,is_approved,buku_induk(is_completed)`,
        {
          headers: {
            apikey: supabaseKey!,
            Authorization: `Bearer ${supabaseKey!}`,
          },
          cache: 'no-store' // <--- OBAT ANTI MUTAR-MUTAR
        }
      );
      
      const users = await res.json();

      // Kalau token gak ketemu di DB (berarti login di HP lain / udah expired)
      if (!users || users.length === 0) {
        const response = NextResponse.redirect(new URL('/', request.url));
        response.cookies.delete('smart_system_session');
        response.cookies.delete('smart_system_uid');
        return response;
      }

      const user = users[0];
      
      // Amankan pembacaan JSON dari Supabase (bisa Array, bisa Object)
      const buku = Array.isArray(user.buku_induk) ? user.buku_induk[0] : user.buku_induk;
      const isCompleted = buku?.is_completed || false;

      // Aturan Admin
      if (user.role === 'admin' || user.role === 'developer') {
        if (path.startsWith('/admin')) return NextResponse.next();
        return NextResponse.redirect(new URL('/admin', request.url));
      }

      // Aturan Warga (Lapis 3 Blueprint)
      if (user.role === 'warga') {
        // Lapis 1: Belum di-ACC
        if (!user.is_approved) {
          if (path === '/menunggu-verifikasi') return NextResponse.next();
          return NextResponse.redirect(new URL('/menunggu-verifikasi', request.url));
        }
        
        // Lapis 2: Udah di-ACC tapi belum isi data KK
        if (user.is_approved && !isCompleted) {
          if (path === '/onboarding') return NextResponse.next();
          return NextResponse.redirect(new URL('/onboarding', request.url));
        }

        // Lapis 3: Warga Normal yang udah beres semua
        if (user.is_approved && isCompleted) {
          // Cegah warga normal balik ke halaman login, daftar, atau onboarding
          if (isPublicPath || path === '/menunggu-verifikasi' || path === '/onboarding') {
            return NextResponse.redirect(new URL('/dashboard', request.url));
          }
          return NextResponse.next();
        }
      }
    } catch (error) {
      // Fallback aman kalau koneksi API ngadat sebentar
      return NextResponse.next();
    }
  }

  return NextResponse.next();
}

// Konfigurasi ini buat mastiin file statis (gambar, CSS) nggak ikut dicegat middleware
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};