'use client';

import { useState } from 'react';
import { supabase } from '../../../lib/supabaseclient';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function DaftarPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    noWa: '',
    namaLengkap: '',
    nomorRumah: '',
    password: '',
    konfirmasiPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showKonfirmasi, setShowKonfirmasi] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'noWa' && !/^\d*$/.test(value)) return;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!formData.noWa.startsWith('628') || formData.noWa.length < 10) {
      setErrorMessage('Nomor WA harus dimulai dengan 628 dan minimal 10 digit.');
      return;
    }
    if (formData.password !== formData.konfirmasiPassword) {
      setErrorMessage('Password dan Konfirmasi Password tidak cocok.');
      return;
    }
    if (formData.password.length < 6) {
      setErrorMessage('Password minimal 6 karakter.');
      return;
    }

    setIsLoading(true);

    try {
      // 1. Eksekusi registrasi ke Supabase
      const { error } = await supabase.rpc('register_warga', {
        p_no_wa: formData.noWa,
        p_password: formData.password,
        p_nama_lengkap: formData.namaLengkap,
        p_nomor_rumah: formData.nomorRumah,
      });

      if (error) throw new Error(error.message);

      setSuccessMessage('Pendaftaran berhasil! Mengarahkan ke WhatsApp Admin...');

      // 2. Fetch data WA Admin dari pengaturan_rt
      let adminWa = '';
      try {
        const { data: setting } = await supabase
          .from('pengaturan_rt')
          .select('wa_admin')
          .limit(1)
          .single();
        
        if (setting && setting.wa_admin) {
          adminWa = setting.wa_admin;
        }
      } catch (settingErr) {
        console.error('Gagal fetch pengaturan RT:', settingErr);
      }

      // 3. Logic Redirect (WA vs Login)
      setTimeout(() => {
        if (adminWa) {
          // refactored logic: Sanitizer WA number
          let cleanedWa = adminWa.replace(/\D/g, '');
          if (cleanedWa.startsWith('0')) cleanedWa = '62' + cleanedWa.substring(1);

          const pesan = `Halo Admin, saya ${formData.namaLengkap} dari Blok ${formData.nomorRumah} baru saja mendaftar di portal SmaRT System. Mohon verifikasi dan persetujuan untuk akun saya. Terima kasih.`;
          const waUrl = `https://wa.me/${cleanedWa}?text=${encodeURIComponent(pesan)}`;
          
          window.location.href = waUrl;
        } else {
          // Fallback kalau admin belum set up nomor WA
          router.push('/');
        }
      }, 1500);

    } catch (error: any) {
      setErrorMessage(error.message || 'Terjadi kesalahan saat pendaftaran.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-ivory-200">
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md bg-ivory-50 p-10 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-ivory-300"
      >
        <div className="text-center mb-10">
  <h1 className="text-4xl font-extrabold text-navy-900 tracking-tighter mb-3">SMART O7</h1>
  <p className="text-navy-500 text-[10px] font-bold uppercase leading-relaxed text-wrap">
    Sistem RT pintar RT 07 RW 06 Griya Permata Meri, Mojokerto
  </p>
</div>

        {errorMessage && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6 p-4 bg-red-50/50 text-red-600 text-sm rounded-lg border border-red-100 text-center">
            {errorMessage}
          </motion.div>
        )}

        {successMessage && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6 p-4 bg-green-50/50 text-green-600 text-sm rounded-lg border border-green-100 text-center flex flex-col items-center gap-2">
            <Loader2 className="animate-spin" size={20} />
            {successMessage}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-navy-700 mb-1">Nomor WhatsApp</label>
            <input
              type="tel" name="noWa" value={formData.noWa} onChange={handleChange}
              placeholder="628123456789" required
              className="w-full px-4 py-3 border border-ivory-400 rounded-xl bg-white text-navy-900 placeholder:text-navy-200 focus:outline-none focus:ring-2 focus:ring-navy-300 transition-all duration-300"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-navy-700 mb-1">Nama Lengkap Sesuai KTP</label>
            <input
              type="text" name="namaLengkap" value={formData.namaLengkap} onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-ivory-400 rounded-xl bg-white text-navy-900 focus:outline-none focus:ring-2 focus:ring-navy-300 transition-all duration-300"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-navy-700 mb-1">Blok / Nomor Rumah</label>
            <input
              type="text" name="nomorRumah" value={formData.nomorRumah} onChange={handleChange}
              placeholder="Misal: A1 No 15" required
              className="w-full px-4 py-3 border border-ivory-400 rounded-xl bg-white text-navy-900 placeholder:text-navy-200 focus:outline-none focus:ring-2 focus:ring-navy-300 transition-all duration-300"
            />
          </div>
          <div className="relative">
            <label className="block text-sm font-semibold text-navy-700 mb-1">Password</label>
            <input
              type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-ivory-400 rounded-xl bg-white text-navy-900 focus:outline-none focus:ring-2 focus:ring-navy-300 transition-all duration-300 pr-12"
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-[34px] text-navy-300 hover:text-navy-600 transition-colors">
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          <div className="relative">
            <label className="block text-sm font-semibold text-navy-700 mb-1">Konfirmasi Password</label>
            <input
              type={showKonfirmasi ? 'text' : 'password'} name="konfirmasiPassword" value={formData.konfirmasiPassword} onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-ivory-400 rounded-xl bg-white text-navy-900 focus:outline-none focus:ring-2 focus:ring-navy-300 transition-all duration-300 pr-12"
            />
            <button type="button" onClick={() => setShowKonfirmasi(!showKonfirmasi)} className="absolute right-4 top-[34px] text-navy-300 hover:text-navy-600 transition-colors">
              {showKonfirmasi ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          <button
            type="submit" disabled={isLoading}
            className="w-full py-3.5 mt-4 bg-navy-800 text-ivory-50 rounded-xl font-medium tracking-wide hover:bg-navy-700 active:scale-[0.98] transition-all duration-300 flex items-center justify-center disabled:opacity-70 shadow-md shadow-navy-900/10"
          >
            {isLoading ? <Loader2 className="animate-spin mr-2" size={20} /> : 'Daftar Sekarang'}
          </button>
        </form>
        
        <div className="mt-8 text-center text-sm text-navy-400 font-medium">
          Sudah punya akun?{' '}
          <Link href="/" className="text-gold font-bold hover:text-gold-light transition-colors">
            Login di sini
          </Link>
        </div>
      </motion.div>
    </div>
  );
}