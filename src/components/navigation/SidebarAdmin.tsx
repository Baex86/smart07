'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Calculator, Settings, LogOut, Inbox } from 'lucide-react';
import { logoutUser } from '@/app/actions/auth';

export default function SidebarAdmin() {
  const pathname = usePathname();

  const menuItems = [
    { name: 'Dasbor', icon: LayoutDashboard, href: '/admin' },
    { name: 'Layanan', icon: Inbox, href: '/admin/layanan' },
    { name: 'Buku Induk', icon: Users, href: '/admin/warga' },
    { name: 'Arus Kas', icon: Calculator, href: '/admin/keuangan' },
    { name: 'Pengaturan', icon: Settings, href: '/admin/pengaturan' },
  ];

  const handleLogout = async () => {
    // Eksekusi pemusnahan session di server
    await logoutUser();
    window.location.href = '/';
  };

  return (
    <aside className="hidden md:flex flex-col w-64 h-screen fixed left-0 top-0 bg-navy-900 text-ivory-50 shadow-xl z-50">
      <div className="p-6 mb-4 border-b border-navy-800">
        <h2 className="text-3xl font-extrabold tracking-tighter text-gold">SMART O7</h2>
        <p className="text-[10px] font-bold uppercase text-navy-300 mt-2 leading-relaxed text-wrap">
          Sistem RT pintar RT 07 RW 06 Griya Permata Meri, Mojokerto
        </p>
      </div>
      
      <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(`${item.href}/`));
          const Icon = item.icon;
          return (
            <Link key={item.name} href={item.href}>
              <div className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 font-medium ${
                isActive ? 'bg-gold text-navy-900 shadow-lg shadow-gold/20' : 'text-navy-200 hover:bg-navy-800 hover:text-ivory-50'
              }`}>
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                <span>{item.name}</span>
              </div>
            </Link>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-navy-800">
        <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-red-400 hover:bg-red-500/10 transition-colors font-medium">
          <LogOut size={20} />
          <span>Keluar</span>
        </button>
      </div>
    </aside>
  );
}