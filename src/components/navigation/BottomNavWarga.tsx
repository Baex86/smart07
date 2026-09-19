'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Wallet, FileText, User, LogOut } from 'lucide-react';
import { logoutUser } from '@/app/actions/auth';

export default function BottomNavWarga() {
  const pathname = usePathname();

  const menuItems = [
    { name: 'Beranda', icon: Home, href: '/dashboard' },
    { name: 'Iuran', icon: Wallet, href: '/iuran' },
    { name: 'Surat', icon: FileText, href: '/surat' },
    { name: 'Profil', icon: User, href: '/profil' },
  ];

  const handleLogout = async () => {
    if (!confirm('Yakin ingin keluar?')) return;
    await logoutUser();
    window.location.href = '/';
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 w-full bg-ivory-50 border-t border-ivory-300 shadow-[0_-4px_20px_rgb(0,0,0,0.02)] z-50 pb-safe">
      <div className="flex justify-around items-center h-16 px-1">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link key={item.name} href={item.href} className="flex-1 flex flex-col items-center justify-center gap-1">
              <div className={`p-1.5 rounded-full transition-colors duration-300 ${isActive ? 'bg-navy-100 text-navy-900' : 'text-navy-400'}`}>
                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className={`text-[10px] font-medium transition-colors ${isActive ? 'text-navy-900 font-bold' : 'text-navy-400'}`}>
                {item.name}
              </span>
            </Link>
          );
        })}
        {/* Tombol Logout Khusus HP Warga */}
        <button onClick={handleLogout} className="flex-1 flex flex-col items-center justify-center gap-1">
          <div className="p-1.5 rounded-full transition-colors duration-300 text-red-500 hover:bg-red-50">
            <LogOut size={22} strokeWidth={2} />
          </div>
          <span className="text-[10px] font-medium transition-colors text-red-500 font-bold">
            Keluar
          </span>
        </button>
      </div>
    </nav>
  );
}