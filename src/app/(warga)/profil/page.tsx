'use client';

import { useState, useEffect } from 'react';
import { Loader2, User, Users, MapPin, CreditCard, Phone, Calendar, Edit3, LogOut, CheckCircle2, X, Plus, Trash2, Edit2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getProfilWarga, ajukanPerubahanData, tambahKeluarga, editKeluarga, hapusKeluarga } from '../../actions/profil';
import { logoutUser } from '../../actions/auth';

export default function ProfilPage() {
  const [profil, setProfil] = useState<any>(null);
  const [keluarga, setKeluarga] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // State Modal Perbarui Data Utama
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [draftStatus, setDraftStatus] = useState<{ show: boolean, message: string }>({ show: false, message: '' });
  const [updateForm, setUpdateForm] = useState({
    nama_lengkap: '', no_wa: '', pekerjaan: '', status_tinggal: ''
  });

  // State Modal Manajemen Keluarga
  const [isKeluargaModalOpen, setIsKeluargaModalOpen] = useState(false);
  const [keluargaMode, setKeluargaMode] = useState<'tambah' | 'edit'>('tambah');
  const [keluargaForm, setKeluargaForm] = useState({ id: '', nama_lengkap: '', status_hubungan: 'Anak', nik: '' });

  const fetchData = async () => {
    try {
      const data = await getProfilWarga();
      if (data.profil) {
        setProfil(data.profil);
        setKeluarga(data.keluarga);
        setUpdateForm({
          nama_lengkap: data.profil.nama_lengkap,
          no_wa: data.profil.no_wa || '',
          pekerjaan: data.profil.pekerjaan || '',
          status_tinggal: data.profil.status_tinggal || 'Tetap'
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

  // --- HANDLERS ---
  const handleUpdateDataUtama = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await ajukanPerubahanData(updateForm);
      setDraftStatus({ show: true, message: 'Pengajuan perubahan data berhasil dikirim ke Admin.' });
      setTimeout(() => {
        setDraftStatus({ show: false, message: '' });
        setIsEditModalOpen(false);
      }, 3000);
    } catch (error) {
      alert('Gagal mengirim pengajuan. Coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openTambahKeluarga = () => {
    setKeluargaMode('tambah');
    setKeluargaForm({ id: '', nama_lengkap: '', status_hubungan: 'Anak', nik: '' });
    setIsKeluargaModalOpen(true);
  };

  const openEditKeluarga = (k: any) => {
    setKeluargaMode('edit');
    setKeluargaForm({ id: k.id, nama_lengkap: k.nama_lengkap, status_hubungan: k.status_hubungan, nik: k.nik || '' });
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
      await fetchData(); // Refresh data real-time
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
    localStorage.clear();
    sessionStorage.clear();
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
                keluarga.map((k) => (
                  <div key={k.id} className="p-4 bg-ivory-50 border border-ivory-200 rounded-xl group relative">
                    <div className="pr-12">
                      <p className="font-bold text-navy-900 text-sm leading-tight truncate">{k.nama_lengkap}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[10px] font-extrabold text-navy-400 uppercase tracking-wider">{k.status_hubungan}</span>
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md uppercase tracking-wider border ${k.user_id ? 'bg-green-100 text-green-700 border-green-200' : 'bg-amber-100 text-amber-700 border-amber-200'}`}>
                          {k.user_id ? 'Aktif' : 'Belum Login'}
                        </span>
                      </div>
                    </div>
                    
                    {/* Action Buttons (Absolute right) */}
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
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
                ))
              ) : (
                <div className="text-center py-8 bg-ivory-50 border border-dashed border-ivory-300 rounded-xl">
                  <p className="text-sm font-medium text-navy-400">Tidak ada tanggungan.</p>
                </div>
              )}
            </div>

            {/* Tombol Tambah Anggota */}
            <button 
              onClick={openTambahKeluarga}
              className="w-full py-3 border-2 border-dashed border-ivory-300 text-navy-600 rounded-xl font-bold text-sm hover:bg-ivory-50 transition-colors flex justify-center items-center gap-2"
            >
              <Plus size={18} /> Tambah Anggota
            </button>
          </div>

          {/* ACTION BUTTONS: Perbarui Data Utama & Logout */}
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

      {/* MODAL 1: PERBARUI DATA UTAMA (DRAFT) */}
      <AnimatePresence>
        {isEditModalOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsEditModalOpen(false)} className="fixed inset-0 bg-navy-900/60 backdrop-blur-sm z-50" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-3xl shadow-2xl z-50 flex flex-col max-h-[90vh]">
              <div className="px-6 py-5 border-b border-ivory-200 flex justify-between items-center bg-ivory-50 rounded-t-3xl shrink-0">
                  <h3 className="font-extrabold text-navy-900 flex items-center gap-2"><Edit3 size={18} className="text-gold" /> Perbarui Data</h3>
                  <button onClick={() => setIsEditModalOpen(false)} className="p-1.5 bg-white rounded-full hover:bg-ivory-200 transition text-navy-400 shadow-sm border border-ivory-200"><X size={18} /></button>
              </div>
              <div className="p-6 overflow-y-auto">
                <p className="text-sm text-navy-500 mb-6 leading-relaxed">Data baru yang Anda kirim akan ditinjau terlebih dahulu oleh Admin RT sebelum diubah secara permanen.</p>
                {draftStatus.show && (
                  <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl flex items-start gap-3 text-sm font-medium">
                    <CheckCircle2 size={20} className="shrink-0 mt-0.5" />{draftStatus.message}
                  </div>
                )}
                <form onSubmit={handleUpdateDataUtama} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-navy-500 uppercase tracking-wider mb-1.5">Nama Lengkap (Sesuai KTP)</label>
                    <input type="text" required value={updateForm.nama_lengkap} onChange={e => setUpdateForm({...updateForm, nama_lengkap: e.target.value})} className="w-full px-4 py-3 bg-ivory-50 border border-ivory-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-navy-900 font-medium" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-navy-500 uppercase tracking-wider mb-1.5">Nomor WhatsApp Baru</label>
                    <input type="text" value={updateForm.no_wa} onChange={e => setUpdateForm({...updateForm, no_wa: e.target.value})} className="w-full px-4 py-3 bg-ivory-50 border border-ivory-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-navy-900 font-medium" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-navy-500 uppercase tracking-wider mb-1.5">Pekerjaan</label>
                    <input type="text" value={updateForm.pekerjaan} onChange={e => setUpdateForm({...updateForm, pekerjaan: e.target.value})} className="w-full px-4 py-3 bg-ivory-50 border border-ivory-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-navy-900 font-medium" />
                  </div>
                  <div className="pt-4 border-t border-ivory-100">
                    <button type="submit" disabled={isSubmitting} className="w-full py-3.5 bg-navy-900 text-white font-bold rounded-xl hover:bg-navy-800 transition flex justify-center gap-2 shadow-md disabled:opacity-70">
                      {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Edit3 size={18} />} Kirim Pengajuan
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
                  <div>
                    <label className="block text-xs font-bold text-navy-500 uppercase tracking-wider mb-1.5">NIK (Opsional)</label>
                    <input type="number" value={keluargaForm.nik} onChange={e => setKeluargaForm({...keluargaForm, nik: e.target.value})} className="w-full px-4 py-3 bg-ivory-50 border border-ivory-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-navy-900 font-medium" />
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