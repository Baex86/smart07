'use client';

import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Eye, EyeOff, Loader2, KeyRound, X, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { setAuthCookies, requestResetPassword } from './actions/auth';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ noWa: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // State Modal Lupa Sandi
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetForm, setResetForm] = useState({ noWa: '', nikAkhir: '' });
  const [isResetLoading, setIsResetLoading] = useState(false);
  const [resetStatus, setResetStatus] = useState({ show: false, success: false, message: '' });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'noWa' && !/^\d*$/.test(value)) return;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleResetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (!/^\d*$/.test(value)) return;
    if (name === 'nikAkhir' && value.length > 6) return;
    setResetForm((prev) => ({ ...prev, [name]: value }));
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
      if (error) throw new Error(error.message);
      const result = await setAuthCookies(data);
      router.push(result.redirectTo);
    } catch (error: any) {
      setErrorMessage(error.message || 'Kredensial tidak valid atau terjadi kesalahan.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAjukanReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (resetForm.nikAkhir.length !== 6) return setResetStatus({ show: true, success: false, message: 'Masukkan tepat 6 digit akhir NIK Anda.' });
    
    setIsResetLoading(true);
    try {
      await requestResetPassword(resetForm.noWa, resetForm.nikAkhir);
      setResetStatus({ show: true, success: true, message: 'Permintaan pemulihan sandi berhasil dikirim! Silakan tunggu Admin menghubungi WA Anda.' });
      setResetForm({ noWa: '', nikAkhir: '' });
    } catch (error: any) {
      setResetStatus({ show: true, success: false, message: error.message });
    } finally {
      setIsResetLoading(false);
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

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-navy-700 mb-2">Nomor WhatsApp</label>
            <input
              type="tel" name="noWa" value={formData.noWa} onChange={handleChange} placeholder="628123456789" required
              className="w-full px-4 py-3 border border-ivory-400 rounded-xl bg-white text-navy-900 placeholder:text-navy-200 focus:outline-none focus:ring-2 focus:ring-navy-300 transition-all duration-300"
            />
          </div>
          <div className="relative">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-semibold text-navy-700">Kata Sandi</label>
              <button type="button" onClick={() => setIsResetModalOpen(true)} className="text-xs font-bold text-navy-400 hover:text-gold transition-colors">Lupa Sandi?</button>
            </div>
            <input
              type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange} required
              className="w-full px-4 py-3 border border-ivory-400 rounded-xl bg-white text-navy-900 placeholder:text-navy-200 focus:outline-none focus:ring-2 focus:ring-navy-300 transition-all duration-300 pr-12"
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-[38px] text-navy-300 hover:text-navy-600 transition-colors">
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          <button
            type="submit" disabled={isLoading}
            className="w-full py-3.5 mt-2 bg-navy-800 text-ivory-50 rounded-xl font-medium tracking-wide hover:bg-navy-700 active:scale-[0.98] transition-all duration-300 flex items-center justify-center disabled:opacity-70 shadow-md shadow-navy-900/10"
          >
            {isLoading ? <Loader2 className="animate-spin mr-2" size={20} /> : 'Masuk ke Portal'}
          </button>
        </form>
        
        <div className="mt-8 text-center text-sm text-navy-400 font-medium">
          Belum terdaftar sebagai warga?{' '}
          <Link href="/daftar" className="text-gold font-bold hover:text-gold-light transition-colors">Registrasi</Link>
        </div>
      </motion.div>

      {/* MODAL LUPA SANDI */}
      <AnimatePresence>
        {isResetModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsResetModalOpen(false)} className="absolute inset-0 bg-navy-900/80 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden">
              <div className="px-6 py-5 border-b border-ivory-200 flex justify-between items-center bg-ivory-50">
                  <h3 className="font-extrabold text-navy-900 flex items-center gap-2"><KeyRound size={18} className="text-gold"/> Lupa Kata Sandi</h3>
                  <button onClick={() => {setIsResetModalOpen(false); setResetStatus({show:false, success:false, message:''})}} className="p-1.5 bg-white rounded-full text-navy-400 border border-ivory-200"><X size={18} /></button>
              </div>
              <div className="p-6">
                <p className="text-sm font-medium text-navy-500 mb-5 leading-relaxed">Masukkan identitas Anda. Admin akan mengirimkan link rahasia untuk memulihkan sandi ke WhatsApp Anda.</p>
                
                {resetStatus.show && (
                  <div className={`mb-5 p-4 rounded-xl flex items-start gap-3 text-sm font-medium border ${resetStatus.success ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                    {resetStatus.success ? <CheckCircle2 size={18} className="shrink-0 mt-0.5" /> : <X size={18} className="shrink-0 mt-0.5" />}
                    {resetStatus.message}
                  </div>
                )}

                <form onSubmit={handleAjukanReset} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-navy-500 uppercase tracking-wider mb-1.5">Nomor WhatsApp Terdaftar</label>
                    <input type="tel" name="noWa" required value={resetForm.noWa} onChange={handleResetChange} placeholder="628..." className="w-full px-4 py-3 bg-ivory-50 border border-ivory-300 rounded-xl outline-none text-navy-900 font-medium" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-navy-500 uppercase tracking-wider mb-1.5">6 Digit Terakhir NIK Anda</label>
                    <input type="text" name="nikAkhir" required value={resetForm.nikAkhir} onChange={handleResetChange} placeholder="Contoh: 123456" className="w-full px-4 py-3 bg-ivory-50 border border-ivory-300 rounded-xl outline-none text-navy-900 font-medium tracking-widest text-center" />
                  </div>
                  <button type="submit" disabled={isResetLoading} className="w-full py-3.5 bg-navy-900 text-white font-bold rounded-xl hover:bg-navy-800 transition flex justify-center items-center gap-2 shadow-md">
                    {isResetLoading ? <Loader2 size={18} className="animate-spin"/> : 'Kirim Permintaan Reset'}
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}