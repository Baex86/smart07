'use client';

import { motion } from 'framer-motion';
import { FileText } from 'lucide-react';

export default function SuratPage() {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-navy-900 tracking-tight">Surat Pengantar</h1>
        <p className="text-navy-500 text-sm mt-1">Ajukan permohonan surat administrasi ke RT.</p>
      </div>

      <div className="bg-ivory-50 border border-ivory-300 rounded-2xl p-8 shadow-sm flex flex-col items-center justify-center min-h-[300px] text-center">
        <div className="w-16 h-16 bg-gold/10 text-gold-light rounded-full flex items-center justify-center mb-4">
          <FileText size={32} />
        </div>
        <h2 className="text-xl font-bold text-navy-900 mb-2">Layanan Persuratan Aktif Segera</h2>
        <p className="text-navy-400 text-sm max-w-md">
          Template surat pengantar domisili, izin usaha, dan lainnya akan tersedia di halaman ini.
        </p>
      </div>
    </motion.div>
  );
}