'use client';

import { useState, useEffect } from 'react';
import { Loader2, User, Users, MapPin, CreditCard, Phone, Calendar, Edit3, LogOut, CheckCircle2, X, Plus, Trash2, Edit2, MessageCircle, Eye, EyeOff, ShieldAlert } from 'lucide-react';
import PageHeader from '@/components/warga/PageHeader';
import { getProfilWarga, ajukanPerubahanData, tambahKeluarga, editKeluarga, hapusKeluarga } from '../../actions/profil';
import { logoutUser, verifyRoleSwitch } from '../../actions/auth';

export default function ProfilPage() {
  const [profil, setProfil] = useState<any>(null);
  const [keluarga, setKeluarga] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [draftStatus, setDraftStatus] = useState<{ show: boolean, message: string, type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });
  
  const [updateForm, setUpdateForm] = useState({
    nama_lengkap: '', no_wa: '', pekerjaan: '', status_tinggal: '', 
    nik: '', tempat_lahir: '', tanggal_lahir: '', agama: '', status_perkawinan: '', password: ''
  });
  const [showPassword, setShowPassword] = useState(false);

  const [isKeluargaModalOpen, setIsKeluargaModalOpen] = useState(false);
  const [keluargaMode, setKeluargaMode] = useState<'tambah' | 'edit'>('tambah');
  const [keluargaForm, setKeluargaForm] = useState({ id: '', nama_lengkap: '', status_hubungan: 'Anak', nik: '', no_wa: '' });

  const [isAdminSwitchOpen, setIsAdminSwitchOpen] = useState(false);
  const [switchPassword, setSwitchPassword] = useState('');
  const [showSwitchPassword, setShowSwitchPassword] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const [switchError, setSwitchError] = useState('');

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
          status_perkawinan: data.profil.status_perkawinan || 'Belum Kawin',
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
        tanggal_lahir: updateForm.tanggal_lahir || null,
        agama: updateForm.agama,
        status_perkawinan: updateForm.status_perkawinan
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
    <div className="space-y-6 pb-24 md:pb-8">
      <PageHeader
        title="Profil Warga"
        description="Kelola data kependudukan Anda dan anggota keluarga di satu tempat."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-surface border border-navy-100 rounded-2xl shadow-card overflow-hidden">
            <div className="relative bg-gradient-to-br from-navy-800 via-navy-900 to-navy-900 p-6 md:p-8 text-white">
              <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, #f5b301 0, transparent 45%)' }} />
              <div className="relative flex items-center gap-4 md:gap-5">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-accent text-navy-900 flex items-center justify-center shrink-0 ring-4 ring-white/10 shadow-pop">
                  <User size={34} />
                </div>
                <div className="min-w-0">
                  <h2 className="font-display text-xl md:text-2xl font-bold tracking-tight leading-tight">{profil.nama_lengkap || 'Warga'}</h2>
                  <span className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full bg-accent/15 border border-accent/30 text-accent text-xs font-semibold uppercase tracking-wide">
                    {profil.status_hubungan || 'Warga'}
                  </span>
                </div>
              </div>
            </div>
            <div className="p-6 md:p-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-navy-50/60 border border-navy-100">
                <span className="w-9 h-9 rounded-lg bg-white border border-navy-100 text-navy-600 flex items-center justify-center shrink-0"><CreditCard size={16} /></span>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-navy-400 uppercase tracking-wide">NIK</p>
                  <p className="font-semibold text-navy-900 truncate">{profil.nik || '-'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-navy-50/60 border border-navy-100">
                <span className="w-9 h-9 rounded-lg bg-white border border-navy-100 text-navy-600 flex items-center justify-center shrink-0"><Users size={16} /></span>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-navy-400 uppercase tracking-wide">Nomor KK</p>
                  <p className="font-semibold text-navy-900 truncate">{profil.no_kk || '-'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-navy-50/60 border border-navy-100">
                <span className="w-9 h-9 rounded-lg bg-white border border-navy-100 text-navy-600 flex items-center justify-center shrink-0"><Phone size={16} /></span>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-navy-400 uppercase tracking-wide">WhatsApp</p>
                  <p className="font-semibold text-navy-900 truncate">{profil.no_wa || '-'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-navy-50/60 border border-navy-100">
                <span className="w-9 h-9 rounded-lg bg-white border border-navy-100 text-navy-600 flex items-center justify-center shrink-0"><MapPin size={16} /></span>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-navy-400 uppercase tracking-wide">Nomor Rumah</p>
                  <p className="font-semibold text-navy-900 font-mono truncate">{profil.nomor_rumah || '-'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-navy-50/60 border border-navy-100">
                <span className="w-9 h-9 rounded-lg bg-white border border-navy-100 text-navy-600 flex items-center justify-center shrink-0"><Calendar size={16} /></span>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-navy-400 uppercase tracking-wide">Tempat, Tgl Lahir</p>
                  <p className="font-semibold text-navy-900 truncate">{profil.tempat_lahir || '-'}, {profil.tanggal_lahir ? new Date(profil.tanggal_lahir).toLocaleDateString('id-ID') : '-'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-navy-50/60 border border-navy-100">
                <span className="w-9 h-9 rounded-lg bg-white border border-navy-100 text-navy-600 flex items-center justify-center shrink-0"><User size={16} /></span>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-navy-400 uppercase tracking-wide">Status Perkawinan</p>
                  <p className="font-semibold text-navy-900 truncate">{profil.status_perkawinan || '-'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-navy-50/60 border border-navy-100">
                <span className="w-9 h-9 rounded-lg bg-white border border-navy-100 text-navy-600 flex items-center justify-center shrink-0"><User size={16} /></span>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-navy-400 uppercase tracking-wide">Pekerjaan</p>
                  <p className="font-semibold text-navy-900 truncate">{profil.pekerjaan || '-'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <div className="bg-surface border border-navy-100 rounded-2xl shadow-card p-6 flex flex-col h-full">
            <h3 className="text-lg font-semibold text-navy-900 flex items-center gap-2 mb-5">
              <Users className="text-accent" size={20} /> Anggota Keluarga
            </h3>
            
            <div className="flex-1 space-y-3 mb-5">
              {keluarga.length > 0 ? (
                keluarga.map((k) => {
                  const butuhPerhatian = !k.user_id || !k.is_completed;
                  return (
                    <div key={k.id} className="p-4 bg-white border border-navy-100 rounded-xl shadow-card hover:border-navy-200 transition-colors flex items-center gap-3 group">
                      <div className="w-11 h-11 rounded-full bg-navy-900 text-accent flex items-center justify-center shrink-0 font-display font-bold text-sm">
                        {k.nama_lengkap?.trim().charAt(0).toUpperCase() || '?'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-navy-900 text-sm leading-tight truncate">{k.nama_lengkap}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-[11px] font-semibold text-navy-400 uppercase tracking-wide">{k.status_hubungan}</span>
                          <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full uppercase tracking-wide border ${!butuhPerhatian ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-orange-50 text-orange-700 border-orange-200'}`}>
                            {!butuhPerhatian ? 'Aktif' : (!k.user_id ? 'Belum Login' : 'Belum Lengkap')}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {k.no_wa && (
                          <a
                            href={generateWALink(k)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            title={butuhPerhatian ? "Kirim Link Pendaftaran via WA" : "Hubungi via WA"}
                          >
                            <MessageCircle size={18} />
                          </a>
                        )}
                        <button onClick={() => openEditKeluarga(k)} className="p-2 text-navy-400 hover:text-navy-700 hover:bg-navy-100 rounded-lg transition-colors">
                          <Edit2 size={18} />
                        </button>
                        {!k.user_id && (
                          <button onClick={() => handleDeleteKeluarga(k.id, k.nama_lengkap)} className="p-2 text-navy-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 bg-navy-50 border border-dashed border-navy-200 rounded-lg">
                  <p className="text-sm font-medium text-navy-400">Tidak ada tanggungan.</p>
                </div>
              )}
            </div>
            <button 
              onClick={openTambahKeluarga}
              className="w-full py-3 border-2 border-dashed border-navy-200 text-navy-600 rounded-lg font-semibold text-sm hover:bg-navy-50 transition-colors flex justify-center items-center gap-2"
            >
              <Plus size={18} /> Tambah Anggota
            </button>
          </div>

          <div className="bg-surface border border-navy-100 rounded-2xl shadow-card p-6">
            <h3 className="text-sm font-bold text-navy-400 uppercase tracking-wide mb-4">Akun & Aksi</h3>
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => setIsEditModalOpen(true)} 
                className="w-full py-3 bg-navy-900 text-white font-semibold rounded-xl hover:bg-navy-800 transition-colors flex justify-center items-center gap-2 shadow-card"
              >
                <Edit3 size={18} /> Ajukan Perubahan Profil
              </button>
              {profil?.users?.role === 'admin' && (
                <button 
                  onClick={() => setIsAdminSwitchOpen(true)}
                  className="w-full py-3 bg-accent text-navy-900 font-semibold rounded-xl hover:bg-accent/90 transition-colors flex justify-center items-center gap-2"
                >
                  <ShieldAlert size={18} /> Buka Mode Admin
                </button>
              )}
              <button 
                onClick={handleLogout}
                className="w-full py-3 bg-white text-red-600 border border-red-200 font-semibold rounded-xl hover:bg-red-50 hover:border-red-300 transition-colors flex justify-center items-center gap-2"
              >
                <LogOut size={18} /> Keluar dari Sistem
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL 1: PERBARUI DATA UTAMA */}
      {isEditModalOpen && (
        <>
          <div onClick={() => setIsEditModalOpen(false)} className="fixed inset-0 bg-navy-900/60 z-50" />
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-surface rounded-xl shadow-card border border-navy-100 z-50 flex flex-col max-h-[90vh]">
            <div className="px-6 py-5 border-b border-navy-100 flex justify-between items-center shrink-0">
                <h3 className="font-semibold text-navy-900 flex items-center gap-2"><Edit3 size={18} className="text-accent" /> Perbarui Data Diri</h3>
                <button onClick={() => setIsEditModalOpen(false)} className="p-1.5 bg-white rounded-md hover:bg-navy-50 transition text-navy-400 border border-navy-200"><X size={18} /></button>
            </div>
            <div className="p-6 overflow-y-auto">
              <p className="text-sm text-navy-500 mb-6 leading-relaxed">Ajukan perubahan biodata lengkap Anda. Data baru akan ditinjau Admin RT sebelum diterapkan secara permanen.</p>
              
              {draftStatus.show && (
                <div className={`mb-6 p-4 rounded-lg flex items-start gap-3 text-sm font-medium ${draftStatus.type === 'success' ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
                  {draftStatus.type === 'success' ? <CheckCircle2 size={20} className="shrink-0 mt-0.5" /> : <X size={20} className="shrink-0 mt-0.5" />}
                  {draftStatus.message}
                </div>
              )}

              <form onSubmit={handleUpdateDataUtama} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-navy-600 uppercase tracking-wide mb-1.5">Nama Lengkap</label>
                    <input type="text" required value={updateForm.nama_lengkap} onChange={e => setUpdateForm({...updateForm, nama_lengkap: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-navy-200 rounded-lg focus:ring-2 focus:ring-accent outline-none text-navy-900 font-medium" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-navy-600 uppercase tracking-wide mb-1.5">Nomor WhatsApp</label>
                    <input type="text" value={updateForm.no_wa} onChange={e => setUpdateForm({...updateForm, no_wa: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-navy-200 rounded-lg focus:ring-2 focus:ring-accent outline-none text-navy-900 font-medium" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-navy-600 uppercase tracking-wide mb-1.5">NIK</label>
                    <input type="number" value={updateForm.nik} onChange={e => setUpdateForm({...updateForm, nik: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-navy-200 rounded-lg focus:ring-2 focus:ring-accent outline-none text-navy-900 font-medium" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-navy-600 uppercase tracking-wide mb-1.5">Agama</label>
                    <select value={updateForm.agama} onChange={e => setUpdateForm({...updateForm, agama: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-navy-200 rounded-lg focus:ring-2 focus:ring-accent outline-none text-navy-900 font-medium appearance-none">
                      <option value="Islam">Islam</option><option value="Kristen">Kristen</option><option value="Katolik">Katolik</option><option value="Hindu">Hindu</option><option value="Buddha">Buddha</option><option value="Konghucu">Konghucu</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-navy-600 uppercase tracking-wide mb-1.5">Status Perkawinan</label>
                    <select value={updateForm.status_perkawinan} onChange={e => setUpdateForm({...updateForm, status_perkawinan: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-navy-200 rounded-lg focus:ring-2 focus:ring-accent outline-none text-navy-900 font-medium appearance-none">
                      <option value="Belum Kawin">Belum Kawin</option>
                      <option value="Kawin">Kawin</option>
                      <option value="Cerai Hidup">Cerai Hidup</option>
                      <option value="Cerai Mati">Cerai Mati</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-navy-600 uppercase tracking-wide mb-1.5">Tempat Lahir</label>
                    <input type="text" value={updateForm.tempat_lahir} onChange={e => setUpdateForm({...updateForm, tempat_lahir: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-navy-200 rounded-lg focus:ring-2 focus:ring-accent outline-none text-navy-900 font-medium" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-navy-600 uppercase tracking-wide mb-1.5">Tanggal Lahir</label>
                    <input type="date" value={updateForm.tanggal_lahir} onChange={e => setUpdateForm({...updateForm, tanggal_lahir: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-navy-200 rounded-lg focus:ring-2 focus:ring-accent outline-none text-navy-900 font-medium" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-navy-600 uppercase tracking-wide mb-1.5">Pekerjaan</label>
                    <input type="text" value={updateForm.pekerjaan} onChange={e => setUpdateForm({...updateForm, pekerjaan: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-navy-200 rounded-lg focus:ring-2 focus:ring-accent outline-none text-navy-900 font-medium" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-navy-600 uppercase tracking-wide mb-1.5">Status Tinggal</label>
                    <select value={updateForm.status_tinggal} onChange={e => setUpdateForm({...updateForm, status_tinggal: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-navy-200 rounded-lg focus:ring-2 focus:ring-accent outline-none text-navy-900 font-medium appearance-none">
                      <option value="Tetap">Warga Tetap</option>
                      <option value="Kontrak">Kontrak / Kos</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 border-t border-navy-100 mt-2">
                  <label className="block text-xs font-semibold text-red-600 uppercase tracking-wide mb-1.5">Kata Sandi Saat Ini *</label>
                  <div className="relative">
                    <input type={showPassword ? 'text' : 'password'} required value={updateForm.password} onChange={e => setUpdateForm({...updateForm, password: e.target.value})} placeholder="Verifikasi identitas untuk melanjutkan" className="w-full px-4 py-2.5 bg-white border border-red-200 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-navy-900 font-medium pr-12" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-navy-300 hover:text-navy-600 transition-colors">
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>
                <div className="pt-2">
                  <button type="submit" disabled={isSubmitting} className="w-full py-3 bg-navy-900 text-white font-semibold rounded-lg hover:bg-navy-800 transition flex justify-center gap-2 disabled:opacity-70">
                    {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Edit3 size={18} />} Kirim Pengajuan Data
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}

      {/* MODAL 2: MANAJEMEN KELUARGA */}
      {isKeluargaModalOpen && (
        <>
          <div onClick={() => setIsKeluargaModalOpen(false)} className="fixed inset-0 bg-navy-900/60 z-50" />
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-surface rounded-xl shadow-card border border-navy-100 z-50 flex flex-col max-h-[90vh]">
            <div className="px-6 py-5 border-b border-navy-100 flex justify-between items-center shrink-0">
              <h3 className="font-semibold text-navy-900 flex items-center gap-2">
                {keluargaMode === 'tambah' ? <><Plus size={18} className="text-accent" /> Tambah Anggota</> : <><Edit2 size={18} className="text-accent" /> Edit Anggota</>}
              </h3>
              <button onClick={() => setIsKeluargaModalOpen(false)} className="p-1.5 bg-white rounded-md hover:bg-navy-50 transition text-navy-400 border border-navy-200"><X size={18} /></button>
            </div>
            <div className="p-6 overflow-y-auto">
              <form onSubmit={handleSaveKeluarga} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-navy-600 uppercase tracking-wide mb-1.5">Nama Lengkap</label>
                  <input type="text" required value={keluargaForm.nama_lengkap} onChange={e => setKeluargaForm({...keluargaForm, nama_lengkap: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-navy-200 rounded-lg focus:ring-2 focus:ring-accent outline-none text-navy-900 font-medium" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-navy-600 uppercase tracking-wide mb-1.5">Status Hubungan</label>
                  <select value={keluargaForm.status_hubungan} onChange={e => setKeluargaForm({...keluargaForm, status_hubungan: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-navy-200 rounded-lg focus:ring-2 focus:ring-accent outline-none text-navy-900 font-medium appearance-none">
                    <option value="Istri">Istri</option>
                    <option value="Suami">Suami</option>
                    <option value="Anak">Anak</option>
                    <option value="Mertua">Mertua</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-navy-600 uppercase tracking-wide mb-1.5">NIK (Opsional)</label>
                    <input type="number" value={keluargaForm.nik} onChange={e => setKeluargaForm({...keluargaForm, nik: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-navy-200 rounded-lg focus:ring-2 focus:ring-accent outline-none text-navy-900 font-medium" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-navy-600 uppercase tracking-wide mb-1.5">No WhatsApp (Opsional)</label>
                    <input type="number" placeholder="628..." value={keluargaForm.no_wa} onChange={e => setKeluargaForm({...keluargaForm, no_wa: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-navy-200 rounded-lg focus:ring-2 focus:ring-accent outline-none text-navy-900 font-medium" />
                  </div>
                </div>
                <div className="pt-4 border-t border-navy-100">
                  <button type="submit" disabled={isSubmitting} className="w-full py-3 bg-navy-900 text-white font-semibold rounded-lg hover:bg-navy-800 transition flex justify-center gap-2 disabled:opacity-70">
                    {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <SaveIcon />} Simpan Data
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}

      {/* MODAL SWITCH KE ADMIN */}
      {isAdminSwitchOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setIsAdminSwitchOpen(false)} className="absolute inset-0 bg-navy-900/60" />
          <div className="relative w-full max-w-sm bg-surface rounded-xl shadow-card border border-navy-100 flex flex-col overflow-hidden">
            <div className="px-6 py-5 border-b border-navy-100 flex justify-between items-center">
                <h3 className="font-semibold text-navy-900 flex items-center gap-2"><ShieldAlert size={18} className="text-accent"/> Otorisasi Admin</h3>
                <button onClick={() => setIsAdminSwitchOpen(false)} className="p-1.5 bg-white rounded-md text-navy-400 border border-navy-200"><X size={18} /></button>
            </div>
            <div className="p-6">
              <p className="text-sm text-navy-500 mb-5 leading-relaxed">Masukkan kata sandi untuk kembali ke Dasbor Admin.</p>
              {switchError && <p className="mb-4 text-xs font-semibold text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">{switchError}</p>}
              <form onSubmit={async (e) => {
                e.preventDefault();
                setIsSwitching(true);
                setSwitchError('');
                try {
                  await verifyRoleSwitch(switchPassword);
                  window.location.href = '/admin';
                } catch (err: any) {
                  setSwitchError(err.message);
                } finally {
                  setIsSwitching(false);
                }
              }} className="space-y-4">
                <div className="relative">
                  <input type={showSwitchPassword ? 'text' : 'password'} required value={switchPassword} onChange={e => setSwitchPassword(e.target.value)} placeholder="Kata Sandi..." className="w-full px-4 py-2.5 bg-white border border-navy-200 rounded-lg outline-none text-navy-900 font-medium pr-12" />
                  <button type="button" onClick={() => setShowSwitchPassword(!showSwitchPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-navy-300 hover:text-navy-600"><Eye size={20} /></button>
                </div>
                <button type="submit" disabled={isSwitching} className="w-full py-3 bg-accent text-navy-900 font-semibold rounded-lg hover:bg-accent/90 transition flex justify-center items-center gap-2">
                  {isSwitching ? <Loader2 size={18} className="animate-spin"/> : 'Kembali ke Admin'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

const SaveIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
);
