'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Wallet, FileText, User, LayoutGrid, Store } from 'lucide-react';

export default function BottomNavWarga() {
  const pathname = usePathname();

  const menuItems = [
    { name: 'Beranda', icon: Home, href: '/dashboard' },
    { name: 'Keuangan', icon: Wallet, href: '/keuangan' },
    { name: 'Surat', icon: FileText, href: '/surat' },
    { name: 'Layanan', icon: LayoutGrid, href: '/layanan' },
    { name: 'Usaha', icon: Store, href: '/badan-usaha' },
    { name: 'Profil', icon: User, href: '/profil' },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 w-full bg-surface border-t border-navy-100 shadow-[0_-4px_16px_rgb(11,18,32,0.06)] z-50 pb-safe">
      <div className="flex justify-around items-center h-16 px-1">
        {menuItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 min-w-0"
            >
              <div
                className={`p-1 rounded-md transition-colors duration-150 ${
                  isActive ? 'bg-accent/15 text-navy-900' : 'text-navy-400'
                }`}
              >
                <Icon size={21} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span
                className={`text-[10px] leading-none truncate max-w-full transition-colors ${
                  isActive ? 'text-navy-900 font-semibold' : 'text-navy-400 font-medium'
                }`}
              >
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}