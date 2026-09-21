'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Wallet, FileText, User, LogOut, MessageSquareWarning, Lightbulb } from 'lucide-react';
import { logoutUser } from '@/app/actions/auth';

export default function SidebarWarga() {
  const pathname = usePathname();

  const menuItems = [
    { name: 'Beranda', icon: Home, href: '/dashboard' },
    { name: 'Iuran Kas', icon: Wallet, href: '/iuran' },
    { name: 'Surat Pengantar', icon: FileText, href: '/surat' },
    { name: 'Aduan Warga', icon: MessageSquareWarning, href: '/aduan' },
    { name: 'Usulan Warga', icon: Lightbulb, href: '/usulan' },
    { name: 'Profil', icon: User, href: '/profil' },
  ];

  const handleLogout = async () => {
    await logoutUser();
    window.location.href = '/';
  };

  return (
    <aside className="hidden md:flex flex-col w-64 h-screen fixed left-0 top-0 bg-ivory-50 border-r border-ivory-300 shadow-sm z-50">
      <div className="p-6 mb-4 border-b border-ivory-300">
        <h2 className="text-3xl font-extrabold text-navy-900 tracking-tighter">SMART O7</h2>
        <p className="text-[10px] font-bold uppercase text-navy-500 mt-2 leading-relaxed text-wrap">
          Sistem RT pintar RT 07 RW 06 Griya Permata Meri, Mojokerto
        </p>
      </div>
      
      <nav className="flex-1 px-4 space-y-2 overflow-y-auto no-scrollbar">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link key={item.name} href={item.href}>
              <div
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 font-medium ${
                  isActive
                    ? 'bg-navy-800 text-ivory-50 shadow-md shadow-navy-900/10'
                    : 'text-navy-600 hover:bg-ivory-200 hover:text-navy-900'
                }`}
              >
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                <span>{item.name}</span>
              </div>
            </Link>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-ivory-300 shrink-0">
        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-red-600 hover:bg-red-50 transition-colors font-medium"
        >
          <LogOut size={20} />
          <span>Keluar</span>
        </button>
      </div>
    </aside>
  );
}