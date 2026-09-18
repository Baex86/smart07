'use client';

import { motion } from 'framer-motion';
import { Wallet } from 'lucide-react';

export default function IuranPage() {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-navy-900 tracking-tight">Iuran Kas</h1>
        <p className="text-navy-500 text-sm mt-1">Pantau dan bayar iuran bulanan warga.</p>
      </div>

      <div className="bg-ivory-50 border border-ivory-300 rounded-2xl p-8 shadow-sm flex flex-col items-center justify-center min-h-[300px] text-center">
        <div className="w-16 h-16 bg-green-50 text-green-700 rounded-full flex items-center justify-center mb-4">
          <Wallet size={32} />
        </div>
        <h2 className="text-xl font-bold text-navy-900 mb-2">Buku Kas Dalam Pengembangan</h2>
        <p className="text-navy-400 text-sm max-w-md">
          Sistem pencatatan tagihan dan integrasi pembayaran sedang disiapkan oleh Admin.
        </p>
      </div>
    </motion.div>
  );
}