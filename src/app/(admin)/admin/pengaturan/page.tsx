'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../../../lib/supabaseClient';
import { Loader2, Save, CheckCircle2, ShieldUser, Plus } from 'lucide-react';
import { motion } from 'framer-motion';

export default function PengaturanPage() {
  const [settingId, setSettingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nama_rt: '',
    alamat_perumahan: '',
    wa_admin: ''
  });
  
  const [currentAdmins, setCurrentAdmins] = useState<any[]>([]);
  const [calonAdmin, setCalonAdmin] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState('');
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPromoting, setIsPromoting] = useState(false);
  const [message, setMessage] = useState('');
  const [adminMessage, setAdminMessage] = useState('');

  const fetchSemuaData = async () => {
    try {
      // 1. Fetch Pengaturan RT
      const { data: settingData } = await supabase
        .from('pengaturan_rt')
        .select('*')
        .limit(1)
        .single();

      if (settingData) {
        setSettingId(settingData.id);
        setFormData({
          nama_rt: settingData.nama_rt || '',
          alamat_perumahan: settingData.alamat_perumahan || '',
          wa_admin: settingData.wa_admin || ''
        });
      }

      // 2. Fetch Current Admins
      const { data: admins } = await supabase
        .from('buku_induk')
        .select(`id, nama_lengkap, user_id, users!inner(role)`)
        .eq('users.role', 'admin');
      
      if (admins) setCurrentAdmins(admins);

      // 3. Fetch Calon Admin (Warga yang udah di-ACC)
      const { data: calon } = await supabase
        .from('buku_induk')
        .select(`id, nama_lengkap, user_id, users!inner(role, is_approved)`)
        .eq('users.role', 'warga')
        .eq('users.is_approved', true);
        
      if (calon) setCalonAdmin(calon);

    } catch (error) {
      console.error('Gagal menarik data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSemuaData();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveSetting = async () => {
    setIsSaving(true);
    setMessage('');
    try {
      if (settingId) {
        await supabase.from('pengaturan_rt').update(formData).eq('id', settingId);
      } else {
        const { data } = await supabase.from('pengaturan_rt').insert([formData]).select().single();
        if (data) setSettingId(data.id);
      }
      setMessage('Pengaturan berhasil disimpan!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Gagal menyimpan pengaturan.');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePromoteAdmin = async () => {
    if (!selectedUser) return;
    setIsPromoting(true);
    setAdminMessage('');
    
    try {
      const { error } = await supabase
        .from('users')
        .update({ role: 'admin' })
        .eq('id', selectedUser);
        
      if (error) throw error;
      
      setAdminMessage('Berhasil mengangkat admin baru!');
      setSelectedUser('');
      await fetchSemuaData(); // Refresh list otomatis
      setTimeout(() => setAdminMessage(''), 3000);
    } catch (error) {
      setAdminMessage('Gagal mengangkat admin.');
    } finally {
      setIsPromoting(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 pb-20 md:pb-0">
      <div>
        <h1 className="text-3xl font-extrabold text-navy-900 tracking-tight">Pengaturan</h1>
        <p className="text-navy-500 mt-1 text-sm">Konfigurasi sistem dan manajemen akses portal RT.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Blok Kiri: Form Pengaturan Dasar */}
        <div className="bg-ivory-50 border border-ivory-300 rounded-2xl p-6 md:p-8 shadow-sm h-fit">
          <h2 className="text-xl font-extrabold text-navy-900 mb-5">Profil RT</h2>
          
          {isLoading ? (
            <div className="flex justify-center items-center h-32">
              <Loader2 className="animate-spin text-navy-800" size={32} />
            </div>
          ) : (
            <div className="space-y-5">
              {message && (
                <div className={`p-4 rounded-xl text-sm font-bold flex items-center gap-2 ${message.includes('berhasil') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                  {message.includes('berhasil') ? <CheckCircle2 size={18} /> : null}
                  {message}
                </div>
              )}
              <div>
                <label className="block text-sm font-semibold text-navy-700 mb-1">Nama RT</label>
                <input
                  type="text" name="nama_rt" value={formData.nama_rt} onChange={handleChange}
                  placeholder="Contoh: RT 07 / RW 02"
                  className="w-full px-4 py-3 border border-ivory-300 rounded-xl bg-white text-navy-900 focus:ring-2 focus:ring-navy-400 focus:outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-navy-700 mb-1">Alamat Perumahan</label>
                <textarea
                  name="alamat_perumahan" value={formData.alamat_perumahan} onChange={handleChange}
                  placeholder="Contoh: Perumahan Griya Permata Meri..."
                  className="w-full px-4 py-3 border border-ivory-300 rounded-xl bg-white text-navy-900 focus:ring-2 focus:ring-navy-400 focus:outline-none transition-all" rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-navy-700 mb-1">WhatsApp Utama Admin</label>
                <input
                  type="text" name="wa_admin" value={formData.wa_admin} onChange={handleChange}
                  placeholder="Contoh: 628123456789"
                  className="w-full px-4 py-3 border border-ivory-300 rounded-xl bg-white text-navy-900 focus:ring-2 focus:ring-navy-400 focus:outline-none transition-all"
                />
                <p className="text-xs text-navy-400 mt-1 font-medium">Nomor ini akan menerima notifikasi pendaftaran otomatis dari warga.</p>
              </div>

              <button
                onClick={handleSaveSetting} disabled={isSaving}
                className="w-full py-3.5 mt-2 bg-navy-800 text-ivory-50 rounded-xl font-medium tracking-wide hover:bg-navy-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70 shadow-md shadow-navy-900/10"
              >
                {isSaving ? <Loader2 className="animate-spin" size={20} /> : <><Save size={20} /> Simpan Profil</>}
              </button>
            </div>
          )}
        </div>

        {/* Blok Kanan: Manajemen Admin */}
        <div className="bg-ivory-50 border border-ivory-300 rounded-2xl p-6 md:p-8 shadow-sm h-fit">
          <h2 className="text-xl font-extrabold text-navy-900 mb-5 flex items-center gap-2">
            <ShieldUser className="text-gold" /> Manajemen Akses
          </h2>

          {isLoading ? (
            <div className="flex justify-center items-center h-32">
              <Loader2 className="animate-spin text-navy-800" size={32} />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Daftar Admin Saat Ini */}
              <div>
                <label className="block text-sm font-semibold text-navy-700 mb-2">Administrator Aktif</label>
                <div className="space-y-2">
                  {currentAdmins.map(admin => (
                    <div key={admin.id} className="px-4 py-3 bg-white border border-ivory-200 rounded-xl flex items-center justify-between">
                      <span className="font-bold text-navy-900">{admin.nama_lengkap}</span>
                      <span className="px-2.5 py-1 bg-navy-100 text-navy-800 text-[10px] font-extrabold rounded uppercase tracking-wider">Admin</span>
                    </div>
                  ))}
                  {currentAdmins.length === 0 && (
                    <p className="text-sm text-navy-400 italic">Belum ada admin terdaftar.</p>
                  )}
                </div>
              </div>

              <hr className="border-ivory-200" />

              {/* Tambah Admin Baru */}
              <div>
                <label className="block text-sm font-semibold text-navy-700 mb-2">Angkat Warga Menjadi Admin</label>
                
                {adminMessage && (
                  <div className={`p-3 mb-3 rounded-xl text-sm font-bold flex items-center gap-2 ${adminMessage.includes('Berhasil') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                    {adminMessage.includes('Berhasil') ? <CheckCircle2 size={16} /> : null}
                    {adminMessage}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3">
                  <select 
                    value={selectedUser} 
                    onChange={(e) => setSelectedUser(e.target.value)}
                    className="flex-1 px-4 py-3 border border-ivory-300 rounded-xl bg-white text-navy-900 focus:ring-2 focus:ring-navy-400 focus:outline-none transition-all font-medium"
                  >
                    <option value="">-- Pilih Warga Terdaftar --</option>
                    {calonAdmin.map(warga => (
                      <option key={warga.id} value={warga.user_id}>{warga.nama_lengkap}</option>
                    ))}
                  </select>
                  
                  <button 
                    onClick={handlePromoteAdmin}
                    disabled={!selectedUser || isPromoting}
                    className="px-6 py-3 bg-gold text-navy-900 rounded-xl font-bold hover:bg-gold-light active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm"
                  >
                    {isPromoting ? <Loader2 className="animate-spin" size={20} /> : <><Plus size={20} /> Angkat</>}
                  </button>
                </div>
                {calonAdmin.length === 0 && (
                  <p className="text-xs text-orange-600 mt-2 font-medium">Tidak ada warga yang memenuhi syarat. Warga harus disetujui (ACC) terlebih dahulu sebelum bisa menjadi admin.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}