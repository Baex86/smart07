'use client';

import { useState } from 'react';
import { Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { executeResetPassword } from '@/app/actions/auth';

export default function ResetPasswordPage() {
  const router = useRouter();
  const params = useParams();
  const token = params.token as string;

  const [formData, setFormData] = useState({ password: '', konfirmasiPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showKonfirmasi, setShowKonfirmasi] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    
    if (formData.password !== formData.konfirmasiPassword) {
      setErrorMessage('Kata sandi dan Konfirmasi tidak cocok.');
      return;
    }
    if (formData.password.length < 6) {
      setErrorMessage('Kata sandi minimal 6 karakter.');
      return;
    }

    setIsLoading(true);
    try {
      await executeResetPassword(token, formData.password);
      setIsSuccess(true);
      setTimeout(() => {
        router.push('/');
      }, 3000);
    } catch (error: any) {
      setErrorMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-ivory-200">
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-ivory-50 p-10 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-ivory-300"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-navy-900 tracking-tighter mb-2">Pemulihan Sandi</h1>
          <p className="text-navy-500 text-xs font-bold uppercase tracking-wider">SMART O7</p>
        </div>

        {isSuccess ? (
          <div className="text-center space-y-4">
            <CheckCircle2 size={64} className="mx-auto text-green-500 mb-2" />
            <p className="font-bold text-navy-900 text-lg">Sandi Berhasil Diubah!</p>
            <p className="text-sm text-navy-500 mb-4">Mengarahkan ke halaman login...</p>
          </div>
        ) : (
          <>
            {errorMessage && (
              <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm font-medium rounded-lg border border-red-100 text-center">
                {errorMessage}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="relative">
                <label className="block text-sm font-semibold text-navy-700 mb-1">Kata Sandi Baru</label>
                <input
                  type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange} required
                  className="w-full px-4 py-3 border border-ivory-400 rounded-xl bg-white text-navy-900 focus:outline-none focus:ring-2 focus:ring-navy-300 pr-12"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-[34px] text-navy-300 hover:text-navy-600">
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              <div className="relative">
                <label className="block text-sm font-semibold text-navy-700 mb-1">Ulangi Kata Sandi Baru</label>
                <input
                  type={showKonfirmasi ? 'text' : 'password'} name="konfirmasiPassword" value={formData.konfirmasiPassword} onChange={handleChange} required
                  className="w-full px-4 py-3 border border-ivory-400 rounded-xl bg-white text-navy-900 focus:outline-none focus:ring-2 focus:ring-navy-300 pr-12"
                />
                <button type="button" onClick={() => setShowKonfirmasi(!showKonfirmasi)} className="absolute right-4 top-[34px] text-navy-300 hover:text-navy-600">
                  {showKonfirmasi ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              <button
                type="submit" disabled={isLoading}
                className="w-full py-3.5 mt-4 bg-navy-800 text-ivory-50 rounded-xl font-medium tracking-wide hover:bg-navy-700 active:scale-[0.98] flex items-center justify-center disabled:opacity-70 shadow-md"
              >
                {isLoading ? <Loader2 className="animate-spin mr-2" size={20} /> : 'Simpan Sandi Baru'}
              </button>
            </form>

            <div className="mt-8 text-center text-sm text-navy-400 font-medium">
              <Link href="/" className="text-gold font-bold hover:text-gold-light transition-colors">Batal & Kembali ke Login</Link>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}