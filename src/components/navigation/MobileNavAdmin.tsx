'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Calculator, Settings, Inbox, LogOut } from 'lucide-react';
import { logoutUser } from '@/app/actions/auth';

export default function MobileNavAdmin() {
  const pathname = usePathname();

  const menuItems = [
    { name: 'Dasbor', icon: LayoutDashboard, href: '/admin' },
    { name: 'Layanan', icon: Inbox, href: '/admin/layanan' },
    { name: 'Warga', icon: Users, href: '/admin/warga' },
    { name: 'Kas', icon: Calculator, href: '/admin/keuangan' },
    { name: 'Setelan', icon: Settings, href: '/admin/pengaturan' },
  ];

  const handleLogout = async () => {
    if (!confirm('Yakin ingin keluar dari portal Admin?')) return;
    await logoutUser();
    window.location.href = '/';
  };

  return (
    <>
      <header className="md:hidden fixed top-0 left-0 w-full bg-navy-900 text-ivory-50 h-16 flex items-center justify-between px-5 shadow-md z-50">
        <h2 className="text-xl font-extrabold tracking-tight text-gold">SMART O7</h2>
        {/* Tombol Logout dipindah ke Header buat Admin biar Bottom Nav gak kepenuhan */}
        <button onClick={handleLogout} className="p-2 rounded-full hover:bg-navy-800 text-red-400 transition-colors">
          <LogOut size={20} />
        </button>
      </header>
      
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-navy-900 border-t border-navy-800 shadow-[0_-4px_20px_rgb(0,0,0,0.2)] z-50 pb-safe overflow-x-auto hide-scrollbar">
        <div className="flex justify-around items-center h-16 min-w-max px-2 gap-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(`${item.href}/`));
            const Icon = item.icon;
            return (
              <Link key={item.name} href={item.href} className="flex-1 flex flex-col items-center justify-center gap-1 px-3">
                <div className={`p-1.5 rounded-full transition-colors duration-300 ${isActive ? 'bg-gold text-navy-900' : 'text-navy-300'}`}>
                  <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className={`text-[10px] font-medium transition-colors ${isActive ? 'text-gold' : 'text-navy-400'}`}>
                  {item.name}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}