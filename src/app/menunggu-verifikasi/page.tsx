'use client';

import { Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function MenungguVerifikasiPage() {
  const router = useRouter();

  const handleLogout = async () => {
    document.cookie = "smart_system_session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT";
    document.cookie = "smart_system_uid=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT";
    router.push('/');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-4">
      <div className="bg-surface p-10 rounded-xl shadow-card border border-navy-100 max-w-md w-full">
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-accent/15 rounded-lg text-navy-800">
            <Clock size={36} />
          </div>
        </div>

        <h1 className="font-display text-2xl font-bold text-navy-900 tracking-tight mb-3">
          Menunggu Persetujuan
        </h1>
        <p className="text-navy-600 mb-8 text-sm leading-relaxed">
          Pendaftaran Anda telah kami terima. Saat ini akun Anda sedang dalam proses verifikasi oleh Admin RT 07. Silakan cek kembali secara berkala.
        </p>

        <button
          onClick={handleLogout}
          className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-navy-50 text-navy-700 rounded-lg font-semibold hover:bg-navy-100 transition-colors border border-navy-100"
        >
          Keluar
        </button>
      </div>
    </div>
  );
}
