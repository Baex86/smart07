'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../../../lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { Loader2, Plus, Trash2, CheckCircle2, User } from 'lucide-react';
import { motion } from 'framer-motion';

export default function OnboardingPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnggota, setIsAnggota] = useState(false);
  const [userId, setUserId] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const [formData, setFormData] = useState({
    nik: '',
    no_kk: '',
    jenis_kelamin: 'Laki-laki',
    tempat_lahir: '',
    tanggal_lahir: '',
    agama: 'Islam',
    pekerjaan: '',
    status_tinggal: 'Tetap',
  });

  const [keluarga, setKeluarga] = useState([{ nama: '', status_hubungan: 'Istri', no_wa: '' }]);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push('/');
          return;
        }
        
        setUserId(session.user.id);
        
        const { data, error } = await supabase
          .from('buku_induk')
          .select('kepala_keluarga_id')
          .eq('user_id', session.user.id)
          .single();
          
        if (error) throw error;
        
        // Deteksi kalau dia bukan KK (punya kepala_keluarga_id)
        if (data && data.kepala_keluarga_id) {
          setIsAnggota(true);
        }
      } catch (err) {
        console.error('Error fetching status:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkStatus();
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleKeluargaChange = (index: number, field: string, value: string) => {
    const newKeluarga = [...keluarga];
    newKeluarga[index] = { ...newKeluarga[index], [field]: value };
    setKeluarga(newKeluarga);
  };

  const addKeluarga = () => {
    setKeluarga([...keluarga, { nama: '', status_hubungan: 'Anak', no_wa: '' }]);
  };

  const removeKeluarga = (index: number) => {
    const newKeluarga = keluarga.filter((_, i) => i !== index);
    setKeluarga(newKeluarga);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return; // Mencegah double submit / data ganda
    
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      // Filter array keluarga yang kosong
      const validKeluarga = isAnggota ? [] : keluarga.filter(k => k.nama.trim() !== '');

      const { error } = await supabase.rpc('complete_onboarding', {
        p_user_id: userId,
        p_nik: formData.nik,
        p_no_kk: formData.no_kk,
        p_jenis_kelamin: formData.jenis_kelamin,
        p_tempat_lahir: formData.tempat_lahir,
        p_tanggal_lahir: formData.tanggal_lahir,
        p_agama: formData.agama,
        p_pekerjaan: formData.pekerjaan,
        p_status_tinggal: formData.status_tinggal,
        p_keluarga: validKeluarga
      });

      if (error) throw error;

      router.push('/dashboard');
    } catch (error: any) {
      setErrorMessage(error.message || 'Terjadi kesalahan saat menyimpan data.');
      setIsSubmitting(false); // Buka kunci cuma kalau error
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ivory-100">
        <Loader2 className="animate-spin text-navy-800" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ivory-100 py-10 px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-extrabold text-navy-900 tracking-tight">Lengkapi Profil</h1>
          <p className="text-navy-500 mt-1 text-sm font-medium">Mohon lengkapi biodata kependudukan Anda.</p>
        </div>

        {errorMessage && (
          <div className="p-4 bg-red-50 text-red-600 text-sm font-bold rounded-xl border border-red-200">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Data Diri */}
          <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-ivory-300">
            <h2 className="text-xl font-bold text-navy-900 mb-5 flex items-center gap-2 border-b border-ivory-100 pb-3">
              <User className="text-gold" size={24} /> Data Pribadi
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-navy-700 mb-1">NIK</label>
                <input type="number" name="nik" required value={formData.nik} onChange={handleChange} className="w-full px-4 py-3 border border-ivory-300 rounded-xl focus:ring-2 focus:ring-navy-400 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-navy-700 mb-1">Nomor KK</label>
                <input type="number" name="no_kk" required value={formData.no_kk} onChange={handleChange} className="w-full px-4 py-3 border border-ivory-300 rounded-xl focus:ring-2 focus:ring-navy-400 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-navy-700 mb-1">Jenis Kelamin</label>
                <select name="jenis_kelamin" value={formData.jenis_kelamin} onChange={handleChange} className="w-full px-4 py-3 border border-ivory-300 rounded-xl focus:ring-2 focus:ring-navy-400 focus:outline-none">
                  <option value="Laki-laki">Laki-laki</option>
                  <option value="Perempuan">Perempuan</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-navy-700 mb-1">Agama</label>
                <select name="agama" value={formData.agama} onChange={handleChange} className="w-full px-4 py-3 border border-ivory-300 rounded-xl focus:ring-2 focus:ring-navy-400 focus:outline-none">
                  <option value="Islam">Islam</option>
                  <option value="Kristen">Kristen</option>
                  <option value="Katolik">Katolik</option>
                  <option value="Hindu">Hindu</option>
                  <option value="Buddha">Buddha</option>
                  <option value="Konghucu">Konghucu</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-navy-700 mb-1">Tempat Lahir</label>
                <input type="text" name="tempat_lahir" required value={formData.tempat_lahir} onChange={handleChange} className="w-full px-4 py-3 border border-ivory-300 rounded-xl focus:ring-2 focus:ring-navy-400 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-navy-700 mb-1">Tanggal Lahir</label>
                <input type="date" name="tanggal_lahir" required value={formData.tanggal_lahir} onChange={handleChange} className="w-full px-4 py-3 border border-ivory-300 rounded-xl focus:ring-2 focus:ring-navy-400 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-navy-700 mb-1">Pekerjaan</label>
                <input type="text" name="pekerjaan" required value={formData.pekerjaan} onChange={handleChange} className="w-full px-4 py-3 border border-ivory-300 rounded-xl focus:ring-2 focus:ring-navy-400 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-navy-700 mb-1">Status Tinggal</label>
                <select name="status_tinggal" value={formData.status_tinggal} onChange={handleChange} className="w-full px-4 py-3 border border-ivory-300 rounded-xl focus:ring-2 focus:ring-navy-400 focus:outline-none">
                  <option value="Tetap">Warga Tetap</option>
                  <option value="Kontrak">Kontrak / Kos</option>
                </select>
              </div>
            </div>
          </div>

          {/* Form Tambah Keluarga (Hanya muncul jika dia Kepala Keluarga) */}
          {!isAnggota && (
            <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-ivory-300">
              <div className="mb-5 border-b border-ivory-100 pb-3">
                <h2 className="text-xl font-bold text-navy-900">Anggota Keluarga (Opsional)</h2>
                <p className="text-xs text-navy-400 mt-1">Daftarkan istri/anak yang tinggal satu rumah agar mendapatkan akses portal.</p>
              </div>
              
              <div className="space-y-4">
                {keluarga.map((k, index) => (
                  <div key={index} className="p-4 bg-ivory-50 border border-ivory-200 rounded-xl relative">
                    <button type="button" onClick={() => removeKeluarga(index)} className="absolute top-4 right-4 text-red-400 hover:text-red-600 transition-colors">
                      <Trash2 size={18} />
                    </button>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                      <div>
                        <label className="block text-xs font-semibold text-navy-700 mb-1">Nama Anggota</label>
                        <input type="text" value={k.nama} onChange={(e) => handleKeluargaChange(index, 'nama', e.target.value)} placeholder="Nama Lengkap" className="w-full px-3 py-2 border border-ivory-300 rounded-lg text-sm focus:ring-2 focus:ring-navy-400 focus:outline-none" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-navy-700 mb-1">Status Hubungan</label>
                        <select value={k.status_hubungan} onChange={(e) => handleKeluargaChange(index, 'status_hubungan', e.target.value)} className="w-full px-3 py-2 border border-ivory-300 rounded-lg text-sm focus:ring-2 focus:ring-navy-400 focus:outline-none">
                          <option value="Istri">Istri</option>
                          <option value="Suami">Suami</option>
                          <option value="Anak">Anak</option>
                          <option value="Lainnya">Lainnya</option>
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs font-semibold text-navy-700 mb-1">No. WhatsApp (Opsional)</label>
                        <input type="number" value={k.no_wa} onChange={(e) => handleKeluargaChange(index, 'no_wa', e.target.value)} placeholder="Mulai dengan 628..." className="w-full px-3 py-2 border border-ivory-300 rounded-lg text-sm focus:ring-2 focus:ring-navy-400 focus:outline-none" />
                      </div>
                    </div>
                  </div>
                ))}
                
                <button type="button" onClick={addKeluarga} className="w-full py-3 border-2 border-dashed border-ivory-300 text-navy-600 rounded-xl font-bold text-sm hover:bg-ivory-50 transition-colors flex justify-center items-center gap-2">
                  <Plus size={18} /> Tambah Anggota
                </button>
              </div>
            </div>
          )}

          <button type="submit" disabled={isSubmitting} className="w-full py-4 bg-navy-800 text-ivory-50 rounded-xl font-bold tracking-wide hover:bg-navy-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70 shadow-md">
            {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <><CheckCircle2 size={20} /> Simpan Data</>}
          </button>
        </form>
      </motion.div>
    </div>
  );
}