'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '../../../../lib/supabaseClient';
import { Save, Loader2, MapPin, Building, Phone, AlertCircle, Tags, Trash2, Plus, ChevronDown, Megaphone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PengaturanPage() {
  const [isLoading, setIsLoading] = useState(true);
  
  // State Pengaturan RT
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error' | null, message: string }>({ type: null, message: '' });
  const [formData, setFormData] = useState({
    id: '', nama_rt: '', whatsapp_admin: '', nama_perumahan: '',
    jalan: '', rt_rw: '', kelurahan: '', kecamatan: '', kota: '', provinsi_kodepos: ''
  });

  // State Kategori Kas
  const [kategoriList, setKategoriList] = useState<any[]>([]);
  const [newKategori, setNewKategori] = useState({ nama: '', tipe: 'keluar' });
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // State Blast Informasi
  const [pengumumanList, setPengumumanList] = useState<any[]>([]);
  const [newPengumuman, setNewPengumuman] = useState({ pesan: '', batas_waktu: '' });
  const [isProcessingBlast, setIsProcessingBlast] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  // Handle Click Outside Dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [pengaturanRes, kategoriRes, pengumumanRes] = await Promise.all([
        supabase.from('pengaturan_rt').select('*').limit(1).single(),
        supabase.from('kategori_kas').select('*').order('tipe', { ascending: true }),
        supabase.from('pengumuman').select('*').order('created_at', { ascending: false })
      ]);

      if (pengaturanRes.data) {
        setFormData({
          id: pengaturanRes.data.id,
          nama_rt: pengaturanRes.data.nama_rt || '',
          whatsapp_admin: pengaturanRes.data.wa_admin || '',
          nama_perumahan: pengaturanRes.data.nama_perumahan || '',
          jalan: pengaturanRes.data.jalan || '',
          rt_rw: pengaturanRes.data.rt_rw || '',
          kelurahan: pengaturanRes.data.kelurahan || '',
          kecamatan: pengaturanRes.data.kecamatan || '',
          kota: pengaturanRes.data.kota || '',
          provinsi_kodepos: pengaturanRes.data.provinsi_kodepos || ''
        });
      }
      
      if (kategoriRes.data) setKategoriList(kategoriRes.data);
      if (pengumumanRes.data) setPengumumanList(pengumumanRes.data);
    } catch (error) {
      console.error('Gagal mengambil data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // --- HANDLER PENGATURAN RT ---
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveProfil = async () => {
    try {
      setIsSaving(true);
      setSaveStatus({ type: null, message: '' });
      const payload = {
        nama_rt: formData.nama_rt,
        wa_admin: formData.whatsapp_admin,
        alamat_perumahan: `${formData.nama_perumahan}, ${formData.jalan}`,
        nama_perumahan: formData.nama_perumahan,
        jalan: formData.jalan,
        rt_rw: formData.rt_rw,
        kelurahan: formData.kelurahan,
        kecamatan: formData.kecamatan,
        kota: formData.kota,
        provinsi_kodepos: formData.provinsi_kodepos
      };

      let error;
      if (formData.id) {
        const res = await supabase.from('pengaturan_rt').update(payload).eq('id', formData.id);
        error = res.error;
      } else {
        const res = await supabase.from('pengaturan_rt').insert([payload]).select().single();
        error = res.error;
        if (res.data) setFormData(prev => ({ ...prev, id: res.data.id }));
      }
      if (error) throw error;
      setSaveStatus({ type: 'success', message: 'Profil RT berhasil diperbarui.' });
      setTimeout(() => setSaveStatus({ type: null, message: '' }), 3000);
    } catch (error) {
      console.error('Gagal menyimpan:', error);
      setSaveStatus({ type: 'error', message: 'Gagal menyimpan perubahan.' });
    } finally {
      setIsSaving(false);
    }
  };

  // --- HANDLER KATEGORI KAS ---
  const handleAddKategori = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKategori.nama) return;
    try {
      await supabase.from('kategori_kas').insert([newKategori]);
      setNewKategori({ nama: '', tipe: 'keluar' });
      const { data } = await supabase.from('kategori_kas').select('*').order('tipe', { ascending: true });
      if (data) setKategoriList(data);
    } catch (error) {
      console.error('Gagal tambah kategori', error);
    }
  };

  const handleDeleteKategori = async (id: string) => {
    if (!confirm('Hapus kategori ini?')) return;
    try {
      await supabase.from('kategori_kas').delete().eq('id', id);
      setKategoriList(kategoriList.filter(k => k.id !== id));
    } catch (error) {
      console.error('Gagal hapus kategori', error);
    }
  };

  // --- HANDLER BLAST INFORMASI ---
  const handleBuatPengumuman = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessingBlast(true);
    try {
      const batasWaktuAkhirHari = new Date(`${newPengumuman.batas_waktu}T23:59:59`).toISOString();
      const { error } = await supabase.from('pengumuman').insert([{ 
        pesan: newPengumuman.pesan, 
        batas_waktu: batasWaktuAkhirHari 
      }]);
      if (error) throw error;
      
      setNewPengumuman({ pesan: '', batas_waktu: '' });
      const { data } = await supabase.from('pengumuman').select('*').order('created_at', { ascending: false });
      if (data) setPengumumanList(data);
    } catch (err) {
      console.error('Gagal blast:', err);
      alert('Gagal mengirim pengumuman.');
    } finally {
      setIsProcessingBlast(false);
    }
  };

  const handleDeletePengumuman = async (id: string) => {
    if (!confirm('Hapus pengumuman ini?')) return;
    try {
      await supabase.from('pengumuman').delete().eq('id', id);
      setPengumumanList(pengumumanList.filter(item => item.id !== id));
    } catch (err) {
      console.error('Gagal hapus blast:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[70vh]">
        <Loader2 className="animate-spin text-slate-800" size={40} />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 w-full max-w-5xl mx-auto flex flex-col gap-8 pb-24">
      <div>
        <h1 className="text-3xl font-extrabold text-navy-900 tracking-tight">Pengaturan Sistem</h1>
        <p className="text-navy-500 mt-1 text-sm">Konfigurasi alamat, kategori kas, dan informasi warga.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* KOLOM KIRI: Profil & Alamat */}
        <div className="flex flex-col gap-6">
          
          {/* Card 1: Identitas RT */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 bg-slate-50 flex items-center gap-3">
              <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
                <Building size={20} />
              </div>
              <h2 className="font-bold text-lg text-slate-900">Identitas RT</h2>
            </div>
            <div className="p-6 space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nama RT</label>
                <input
                  type="text" name="nama_rt" value={formData.nama_rt} onChange={handleInputChange}
                  placeholder="Contoh: RT 07 RW 06"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-slate-900 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">WhatsApp Utama Admin</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone size={16} className="text-slate-400" />
                  </div>
                  <input
                    type="text" name="whatsapp_admin" value={formData.whatsapp_admin} onChange={handleInputChange}
                    placeholder="Contoh: 628123170670"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-slate-900 text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Alamat Master */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 bg-slate-50 flex items-center gap-3">
              <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
                <MapPin size={20} />
              </div>
              <h2 className="font-bold text-lg text-slate-900">Alamat Master</h2>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nama Perumahan</label>
                  <input
                    type="text" name="nama_perumahan" value={formData.nama_perumahan} onChange={handleInputChange}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-900 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nama Jalan</label>
                  <input
                    type="text" name="jalan" value={formData.jalan} onChange={handleInputChange}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-900 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">RT / RW</label>
                  <input
                    type="text" name="rt_rw" value={formData.rt_rw} onChange={handleInputChange}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-900 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Kelurahan</label>
                  <input
                    type="text" name="kelurahan" value={formData.kelurahan} onChange={handleInputChange}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-900 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Kecamatan</label>
                  <input
                    type="text" name="kecamatan" value={formData.kecamatan} onChange={handleInputChange}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-900 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Kota</label>
                  <input
                    type="text" name="kota" value={formData.kota} onChange={handleInputChange}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-900 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Provinsi & Kodepos</label>
                  <input
                    type="text" name="provinsi_kodepos" value={formData.provinsi_kodepos} onChange={handleInputChange}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-900 text-sm"
                  />
                </div>
              </div>

              {saveStatus.type && (
                <div className={`p-3 border rounded-xl flex items-center gap-2 text-sm font-medium ${saveStatus.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
                  <AlertCircle size={16} /> {saveStatus.message}
                </div>
              )}

              <button
                onClick={handleSaveProfil} disabled={isSaving}
                className="w-full py-3 bg-navy-900 text-white font-bold rounded-xl hover:bg-navy-800 transition-all flex justify-center items-center gap-2 shadow-md disabled:opacity-70"
              >
                {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                Simpan Profil & Alamat
              </button>
            </div>
          </div>
        </div>

        {/* KOLOM KANAN: Kategori & Blast */}
        <div className="flex flex-col gap-6">
          
          {/* Card 3: Blast Informasi */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
            <div className="px-6 py-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 text-amber-700 rounded-lg">
                  <Megaphone size={20} />
                </div>
                <h2 className="font-bold text-lg text-slate-900">Blast Informasi Warga</h2>
              </div>
            </div>
            
            <div className="p-6 space-y-6 flex-1 flex flex-col">
              <form onSubmit={handleBuatPengumuman} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Pesan Pengumuman</label>
                  <textarea 
                    required value={newPengumuman.pesan} onChange={(e) => setNewPengumuman({...newPengumuman, pesan: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-navy-900 font-medium text-sm" 
                    rows={3} placeholder="Ketik pengumuman di sini..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Tampil Sampai Tanggal</label>
                  <input 
                    type="date" required value={newPengumuman.batas_waktu} onChange={(e) => setNewPengumuman({...newPengumuman, batas_waktu: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-navy-900 font-medium text-sm" 
                  />
                </div>
                <button type="submit" disabled={isProcessingBlast} className="w-full py-3 bg-navy-900 text-ivory-50 rounded-xl font-bold hover:bg-navy-800 transition-all flex justify-center items-center gap-2 shadow-md">
                  {isProcessingBlast ? <Loader2 className="animate-spin" size={18}/> : <Megaphone size={18}/>} Tembakkan Blast
                </button>
              </form>

              <div className="flex-1 overflow-y-auto min-h-[150px] space-y-3 pt-4 border-t border-slate-100">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Riwayat Pengumuman</p>
                {pengumumanList.length === 0 ? (
                  <p className="text-sm font-medium text-slate-400 text-center py-6 border-2 border-dashed border-slate-200 rounded-xl">Belum ada pengumuman.</p>
                ) : (
                  pengumumanList.map(item => {
                    const isExpired = new Date() > new Date(item.batas_waktu);
                    return (
                      <div key={item.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-start gap-3">
                        <div>
                          <p className={`font-bold text-sm ${isExpired ? 'text-slate-400 line-through' : 'text-slate-900'}`}>{item.pesan}</p>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mt-1">
                            s/d {new Date(item.batas_waktu).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                            {isExpired && <span className="ml-1 text-red-500"> (KEDALUWARSA)</span>}
                          </p>
                        </div>
                        <button onClick={() => handleDeletePengumuman(item.id)} className="text-slate-400 hover:text-red-600 transition-colors shrink-0">
                          <Trash2 size={16}/>
                        </button>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>

          {/* Card 4: Kategori Kas */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 bg-slate-50 flex items-center gap-3">
              <div className="p-2 bg-purple-100 text-purple-700 rounded-lg">
                <Tags size={20} />
              </div>
              <h2 className="font-bold text-lg text-slate-900">Kategori Kas</h2>
            </div>
            
            <div className="p-6 space-y-6">
              <form onSubmit={handleAddKategori} className="flex flex-col gap-3">
                <input 
                  required placeholder="Nama Kategori (Cth: Donasi)" 
                  value={newKategori.nama} onChange={e => setNewKategori({...newKategori, nama: e.target.value})} 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-navy-900 font-medium text-sm" 
                />
                
                <div className="flex gap-2">
                  <div className="relative w-full" ref={dropdownRef}>
                    <div 
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className={`w-full px-4 py-3 bg-slate-50 border rounded-xl cursor-pointer flex justify-between items-center transition-all text-sm ${isDropdownOpen ? 'bg-white ring-2 ring-blue-500 border-blue-500' : 'border-slate-200'}`}
                    >
                      <span className="text-navy-900 font-medium capitalize">{newKategori.tipe}</span>
                      <ChevronDown size={16} className={`text-navy-400 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                    </div>
                    <AnimatePresence>
                      {isDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}
                          className="absolute z-50 w-full mt-2 bg-white border border-ivory-200 rounded-xl shadow-xl py-1"
                        >
                          <div onClick={() => { setNewKategori({...newKategori, tipe: 'keluar'}); setIsDropdownOpen(false); }} className="px-4 py-2.5 hover:bg-ivory-50 cursor-pointer text-navy-900 text-sm font-medium border-b border-ivory-100">Pengeluaran</div>
                          <div onClick={() => { setNewKategori({...newKategori, tipe: 'masuk'}); setIsDropdownOpen(false); }} className="px-4 py-2.5 hover:bg-ivory-50 cursor-pointer text-navy-900 text-sm font-medium">Pemasukan</div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <button type="submit" className="px-6 py-3 bg-navy-900 text-white rounded-xl hover:bg-navy-800 font-bold text-sm shadow-md shrink-0">
                    <Plus size={18} />
                  </button>
                </div>
              </form>

              <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                {kategoriList.map((k) => (
                  <div key={k.id} className="flex justify-between items-center p-3 bg-slate-50 border border-slate-100 rounded-xl hover:border-slate-200 transition-colors">
                    <div>
                      <p className="font-bold text-sm text-slate-900">{k.nama}</p>
                      <p className={`text-[10px] font-extrabold uppercase tracking-wider mt-0.5 ${k.tipe === 'masuk' ? 'text-emerald-600' : 'text-red-600'}`}>
                        {k.tipe}
                      </p>
                    </div>
                    <button onClick={() => handleDeleteKategori(k.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                {kategoriList.length === 0 && (
                  <div className="py-4 text-center text-xs font-medium text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
                    Belum ada kategori.
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}