'use client';

import { motion } from 'framer-motion';
import { Home, Bell } from 'lucide-react';

export default function DashboardPage() {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-navy-900 tracking-tight">Beranda</h1>
          <p className="text-navy-500 text-sm mt-1">Selamat datang di portal SmaRT System.</p>
        </div>
        <button className="p-2 bg-ivory-50 text-navy-600 rounded-full border border-ivory-300 hover:bg-ivory-200 transition-colors">
          <Bell size={20} />
        </button>
      </div>

      <div className="bg-ivory-50 border border-ivory-300 rounded-2xl p-8 shadow-sm flex flex-col items-center justify-center min-h-[300px] text-center">
        <div className="w-16 h-16 bg-navy-50 text-navy-800 rounded-full flex items-center justify-center mb-4">
          <Home size={32} />
        </div>
        <h2 className="text-xl font-bold text-navy-900 mb-2">Modul Beranda Segera Hadir</h2>
        <p className="text-navy-400 text-sm max-w-md">
          Pengumuman RT, ringkasan tagihan, dan status permohonan surat Anda akan ditampilkan di sini.
        </p>
      </div>
    </motion.div>
  );
}