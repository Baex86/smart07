'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Wallet, FileText, User, LogOut, LayoutGrid, Store } from 'lucide-react';
import { logoutUser } from '@/app/actions/auth';

export default function SidebarWarga() {
  const pathname = usePathname();

  const menuItems = [
    { name: 'Beranda', icon: Home, href: '/dashboard' },
    { name: 'Keuangan', icon: Wallet, href: '/keuangan' },
    { name: 'Surat Pengantar', icon: FileText, href: '/surat' },
    { name: 'Layanan', icon: LayoutGrid, href: '/layanan' },
    { name: 'Badan Usaha', icon: Store, href: '/badan-usaha' },
    { name: 'Profil', icon: User, href: '/profil' },
  ];

  const handleLogout = async () => {
    await logoutUser();
    window.location.href = '/';
  };

  return (
    <aside className="hidden lg:flex flex-col w-64 h-screen fixed left-0 top-0 bg-navy-900 text-navy-100 z-50">
      {/* Brand */}
      <div className="px-6 pt-7 pb-6 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-lg bg-accent flex items-center justify-center shrink-0">
            <span className="font-display font-bold text-navy-900 text-sm">07</span>
          </div>
          <div>
            <h2 className="font-display text-lg font-bold text-white leading-none tracking-tight">
              SMART<span className="text-accent"> 07</span>
            </h2>
            <p className="text-[10px] font-medium uppercase tracking-wider text-navy-300 mt-1.5">
              RT 07 · RW 06 · GPM
            </p>
          </div>
        </div>
      </div>

      {/* Menu */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto no-scrollbar">
        {menuItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;

          return (
            <Link key={item.name} href={item.href}>
              <div
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg transition-colors duration-150 font-medium text-sm ${
                  isActive
                    ? 'bg-white/10 text-white'
                    : 'text-navy-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon
                  size={19}
                  strokeWidth={2}
                  className={isActive ? 'text-accent' : ''}
                />
                <span>{item.name}</span>
                {isActive && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-accent" />
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Footer / Logout */}
      <div className="p-3 border-t border-white/10 shrink-0">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3.5 py-2.5 w-full rounded-lg text-navy-300 hover:bg-white/5 hover:text-white transition-colors font-medium text-sm"
        >
          <LogOut size={19} />
          <span>Keluar</span>
        </button>
      </div>
    </aside>
  );
}