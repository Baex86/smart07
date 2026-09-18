'use client';

import { motion } from 'framer-motion';
import { Clock, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function MenungguVerifikasiPage() {
  const router = useRouter();

  const handleLogout = async () => {
    // Hapus cookie murni dari sisi client untuk MVP darurat, 
    // idealnya nanti dibikin Server Action logout khusus
    document.cookie = "smart_system_session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT";
    document.cookie = "smart_system_uid=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT";
    router.push('/');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="bg-ivory-50 p-10 rounded-2xl shadow-sm border border-ivory-300 max-w-md w-full"
      >
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-navy-50 rounded-full text-navy-800">
            <Clock size={40} />
          </div>
        </div>
        
        <h1 className="text-2xl font-extrabold text-navy-900 tracking-tight mb-3">
          Menunggu Persetujuan
        </h1>
        <p className="text-navy-600 mb-8 text-sm leading-relaxed">
          Pendaftaran Anda telah kami terima. Saat ini akun Anda sedang dalam proses verifikasi oleh Admin RT 07. Silakan cek kembali secara berkala.
        </p>

        <button 
          onClick={handleLogout}
          className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-ivory-200 text-navy-800 rounded-xl font-medium hover:bg-ivory-300 transition-colors"
        >
          <span>UNDER REVIEW</span>
        </button>
      </motion.div>
    </div>
  );
}