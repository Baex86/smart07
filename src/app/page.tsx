'use client';

import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { setAuthCookies } from './actions/auth';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    noWa: '',
    password: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'noWa' && !/^\d*$/.test(value)) return;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (formData.noWa.length < 10) {
      setErrorMessage('Nomor WA tidak valid.');
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.rpc('login_user', {
        p_no_wa: formData.noWa,
        p_password: formData.password,
      });

      if (error) {
        throw new Error(error.message);
      }

      const result = await setAuthCookies(data);
      router.push(result.redirectTo);

    } catch (error: any) {
      setErrorMessage(error.message || 'Kredensial tidak valid atau terjadi kesalahan.');
    } finally {
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
        {/* Typografi direvisi: Full Sans-Serif dengan kontras ala Old Money */}
        <div className="text-center mb-10">
  <h1 className="text-4xl font-extrabold text-navy-900 tracking-tighter mb-3">SMART O7</h1>
  <p className="text-navy-500 text-[10px] font-bold uppercase leading-relaxed text-wrap">
    Sistem RT pintar RT 07 RW 06 Griya Permata Meri, Mojokerto
  </p>
</div>

        {errorMessage && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className="mb-6 p-4 bg-red-50/50 text-red-600 text-sm rounded-lg border border-red-100 text-center"
          >
            {errorMessage}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-navy-700 mb-2">Nomor WhatsApp</label>
            <input
              type="tel"
              name="noWa"
              value={formData.noWa}
              onChange={handleChange}
              placeholder="628123456789"
              required
              className="w-full px-4 py-3 border border-ivory-400 rounded-xl bg-white text-navy-900 placeholder:text-navy-200 focus:outline-none focus:ring-2 focus:ring-navy-300 transition-all duration-300"
            />
          </div>

          <div className="relative">
            <label className="block text-sm font-semibold text-navy-700 mb-2">Kata Sandi</label>
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
              className="w-full px-4 py-3 border border-ivory-400 rounded-xl bg-white text-navy-900 placeholder:text-navy-200 focus:outline-none focus:ring-2 focus:ring-navy-300 transition-all duration-300 pr-12"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-[38px] text-navy-300 hover:text-navy-600 transition-colors"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 mt-2 bg-navy-800 text-ivory-50 rounded-xl font-medium tracking-wide hover:bg-navy-700 active:scale-[0.98] transition-all duration-300 flex items-center justify-center disabled:opacity-70 disabled:active:scale-100 shadow-md shadow-navy-900/10"
          >
            {isLoading ? <Loader2 className="animate-spin mr-2" size={20} /> : 'Masuk ke Portal'}
          </button>
        </form>
        
        <div className="mt-8 text-center text-sm text-navy-400 font-medium">
          Belum terdaftar sebagai warga?{' '}
          <Link href="/daftar" className="text-gold font-bold hover:text-gold-light transition-colors">
            Registrasi
          </Link>
        </div>
      </motion.div>
    </div>
  );
}