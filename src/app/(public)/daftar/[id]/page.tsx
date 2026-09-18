'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../../../lib/supabaseclient'; // Sesuaikan jumlah ../ jika masih merah, atau pakai '@/lib/supabaseClient'
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function DaftarKeluargaPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [formData, setFormData] = useState({
    noWa: '',
    namaLengkap: '',
    password: '',
    konfirmasiPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showKonfirmasi, setShowKonfirmasi] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const fetchAnggotaKeluarga = async () => {
      try {
        // Amankan tipe data ID (jaga-jaga Next.js ngirim array)
        const exactId = Array.isArray(params.id) ? params.id[0] : params.id;
        if (!exactId) return;

        const { data, error } = await supabase
          .from('buku_induk')
          .select('nama_lengkap, no_wa, user_id')
          .eq('id', exactId)
          .single();

        if (error) {
          console.error("Supabase Error detail:", error);
          throw new Error(`Data tidak ditemukan. (Pesan DB: ${error.message})`);
        }
        
        if (data.user_id) throw new Error('Link ini sudah tidak berlaku (Akun sudah dibuat).');

        setFormData(prev => ({
          ...prev,
          noWa: data.no_wa || '',
          namaLengkap: data.nama_lengkap || ''
        }));
      } catch (error: any) {
        setErrorMessage(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) fetchAnggotaKeluarga();
  }, [id, params.id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (formData.password !== formData.konfirmasiPassword) {
      setErrorMessage('Password dan Konfirmasi Password tidak cocok.');
      return;
    }
    if (formData.password.length < 6) {
      setErrorMessage('Password minimal 6 karakter.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.rpc('register_keluarga_by_id', {
        p_buku_induk_id: id,
        p_password: formData.password,
      });

      if (error) throw new Error(error.message);

      setSuccessMessage('Aktivasi akun berhasil! Silakan login.');
      
      setTimeout(() => {
        router.push('/');
      }, 2000);
    } catch (error: any) {
      setErrorMessage(error.message || 'Terjadi kesalahan saat pendaftaran.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ivory-200">
        <Loader2 className="animate-spin text-navy-800" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-ivory-200">
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md bg-ivory-50 p-10 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-ivory-300"
      >
        <div className="text-center mb-10">
          <h1 className="text-3xl font-extrabold text-navy-900 tracking-tighter mb-3">Aktivasi Akun Warga</h1>
          <p className="text-navy-400 text-xs font-bold tracking-[0.2em] uppercase">GRIYA PERMATA MERI</p>
        </div>

        {errorMessage && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6 p-4 bg-red-50/50 text-red-600 text-sm rounded-lg border border-red-100 text-center">
            {errorMessage}
          </motion.div>
        )}
        {successMessage && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6 p-4 bg-green-50/50 text-green-600 text-sm rounded-lg border border-green-100 text-center">
            {successMessage}
          </motion.div>
        )}

        {!errorMessage.includes('tidak berlaku') && !errorMessage.includes('tidak ditemukan') && (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-navy-700 mb-1">Nama Lengkap</label>
              <input
                type="text" value={formData.namaLengkap} disabled
                className="w-full px-4 py-3 border border-ivory-300 rounded-xl bg-ivory-200 text-navy-400 cursor-not-allowed focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-navy-700 mb-1">Nomor WhatsApp</label>
              <input
                type="text" value={formData.noWa} disabled
                className="w-full px-4 py-3 border border-ivory-300 rounded-xl bg-ivory-200 text-navy-400 cursor-not-allowed focus:outline-none"
              />
            </div>
            <div className="relative">
              <label className="block text-sm font-semibold text-navy-700 mb-1">Buat Password</label>
              <input
                type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange} required
                className="w-full px-4 py-3 border border-ivory-400 rounded-xl bg-white text-navy-900 focus:outline-none focus:ring-2 focus:ring-navy-300 transition-all pr-12"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-[34px] text-navy-300 hover:text-navy-600 transition-colors">
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            <div className="relative">
              <label className="block text-sm font-semibold text-navy-700 mb-1">Konfirmasi Password</label>
              <input
                type={showKonfirmasi ? 'text' : 'password'} name="konfirmasiPassword" value={formData.konfirmasiPassword} onChange={handleChange} required
                className="w-full px-4 py-3 border border-ivory-400 rounded-xl bg-white text-navy-900 focus:outline-none focus:ring-2 focus:ring-navy-300 transition-all pr-12"
              />
              <button type="button" onClick={() => setShowKonfirmasi(!showKonfirmasi)} className="absolute right-4 top-[34px] text-navy-300 hover:text-navy-600 transition-colors">
                {showKonfirmasi ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            <button
              type="submit" disabled={isSubmitting}
              className="w-full py-3.5 mt-4 bg-navy-800 text-ivory-50 rounded-xl font-medium tracking-wide hover:bg-navy-700 active:scale-[0.98] transition-all flex items-center justify-center disabled:opacity-70 shadow-md shadow-navy-900/10"
            >
              {isSubmitting ? <Loader2 className="animate-spin mr-2" size={20} /> : 'Aktivasi Akun'}
            </button>
          </form>
        )}

        <div className="mt-8 text-center text-sm text-navy-400 font-medium">
          <Link href="/" className="text-gold font-bold hover:text-gold-light transition-colors">
            Kembali ke Login
          </Link>
        </div>
      </motion.div>
    </div>
  );
}