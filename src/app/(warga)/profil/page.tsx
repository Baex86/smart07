'use client';

import { useState, useEffect } from 'react';
import { Loader2, User, Users, MapPin, CreditCard, Phone, Calendar, Edit3, LogOut, CheckCircle2, X, Plus, Trash2, Edit2, MessageCircle, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getProfilWarga, ajukanPerubahanData, tambahKeluarga, editKeluarga, hapusKeluarga } from '../../actions/profil';
import { logoutUser } from '../../actions/auth';

export default function ProfilPage() {
  const [profil, setProfil] = useState<any>(null);
  const [keluarga, setKeluarga] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // State Modal Perbarui Data Utama (LENGKAP)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [draftStatus, setDraftStatus] = useState<{ show: boolean, message: string, type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });
  
  const [updateForm, setUpdateForm] = useState({
    nama_lengkap: '', no_wa: '', pekerjaan: '', status_tinggal: '', 
    nik: '', tempat_lahir: '', tanggal_lahir: '', agama: '', password: ''
  });
  const [showPassword, setShowPassword] = useState(false);

  // State Modal Manajemen Keluarga
  const [isKeluargaModalOpen, setIsKeluargaModalOpen] = useState(false);
  const [keluargaMode, setKeluargaMode] = useState<'tambah' | 'edit'>('tambah');
  const [keluargaForm, setKeluargaForm] = useState({ id: '', nama_lengkap: '', status_hubungan: 'Anak', nik: '', no_wa: '' });

  const fetchData = async () => {
    try {
      const data = await getProfilWarga();
      if (data.profil) {
        setProfil(data.profil);
        setKeluarga(data.keluarga);
        setUpdateForm({
          nama_lengkap: data.profil.nama_lengkap || '',
          no_wa: data.profil.no_wa || '',
          pekerjaan: data.profil.pekerjaan || '',
          status_tinggal: data.profil.status_tinggal || 'Tetap',
          nik: data.profil.nik || '',
          tempat_lahir: data.profil.tempat_lahir || '',
          tanggal_lahir: data.profil.tanggal_lahir || '',
          agama: data.profil.agama || 'Islam',
          password: ''
        });
      }
    } catch (error) {
      console.error('Gagal menarik profil:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatWA = (noWa: string) => {
    if (!noWa) return '';
    let cleaned = noWa.replace(/\D/g, '');
    if (cleaned.startsWith('0')) cleaned = '62' + cleaned.substring(1);
    return cleaned;
  };

  const generateWALink = (k: any) => {
    const phone = formatWA(k.no_wa);
    if (!phone) return '#';
    
    const butuhPerhatian = !k.user_id || !k.is_completed;
    
    if (butuhPerhatian) {
      const domain = window.location.origin;
      const text = `Halo ${k.nama_lengkap}, tolong bantu lengkapi data kependudukan RT 07 kita dan buat akun di portal SmaRT System ya. Klik link ini untuk mendaftar: ${domain}/daftar/${k.id}`;
      return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
    }
    
    return `https://wa.me/${phone}`;
  };

  const handleUpdateDataUtama = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!updateForm.password) {
      setDraftStatus({ show: true, message: 'Kata sandi wajib diisi untuk verifikasi.', type: 'error' });
      return;
    }

    setIsSubmitting(true);
    setDraftStatus({ show: false, message: '', type: 'success' });

    try {
      const payload = {
        nama_lengkap: updateForm.nama_lengkap,
        no_wa: updateForm.no_wa,
        pekerjaan: updateForm.pekerjaan,
        status_tinggal: updateForm.status_tinggal,
        nik: updateForm.nik,
        tempat_lahir: updateForm.tempat_lahir,
        tanggal_lahir: updateForm.tanggal_lahir,
        agama: updateForm.agama
      };

      await ajukanPerubahanData(payload, updateForm.password);
      setDraftStatus({ show: true, message: 'Pengajuan perubahan data berhasil dikirim ke Admin.', type: 'success' });
      setUpdateForm(prev => ({ ...prev, password: '' })); 

      setTimeout(() => {
        setDraftStatus({ show: false, message: '', type: 'success' });
        setIsEditModalOpen(false);
      }, 3000);
    } catch (error: any) {
      setDraftStatus({ show: true, message: error.message || 'Gagal mengirim pengajuan.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openTambahKeluarga = () => {
    setKeluargaMode('tambah');
    setKeluargaForm({ id: '', nama_lengkap: '', status_hubungan: 'Anak', nik: '', no_wa: '' });
    setIsKeluargaModalOpen(true);
  };

  const openEditKeluarga = (k: any) => {
    setKeluargaMode('edit');
    setKeluargaForm({ id: k.id, nama_lengkap: k.nama_lengkap, status_hubungan: k.status_hubungan, nik: k.nik || '', no_wa: k.no_wa || '' });
    setIsKeluargaModalOpen(true);
  };

  const handleSaveKeluarga = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (keluargaMode === 'tambah') {
        await tambahKeluarga(keluargaForm);
      } else {
        await editKeluarga(keluargaForm);
      }
      setIsKeluargaModalOpen(false);
      await fetchData(); 
    } catch (error) {
      alert('Gagal menyimpan data keluarga.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteKeluarga = async (id: string, nama: string) => {
    if (!confirm(`Yakin ingin menghapus ${nama} dari daftar keluarga?`)) return;
    try {
      await hapusKeluarga(id);
      await fetchData();
    } catch (error: any) {
      alert('Gagal menghapus. Pastikan akun belum terikat (login mandiri).');
    }
  };

  const handleLogout = async () => {
    if (!confirm('Yakin ingin keluar dari portal?')) return;
    await logoutUser();
    window.location.replace('/');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader2 className="animate-spin text-navy-800" size={40} />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 pb-24 md:pb-8">
      <div>
        <h1 className="text-3xl font-extrabold text-navy-900 tracking-tight">Profil Warga</h1>
        <p className="text-navy-500 mt-1 text-sm font-medium">Informasi kependudukan Anda dan keluarga.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Kolom Kiri: Profil Pribadi */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-ivory-300 rounded-2xl shadow-sm overflow-hidden">
            <div className="bg-navy-900 p-6 text-ivory-50 flex items-center gap-4 relative overflow-hidden">
              <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-gold/20 rounded-full blur-2xl"></div>
              <div className="w-16 h-16 bg-gold rounded-full flex items-center justify-center text-navy-900 shadow-inner z-10">
                <User size={32} />
              </div>
              <div className="z-10">
                <h2 className="text-2xl font-extrabold tracking-tight leading-tight">{profil.nama_lengkap}</h2>
                <p className="text-navy-200 text-xs font-bold uppercase tracking-wider mt-1">{profil.status_hubungan || 'Warga'}</p>
              </div>
            </div>
            
            <div className="p-6 md:p-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="flex items-center gap-2 text-xs font-bold text-navy-400 uppercase tracking-wider mb-1"><CreditCard size={14}/> NIK</label>
                <p className="font-medium text-navy-900">{profil.nik || '-'}</p>
              </div>
              <div>
                <label className="flex items-center gap-2 text-xs font-bold text-navy-400 uppercase tracking-wider mb-1"><CreditCard size={14}/> Nomor KK</label>
                <p className="font-medium text-navy-900">{profil.no_kk || '-'}</p>
              </div>
              <div>
                <label className="flex items-center gap-2 text-xs font-bold text-navy-400 uppercase tracking-wider mb-1"><Phone size={14}/> WhatsApp</label>
                <p className="font-medium text-navy-900">{profil.no_wa || '-'}</p>
              </div>
              <div>
                <label className="flex items-center gap-2 text-xs font-bold text-navy-400 uppercase tracking-wider mb-1"><MapPin size={14}/> Nomor Rumah</label>
                <p className="font-medium text-navy-900 font-mono bg-ivory-100 px-2 py-0.5 rounded w-fit">{profil.nomor_rumah || '-'}</p>
              </div>
              <div>
                <label className="flex items-center gap-2 text-xs font-bold text-navy-400 uppercase tracking-wider mb-1"><Calendar size={14}/> TTL</label>
                <p className="font-medium text-navy-900">{profil.tempat_lahir || '-'}, {profil.tanggal_lahir ? new Date(profil.tanggal_lahir).toLocaleDateString('id-ID') : '-'}</p>
              </div>
              <div>
                <label className="flex items-center gap-2 text-xs font-bold text-navy-400 uppercase tracking-wider mb-1"><User size={14}/> Pekerjaan</label>
                <p className="font-medium text-navy-900">{profil.pekerjaan || '-'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Daftar Keluarga & Action */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white border border-ivory-300 rounded-2xl shadow-sm p-6 flex flex-col h-full">
            <h3 className="text-lg font-extrabold text-navy-900 flex items-center gap-2 mb-5">
              <Users className="text-gold" size={20} /> Anggota Keluarga
            </h3>
            
            <div className="flex-1 space-y-3 mb-5">
              {keluarga.length > 0 ? (
                keluarga.map((k) => {
                  const butuhPerhatian = !k.user_id || !k.is_completed;
                  return (
                    <div key={k.id} className="p-4 bg-ivory-50 border border-ivory-200 rounded-xl group relative">
                      <div className="pr-20"> 
                        <p className="font-bold text-navy-900 text-sm leading-tight truncate">{k.nama_lengkap}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-[10px] font-extrabold text-navy-400 uppercase tracking-wider">{k.status_hubungan}</span>
                          <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md uppercase tracking-wider border ${!butuhPerhatian ? 'bg-green-100 text-green-700 border-green-200' : 'bg-amber-100 text-amber-700 border-amber-200'}`}>
                            {!butuhPerhatian ? 'Aktif' : (!k.user_id ? 'Belum Login' : 'Data Belum Lengkap')}
                          </span>
                        </div>
                      </div>
                      
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                        {k.no_wa && (
                          <a 
                            href={generateWALink(k)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"
                            title={butuhPerhatian ? "Kirim Link Pendaftaran via WA" : "Hubungi via WA"}
                          >
                            <MessageCircle size={16} />
                          </a>
                        )}
                        <button onClick={() => openEditKeluarga(k)} className="p-1.5 text-navy-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors">
                          <Edit2 size={14} />
                        </button>
                        {!k.user_id && (
                          <button onClick={() => handleDeleteKeluarga(k.id, k.nama_lengkap)} className="p-1.5 text-navy-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors">
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 bg-ivory-50 border border-dashed border-ivory-300 rounded-xl">
                  <p className="text-sm font-medium text-navy-400">Tidak ada tanggungan.</p>
                </div>
              )}
            </div>
            <button 
              onClick={openTambahKeluarga}
              className="w-full py-3 border-2 border-dashed border-ivory-300 text-navy-600 rounded-xl font-bold text-sm hover:bg-ivory-50 transition-colors flex justify-center items-center gap-2"
            >
              <Plus size={18} /> Tambah Anggota
            </button>
          </div>

          <div className="flex flex-col gap-3">
            <button 
              onClick={() => setIsEditModalOpen(true)} 
              className="w-full py-3.5 bg-navy-900 text-ivory-50 font-bold rounded-xl hover:bg-navy-800 transition-all flex justify-center items-center gap-2 shadow-md"
            >
              <Edit3 size={18} /> Ajukan Perubahan Profil
            </button>
            <button 
              onClick={handleLogout}
              className="w-full py-3.5 bg-red-50 text-red-600 border border-red-200 font-bold rounded-xl hover:bg-red-600 hover:text-white transition-all flex justify-center items-center gap-2 group"
            >
              <LogOut size={18} className="group-hover:rotate-12 transition-transform" /> 
              Keluar dari Sistem
            </button>
          </div>
        </div>
      </div>

      {/* MODAL 1: PERBARUI DATA UTAMA (LENGKAP) */}
      <AnimatePresence>
        {isEditModalOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsEditModalOpen(false)} className="fixed inset-0 bg-navy-900/60 backdrop-blur-sm z-50" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-white rounded-3xl shadow-2xl z-50 flex flex-col max-h-[90vh]">
              <div className="px-6 py-5 border-b border-ivory-200 flex justify-between items-center bg-ivory-50 rounded-t-3xl shrink-0">
                  <h3 className="font-extrabold text-navy-900 flex items-center gap-2"><Edit3 size={18} className="text-gold" /> Perbarui Data Diri</h3>
                  <button onClick={() => setIsEditModalOpen(false)} className="p-1.5 bg-white rounded-full hover:bg-ivory-200 transition text-navy-400 shadow-sm border border-ivory-200"><X size={18} /></button>
              </div>
              <div className="p-6 overflow-y-auto">
                <p className="text-sm text-navy-500 mb-6 leading-relaxed">Ajukan perubahan biodata lengkap Anda. Data baru akan ditinjau Admin RT sebelum diterapkan secara permanen.</p>
                
                {draftStatus.show && (
                  <div className={`mb-6 p-4 rounded-xl flex items-start gap-3 text-sm font-medium ${draftStatus.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
                    {draftStatus.type === 'success' ? <CheckCircle2 size={20} className="shrink-0 mt-0.5" /> : <X size={20} className="shrink-0 mt-0.5" />}
                    {draftStatus.message}
                  </div>
                )}

                <form onSubmit={handleUpdateDataUtama} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-navy-500 uppercase tracking-wider mb-1.5">Nama Lengkap</label>
                      <input type="text" required value={updateForm.nama_lengkap} onChange={e => setUpdateForm({...updateForm, nama_lengkap: e.target.value})} className="w-full px-4 py-3 bg-ivory-50 border border-ivory-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-navy-900 font-medium" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-navy-500 uppercase tracking-wider mb-1.5">Nomor WhatsApp</label>
                      <input type="text" value={updateForm.no_wa} onChange={e => setUpdateForm({...updateForm, no_wa: e.target.value})} className="w-full px-4 py-3 bg-ivory-50 border border-ivory-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-navy-900 font-medium" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-navy-500 uppercase tracking-wider mb-1.5">NIK</label>
                      <input type="number" value={updateForm.nik} onChange={e => setUpdateForm({...updateForm, nik: e.target.value})} className="w-full px-4 py-3 bg-ivory-50 border border-ivory-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-navy-900 font-medium" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-navy-500 uppercase tracking-wider mb-1.5">Agama</label>
                      <select value={updateForm.agama} onChange={e => setUpdateForm({...updateForm, agama: e.target.value})} className="w-full px-4 py-3 bg-ivory-50 border border-ivory-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-navy-900 font-medium appearance-none">
                        <option value="Islam">Islam</option><option value="Kristen">Kristen</option><option value="Katolik">Katolik</option><option value="Hindu">Hindu</option><option value="Buddha">Buddha</option><option value="Konghucu">Konghucu</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-navy-500 uppercase tracking-wider mb-1.5">Tempat Lahir</label>
                      <input type="text" value={updateForm.tempat_lahir} onChange={e => setUpdateForm({...updateForm, tempat_lahir: e.target.value})} className="w-full px-4 py-3 bg-ivory-50 border border-ivory-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-navy-900 font-medium" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-navy-500 uppercase tracking-wider mb-1.5">Tanggal Lahir</label>
                      <input type="date" value={updateForm.tanggal_lahir} onChange={e => setUpdateForm({...updateForm, tanggal_lahir: e.target.value})} className="w-full px-4 py-3 bg-ivory-50 border border-ivory-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-navy-900 font-medium" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-navy-500 uppercase tracking-wider mb-1.5">Pekerjaan</label>
                      <input type="text" value={updateForm.pekerjaan} onChange={e => setUpdateForm({...updateForm, pekerjaan: e.target.value})} className="w-full px-4 py-3 bg-ivory-50 border border-ivory-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-navy-900 font-medium" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-navy-500 uppercase tracking-wider mb-1.5">Status Tinggal</label>
                      <select value={updateForm.status_tinggal} onChange={e => setUpdateForm({...updateForm, status_tinggal: e.target.value})} className="w-full px-4 py-3 bg-ivory-50 border border-ivory-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-navy-900 font-medium appearance-none">
                        <option value="Tetap">Warga Tetap</option>
                        <option value="Kontrak">Kontrak / Kos</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-ivory-100 mt-2">
                    <label className="block text-xs font-bold text-red-600 uppercase tracking-wider mb-1.5">Kata Sandi Saat Ini *</label>
                    <div className="relative">
                      <input type={showPassword ? 'text' : 'password'} required value={updateForm.password} onChange={e => setUpdateForm({...updateForm, password: e.target.value})} placeholder="Verifikasi identitas untuk melanjutkan" className="w-full px-4 py-3 bg-white border border-red-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none text-navy-900 font-medium pr-12 shadow-sm" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-navy-300 hover:text-navy-600 transition-colors">
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>
                  <div className="pt-2">
                    <button type="submit" disabled={isSubmitting} className="w-full py-3.5 bg-navy-900 text-white font-bold rounded-xl hover:bg-navy-800 transition flex justify-center gap-2 shadow-md disabled:opacity-70">
                      {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Edit3 size={18} />} Kirim Pengajuan Data
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* MODAL 2: MANAJEMEN KELUARGA DIRECT */}
      <AnimatePresence>
        {isKeluargaModalOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsKeluargaModalOpen(false)} className="fixed inset-0 bg-navy-900/60 backdrop-blur-sm z-50" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-3xl shadow-2xl z-50 flex flex-col max-h-[90vh]">
              <div className="px-6 py-5 border-b border-ivory-200 flex justify-between items-center bg-ivory-50 rounded-t-3xl shrink-0">
                  <h3 className="font-extrabold text-navy-900 flex items-center gap-2">
                    {keluargaMode === 'tambah' ? <><Plus size={18} className="text-gold" /> Tambah Anggota</> : <><Edit2 size={18} className="text-gold" /> Edit Anggota</>}
                  </h3>
                  <button onClick={() => setIsKeluargaModalOpen(false)} className="p-1.5 bg-white rounded-full hover:bg-ivory-200 transition text-navy-400 shadow-sm border border-ivory-200"><X size={18} /></button>
              </div>
              <div className="p-6 overflow-y-auto">
                <form onSubmit={handleSaveKeluarga} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-navy-500 uppercase tracking-wider mb-1.5">Nama Lengkap</label>
                    <input type="text" required value={keluargaForm.nama_lengkap} onChange={e => setKeluargaForm({...keluargaForm, nama_lengkap: e.target.value})} className="w-full px-4 py-3 bg-ivory-50 border border-ivory-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-navy-900 font-medium" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-navy-500 uppercase tracking-wider mb-1.5">Status Hubungan</label>
                    <select value={keluargaForm.status_hubungan} onChange={e => setKeluargaForm({...keluargaForm, status_hubungan: e.target.value})} className="w-full px-4 py-3 bg-ivory-50 border border-ivory-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-navy-900 font-medium appearance-none">
                      <option value="Istri">Istri</option>
                      <option value="Suami">Suami</option>
                      <option value="Anak">Anak</option>
                      <option value="Mertua">Mertua</option>
                      <option value="Lainnya">Lainnya</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-navy-500 uppercase tracking-wider mb-1.5">NIK (Opsional)</label>
                      <input type="number" value={keluargaForm.nik} onChange={e => setKeluargaForm({...keluargaForm, nik: e.target.value})} className="w-full px-4 py-3 bg-ivory-50 border border-ivory-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-navy-900 font-medium" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-navy-500 uppercase tracking-wider mb-1.5">No WhatsApp (Opsional)</label>
                      <input type="number" placeholder="628..." value={keluargaForm.no_wa} onChange={e => setKeluargaForm({...keluargaForm, no_wa: e.target.value})} className="w-full px-4 py-3 bg-ivory-50 border border-ivory-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-navy-900 font-medium" />
                    </div>
                  </div>
                  <div className="pt-4 border-t border-ivory-100">
                    <button type="submit" disabled={isSubmitting} className="w-full py-3.5 bg-navy-900 text-white font-bold rounded-xl hover:bg-navy-800 transition flex justify-center gap-2 shadow-md disabled:opacity-70">
                      {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <SaveIcon />} Simpan Data
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

const SaveIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
);