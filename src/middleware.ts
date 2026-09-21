import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const session = request.cookies.get('smart_system_session')?.value;
  const path = request.nextUrl.pathname;

  // REVISI: Tambahkan /reset-password sebagai rute publik
  const isPublicPath = path === '/' || path.startsWith('/daftar') || path.startsWith('/reset-password');

  if (!session && !isPublicPath) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  if (session) {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      const res = await fetch(
        `${supabaseUrl}/rest/v1/users?session_token=eq.${session}&select=role,is_approved,buku_induk(is_completed)`,
        {
          headers: {
            apikey: supabaseKey!,
            Authorization: `Bearer ${supabaseKey!}`,
          },
          cache: 'no-store'
        }
      );
      
      const users = await res.json();

      if (!users || users.length === 0) {
        const response = NextResponse.redirect(new URL('/', request.url));
        response.cookies.delete('smart_system_session');
        response.cookies.delete('smart_system_uid');
        return response;
      }

      const user = users[0];
      const buku = Array.isArray(user.buku_induk) ? user.buku_induk[0] : user.buku_induk;
      const isCompleted = buku?.is_completed || false;

      if (user.role === 'admin' || user.role === 'developer') {
        if (isPublicPath) {
          return NextResponse.redirect(new URL('/admin', request.url));
        }
        return NextResponse.next();
      }

      if (user.role === 'warga') {
        if (!user.is_approved) {
          if (path === '/menunggu-verifikasi') return NextResponse.next();
          return NextResponse.redirect(new URL('/menunggu-verifikasi', request.url));
        }
        
        if (user.is_approved && !isCompleted) {
          if (path === '/onboarding') return NextResponse.next();
          return NextResponse.redirect(new URL('/onboarding', request.url));
        }

        if (user.is_approved && isCompleted) {
          if (isPublicPath || path === '/menunggu-verifikasi' || path === '/onboarding') {
            return NextResponse.redirect(new URL('/dashboard', request.url));
          }
          return NextResponse.next();
        }
      }
    } catch (error) {
      return NextResponse.next();
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|manifest.json|sw\\.js|workbox-.*).*)',
  ],
};
