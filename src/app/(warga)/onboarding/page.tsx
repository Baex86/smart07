'use client';

import { useState, useEffect } from 'react';
import { Loader2, Plus, Trash2, CheckCircle2, User } from 'lucide-react';
import { submitOnboarding, getOnboardingContext } from '@/app/actions/onboarding';

export default function OnboardingPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnggota, setIsAnggota] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [formData, setFormData] = useState({
    nik: '',
    no_kk: '',
    jenis_kelamin: 'Laki-laki',
    tempat_lahir: '',
    tanggal_lahir: '',
    agama: 'Islam',
    pekerjaan: '',
    status_perkawinan: 'Belum Kawin',
    status_tinggal: 'Tetap',
  });

  const [keluarga, setKeluarga] = useState([{ nama: '', status_hubungan: 'Istri', no_wa: '' }]);

  useEffect(() => {
    getOnboardingContext().then((res) => {
      if (!res) {
        window.location.href = '/';
        return;
      }
      setIsAnggota(res.isAnggota);

      if (res.isAnggota && res.parentData) {
        setFormData(prev => ({
          ...prev,
          no_kk: res.parentData?.no_kk || '',
          status_tinggal: res.parentData?.status_tinggal || 'Tetap'
        }));
      }
      setIsLoading(false);
    }).catch(() => {
      setErrorMessage('Gagal memuat status kependudukan.');
      setIsLoading(false);
    });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleKeluargaChange = (index: number, field: string, value: string) => {
    const newKeluarga = [...keluarga];
    newKeluarga[index] = { ...newKeluarga[index], [field]: value };
    setKeluarga(newKeluarga);
  };

  const addKeluarga = () => { setKeluarga([...keluarga, { nama: '', status_hubungan: 'Anak', no_wa: '' }]); };
  const removeKeluarga = (index: number) => { setKeluarga(keluarga.filter((_, i) => i !== index)); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const validKeluarga = isAnggota ? [] : keluarga.filter(k => k.nama.trim() !== '');
      const result = await submitOnboarding({ ...formData, keluarga: validKeluarga });

      if (!result.success) {
        setErrorMessage(result.error || 'Terjadi penolakan dari database.');
        setIsSubmitting(false);
        return;
      }
      window.location.href = '/dashboard';
    } catch (error: any) {
      setErrorMessage(error.message || 'Terjadi kesalahan jaringan.');
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper">
        <Loader2 className="animate-spin text-navy-700" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-navy-900 tracking-tight">Lengkapi Profil</h1>
          <p className="text-navy-500 mt-1 text-sm">Mohon lengkapi biodata kependudukan Anda.</p>
        </div>

        {errorMessage && (
          <div className="p-4 bg-red-50 text-red-600 text-sm font-medium rounded-lg border border-red-200">{errorMessage}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-surface p-6 md:p-8 rounded-xl shadow-card border border-navy-100">
            <h2 className="text-lg font-semibold text-navy-900 mb-5 flex items-center gap-2 border-b border-navy-100 pb-3">
              <User className="text-accent" size={22} /> Data Kependudukan
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-navy-700 mb-1">NIK</label>
                <input type="text" name="nik" value={formData.nik} onChange={handleChange} required placeholder="16 digit NIK" className="w-full px-3 py-2 border border-navy-200 rounded-lg text-sm focus:ring-2 focus:ring-accent focus:outline-none" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-navy-700 mb-1">No. KK</label>
                <input type="text" name="no_kk" value={formData.no_kk} onChange={handleChange} required placeholder="16 digit No. Kartu Keluarga" className="w-full px-3 py-2 border border-navy-200 rounded-lg text-sm focus:ring-2 focus:ring-accent focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-navy-700 mb-1">Jenis Kelamin</label>
                <select name="jenis_kelamin" value={formData.jenis_kelamin} onChange={handleChange} className="w-full px-3 py-2 border border-navy-200 rounded-lg text-sm focus:ring-2 focus:ring-accent focus:outline-none">
                  <option value="Laki-laki">Laki-laki</option><option value="Perempuan">Perempuan</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-navy-700 mb-1">Tempat Lahir</label>
                <input type="text" name="tempat_lahir" value={formData.tempat_lahir} onChange={handleChange} required className="w-full px-3 py-2 border border-navy-200 rounded-lg text-sm focus:ring-2 focus:ring-accent focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-navy-700 mb-1">Tanggal Lahir</label>
                <input type="date" name="tanggal_lahir" value={formData.tanggal_lahir} onChange={handleChange} required className="w-full px-3 py-2 border border-navy-200 rounded-lg text-sm focus:ring-2 focus:ring-accent focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-navy-700 mb-1">Agama</label>
                <select name="agama" value={formData.agama} onChange={handleChange} className="w-full px-3 py-2 border border-navy-200 rounded-lg text-sm focus:ring-2 focus:ring-accent focus:outline-none">
                  <option value="Islam">Islam</option><option value="Kristen">Kristen</option><option value="Katolik">Katolik</option><option value="Hindu">Hindu</option><option value="Buddha">Buddha</option><option value="Konghucu">Konghucu</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-navy-700 mb-1">Pekerjaan</label>
                <input type="text" name="pekerjaan" value={formData.pekerjaan} onChange={handleChange} required className="w-full px-3 py-2 border border-navy-200 rounded-lg text-sm focus:ring-2 focus:ring-accent focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-navy-700 mb-1">Status Perkawinan</label>
                <select name="status_perkawinan" value={formData.status_perkawinan} onChange={handleChange} className="w-full px-3 py-2 border border-navy-200 rounded-lg text-sm focus:ring-2 focus:ring-accent focus:outline-none">
                  <option value="Belum Kawin">Belum Kawin</option><option value="Kawin">Kawin</option><option value="Cerai Hidup">Cerai Hidup</option><option value="Cerai Mati">Cerai Mati</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-navy-700 mb-1">Status Tinggal</label>
                <select name="status_tinggal" value={formData.status_tinggal} onChange={handleChange} className="w-full px-3 py-2 border border-navy-200 rounded-lg text-sm focus:ring-2 focus:ring-accent focus:outline-none">
                  <option value="Tetap">Tetap</option><option value="Kontrak">Kontrak</option>
                </select>
              </div>
            </div>
          </div>

          {!isAnggota && (
            <div className="bg-surface p-6 md:p-8 rounded-xl shadow-card border border-navy-100">
              <h2 className="text-lg font-semibold text-navy-900 mb-5 flex items-center gap-2 border-b border-navy-100 pb-3">
                <User className="text-accent" size={22} /> Anggota Keluarga
              </h2>
              <div className="space-y-4">
                {keluarga.map((k, index) => (
                  <div key={index} className="border border-navy-100 rounded-lg p-4 bg-paper relative">
                    <button type="button" onClick={() => removeKeluarga(index)} disabled={keluarga.length === 1} className="absolute top-3 right-3 text-navy-400 hover:text-red-600 disabled:opacity-30 transition"><Trash2 size={16} /></button>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-navy-700 mb-1">Nama Lengkap</label>
                        <input type="text" value={k.nama} onChange={(e) => handleKeluargaChange(index, 'nama', e.target.value)} placeholder="Nama anggota" className="w-full px-3 py-2 border border-navy-200 rounded-lg text-sm focus:ring-2 focus:ring-accent focus:outline-none" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-navy-700 mb-1">Status Hubungan</label>
                        <select value={k.status_hubungan} onChange={(e) => handleKeluargaChange(index, 'status_hubungan', e.target.value)} className="w-full px-3 py-2 border border-navy-200 rounded-lg text-sm focus:ring-2 focus:ring-accent focus:outline-none">
                          <option value="Istri">Istri</option><option value="Suami">Suami</option><option value="Anak">Anak</option><option value="Lainnya">Lainnya</option>
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs font-semibold text-navy-700 mb-1">No. WhatsApp (Opsional)</label>
                        <input type="number" value={k.no_wa} onChange={(e) => handleKeluargaChange(index, 'no_wa', e.target.value)} placeholder="Mulai dengan 628..." className="w-full px-3 py-2 border border-navy-200 rounded-lg text-sm focus:ring-2 focus:ring-accent focus:outline-none" />
                      </div>
                    </div>
                  </div>
                ))}
                <button type="button" onClick={addKeluarga} className="w-full py-3 border-2 border-dashed border-navy-200 text-navy-600 rounded-lg font-semibold text-sm hover:bg-navy-50 transition-colors flex justify-center items-center gap-2"><Plus size={18} /> Tambah Anggota</button>
              </div>
            </div>
          )}

          <button type="submit" disabled={isSubmitting} className="w-full py-4 bg-navy-900 text-white rounded-lg font-semibold tracking-wide hover:bg-navy-800 transition flex items-center justify-center gap-2 disabled:opacity-70 shadow-card">
            {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <><CheckCircle2 size={20} /> Simpan Data</>}
          </button>
        </form>
      </div>
    </div>
  );
}
