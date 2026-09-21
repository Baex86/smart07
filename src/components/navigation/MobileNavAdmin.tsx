'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Calculator, Settings, Inbox, LogOut, FileText, ShieldAlert, Eye, X, Loader2 } from 'lucide-react';
import { logoutUser, verifyRoleSwitch } from '@/app/actions/auth';
import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function MobileNavAdmin() {
  const pathname = usePathname();
  const menuItems = [
    { name: 'Dasbor', icon: LayoutDashboard, href: '/admin' },
    { name: 'Layanan', icon: Inbox, href: '/admin/layanan' },
    { name: 'Surat', icon: FileText, href: '/admin/surat' },
    { name: 'Warga', icon: Users, href: '/admin/warga' },
    { name: 'Kas', icon: Calculator, href: '/admin/keuangan' },
    { name: 'Setelan', icon: Settings, href: '/admin/pengaturan' },
  ];

  const handleLogout = async () => {
    if (!confirm('Yakin ingin keluar dari portal Admin?')) return;
    await logoutUser();
    window.location.href = '/';
  };

  // Logic Long Press Switch Role
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handlePointerDown = () => {
    timerRef.current = setTimeout(() => {
      setIsModalOpen(true);
      setErrorMsg('');
      setPassword('');
    }, 1500);
  };

  const handlePointerUpOrLeave = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleSwitchRole = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      await verifyRoleSwitch(password);
      window.location.href = '/dashboard';
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <header className="md:hidden fixed top-0 left-0 w-full bg-navy-900 text-ivory-50 h-16 flex items-center justify-between px-5 shadow-md z-40">
        <h2 
          className="text-xl font-extrabold tracking-tight text-gold select-none"
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUpOrLeave}
          onPointerLeave={handlePointerUpOrLeave}
          onContextMenu={(e) => e.preventDefault()}
        >
          SMART O7
        </h2>
        <button onClick={handleLogout} className="p-2 rounded-full hover:bg-navy-800 text-red-400 transition-colors">
          <LogOut size={20} />
        </button>
      </header>
      
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-navy-900 border-t border-navy-800 shadow-[0_-4px_20px_rgb(0,0,0,0.2)] z-40 pb-safe overflow-x-auto hide-scrollbar">
        <div className="flex justify-around items-center h-16 min-w-max px-2 gap-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(`${item.href}/`));
            const Icon = item.icon;
            return (
              <Link key={item.name} href={item.href} className="flex-1 flex flex-col items-center justify-center gap-1 px-3">
                <div className={`p-1.5 rounded-full transition-colors duration-300 ${isActive ? 'bg-gold text-navy-900' : 'text-navy-300'}`}>
                  <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className={`text-[10px] font-medium transition-colors ${isActive ? 'text-gold' : 'text-navy-400'}`}>{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-navy-900/80 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden">
              <div className="px-6 py-5 border-b border-ivory-200 flex justify-between items-center bg-ivory-50">
                  <h3 className="font-extrabold text-navy-900 flex items-center gap-2"><ShieldAlert size={18} className="text-gold"/> Otorisasi Akses</h3>
                  <button onClick={() => setIsModalOpen(false)} className="p-1.5 bg-white rounded-full text-navy-400 border border-ivory-200"><X size={18} /></button>
              </div>
              <div className="p-6">
                <p className="text-sm font-medium text-navy-500 mb-5 leading-relaxed">Masukkan kata sandi Admin untuk beralih ke Dasbor Warga.</p>
                {errorMsg && <p className="mb-4 text-xs font-bold text-red-600 bg-red-50 p-3 rounded-xl border border-red-100">{errorMsg}</p>}
                <form onSubmit={handleSwitchRole} className="space-y-4">
                  <div className="relative">
                    <input type={showPassword ? 'text' : 'password'} required value={password} onChange={e => setPassword(e.target.value)} placeholder="Kata Sandi..." className="w-full px-4 py-3 bg-ivory-50 border border-ivory-300 rounded-xl outline-none text-navy-900 font-medium pr-12" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-navy-300 hover:text-navy-600"><Eye size={20} /></button>
                  </div>
                  <button type="submit" disabled={isSubmitting} className="w-full py-3.5 bg-navy-900 text-white font-bold rounded-xl hover:bg-navy-800 transition flex justify-center items-center gap-2 shadow-md">
                    {isSubmitting ? <Loader2 size={18} className="animate-spin"/> : 'Beralih Mode'}
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}