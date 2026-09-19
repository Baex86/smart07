'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../../../lib/supabaseClient';
import { 
  FileText, MessageSquareWarning, Lightbulb, UserCheck,
  Loader2, CheckCircle2, XCircle, Clock, Edit3, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LayananAdminPage() {
  const [activeTab, setActiveTab] = useState<'surat' | 'aduan' | 'usulan' | 'akun'>('surat');
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  const [dataSurat, setDataSurat] = useState<any[]>([]);
  const [dataAduan, setDataAduan] = useState<any[]>([]);
  const [dataUsulan, setDataUsulan] = useState<any[]>([]);
  
  // State untuk Manajemen Akun (Pendaftaran & Perubahan Data)
  const [dataAkun, setDataAkun] = useState<any[]>([]);
  const [dataDraft, setDataDraft] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [suratRes, aduanRes, usulanRes, akunRes, draftRes] = await Promise.all([
        supabase.from('surat_pengantar').select('*, buku_induk(nama_lengkap, nomor_rumah)').order('created_at', { ascending: false }),
        supabase.from('aduan_warga').select('*, buku_induk(nama_lengkap, nomor_rumah)').order('created_at', { ascending: false }),
        supabase.from('usulan_warga').select('*, buku_induk(nama_lengkap, nomor_rumah)').order('created_at', { ascending: false }),
        supabase.from('buku_induk').select('*, users(role, is_approved)').order('created_at', { ascending: false }),
        supabase.from('draft_perubahan_data').select('*, buku_induk(nama_lengkap, nomor_rumah)').eq('status', 'menunggu').order('created_at', { ascending: false })
      ]);

      if (suratRes.data) setDataSurat(suratRes.data);
      if (aduanRes.data) setDataAduan(aduanRes.data);
      if (usulanRes.data) setDataUsulan(usulanRes.data);
      
      if (akunRes.data) {
        const pendingAkun = akunRes.data.filter(w => w.users && w.users.is_approved === false);
        setDataAkun(pendingAkun);
      }

      if (draftRes.data) setDataDraft(draftRes.data);

    } catch (error) {
      console.error('Error fetching layanan:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateStatus = async (table: string, id: string, newStatus: string) => {
    setIsUpdating(true);
    try {
      const { error } = await supabase.from(table).update({ status: newStatus }).eq('id', id);
      if (error) throw error;

      if (table === 'surat_pengantar') {
        setDataSurat(prev => prev.map(item => item.id === id ? { ...item, status: newStatus } : item));
      } else if (table === 'aduan_warga') {
        setDataAduan(prev => prev.map(item => item.id === id ? { ...item, status: newStatus } : item));
      } else if (table === 'usulan_warga') {
        setDataUsulan(prev => prev.map(item => item.id === id ? { ...item, status: newStatus } : item));
      }
    } catch (error) {
      console.error('Gagal update status:', error);
      alert('Gagal mengubah status layanan.');
    } finally {
      setIsUpdating(false);
    }
  };

  const approveAkun = async (userId: string, bukuIndukId: string) => {
    if (!confirm('Setujui pendaftaran akun ini? Warga akan bisa login ke Portal.')) return;
    setIsUpdating(true);
    try {
      const { error } = await supabase.from('users').update({ is_approved: true }).eq('id', userId);
      if (error) throw error;
      
      setDataAkun(prev => prev.filter(item => item.id !== bukuIndukId));
    } catch (error) {
      console.error('Gagal ACC warga:', error);
      alert('Gagal menyetujui akun warga.');
    } finally {
      setIsUpdating(false);
    }
  };

  // --- LOGIKA ACC / TOLAK PERUBAHAN DATA PROFIL ---
  const handleDraftAction = async (draft: any, action: 'setujui' | 'tolak') => {
    if (!confirm(`Yakin ingin ${action} pengajuan perubahan data ini?`)) return;
    setIsUpdating(true);
    try {
      if (action === 'setujui') {
        // 1. Timpa data lama dengan data baru di tabel buku_induk
        const { error: errUpdate } = await supabase.from('buku_induk').update(draft.data_baru).eq('id', draft.buku_induk_id);
        if (errUpdate) throw errUpdate;
      }
      
      // 2. Update status draft agar hilang dari antrean menunggu
      const newStatus = action === 'setujui' ? 'disetujui' : 'ditolak';
      const { error: errDraft } = await supabase.from('draft_perubahan_data').update({ status: newStatus }).eq('id', draft.id);
      if (errDraft) throw errDraft;

      // 3. Hapus dari UI
      setDataDraft(prev => prev.filter(d => d.id !== draft.id));
    } catch (error) {
      console.error(`Gagal ${action} draft:`, error);
      alert(`Gagal memproses pengajuan data.`);
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'menunggu': return <span className="flex items-center gap-1.5 px-3 py-1 bg-orange-100 text-orange-700 rounded-md text-[10px] font-extrabold uppercase tracking-wider"><Clock size={12} /> Menunggu</span>;
      case 'diproses': return <span className="flex items-center gap-1.5 px-3 py-1 bg-blue-100 text-blue-700 rounded-md text-[10px] font-extrabold uppercase tracking-wider"><Loader2 size={12} className="animate-spin" /> Diproses</span>;
      case 'selesai':
      case 'disetujui': return <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-md text-[10px] font-extrabold uppercase tracking-wider"><CheckCircle2 size={12} /> Selesai</span>;
      case 'ditolak': return <span className="flex items-center gap-1.5 px-3 py-1 bg-red-100 text-red-700 rounded-md text-[10px] font-extrabold uppercase tracking-wider"><XCircle size={12} /> Ditolak</span>;
      default: return <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-md text-[10px] font-extrabold uppercase tracking-wider">{status}</span>;
    }
  };

  const renderContent = () => {
    let currentData: any[] = [];
    let tableName = '';

    if (activeTab === 'surat') { currentData = dataSurat; tableName = 'surat_pengantar'; }
    else if (activeTab === 'aduan') { currentData = dataAduan; tableName = 'aduan_warga'; }
    else if (activeTab === 'usulan') { currentData = dataUsulan; tableName = 'usulan_warga'; }

    // Tampilan Standar (Surat, Aduan, Usulan)
    if (activeTab !== 'akun') {
      if (currentData.length === 0) {
        return (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-200">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4">
              {activeTab === 'surat' ? <FileText size={32} /> : activeTab === 'aduan' ? <MessageSquareWarning size={32} /> : <Lightbulb size={32} />}
            </div>
            <p className="text-slate-500 font-medium">Belum ada antrean untuk layanan ini.</p>
          </div>
        );
      }

      return (
        <div className="flex flex-col gap-4">
          {currentData.map((item) => (
            <div key={item.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-5 items-start md:items-center justify-between transition-all hover:shadow-md">
              <div className="flex items-start gap-4 flex-1">
                <div className={`p-3 rounded-xl shrink-0 ${activeTab === 'surat' ? 'bg-purple-50 text-purple-600' : activeTab === 'aduan' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                  {activeTab === 'surat' ? <FileText size={24} /> : activeTab === 'aduan' ? <MessageSquareWarning size={24} /> : <Lightbulb size={24} />}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">{item.judul || item.jenis_surat}</h3>
                  <p className="text-sm text-slate-500 mt-1 line-clamp-2">{item.deskripsi || item.keperluan || 'Tidak ada deskripsi spesifik.'}</p>
                  <div className="flex items-center gap-3 mt-3">
                    <span className="text-xs font-bold text-slate-900">{item.buku_induk?.nama_lengkap}</span>
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-2 py-0.5 bg-slate-100 rounded">Blok {item.buku_induk?.nomor_rumah}</span>
                    <span className="text-[10px] font-bold text-slate-400">{new Date(item.created_at).toLocaleDateString('id-ID')}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto gap-3 shrink-0 border-t md:border-t-0 border-slate-100 pt-4 md:pt-0 mt-2 md:mt-0">
                {getStatusBadge(item.status)}
                
                {item.status === 'menunggu' && (
                  <div className="flex gap-2">
                    <button onClick={() => updateStatus(tableName, item.id, 'ditolak')} disabled={isUpdating} className="px-3 py-1.5 text-xs font-bold bg-white border border-red-200 text-red-600 hover:bg-red-50 rounded-lg transition">
                      Tolak
                    </button>
                    <button onClick={() => updateStatus(tableName, item.id, 'diproses')} disabled={isUpdating} className="px-3 py-1.5 text-xs font-bold bg-navy-900 text-white hover:bg-navy-800 rounded-lg transition shadow-sm">
                      Proses
                    </button>
                  </div>
                )}
                {item.status === 'diproses' && (
                  <button onClick={() => updateStatus(tableName, item.id, 'selesai')} disabled={isUpdating} className="px-4 py-1.5 text-xs font-bold bg-emerald-500 text-white hover:bg-emerald-600 rounded-lg transition shadow-sm">
                    Tandai Selesai
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      );
    }

    // Tampilan Khusus Tab Manajemen Akun (Akun Baru + Update Profil)
    if (activeTab === 'akun') {
      return (
        <div className="flex flex-col gap-8">
          
          {/* SEKSI 1: ANTREAN AKUN BARU */}
          <div>
            <h2 className="text-sm font-extrabold text-navy-400 uppercase tracking-wider mb-3 px-1">Aktivasi Akun Baru</h2>
            {dataAkun.length === 0 ? (
              <div className="py-6 text-center bg-white border-2 border-dashed border-slate-200 rounded-2xl">
                <p className="text-slate-500 text-sm font-medium">Tidak ada pendaftaran akun baru.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {dataAkun.map((item) => (
                  <div key={item.id} className="bg-white p-5 rounded-2xl border border-orange-200 bg-orange-50/10 shadow-sm flex flex-col md:flex-row gap-5 items-start md:items-center justify-between transition-all hover:shadow-md">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="p-3 rounded-xl shrink-0 bg-orange-100 text-orange-600">
                        <UserCheck size={24} />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-lg">{item.nama_lengkap}</h3>
                        <p className="text-sm text-slate-500 mt-1">
                          Mendaftar sebagai <span className="font-bold">{item.kepala_keluarga_id ? `Anggota Keluarga (${item.status_hubungan || 'Warga'})` : 'Kepala Keluarga'}</span>
                        </p>
                        <div className="flex items-center gap-3 mt-3">
                          <span className="text-xs font-bold text-slate-900">{item.no_wa || '-'}</span>
                          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-2 py-0.5 bg-slate-100 border border-slate-200 rounded">Blok {item.nomor_rumah}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 shrink-0 border-t md:border-t-0 border-slate-100 pt-4 md:pt-0 mt-2 md:mt-0">
                      <button 
                        onClick={() => approveAkun(item.user_id, item.id)}
                        disabled={isUpdating}
                        className="px-5 py-2 text-sm font-bold bg-emerald-500 text-white hover:bg-emerald-600 rounded-xl transition shadow-sm flex items-center gap-2"
                      >
                        {isUpdating ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />} 
                        Setujui Akun
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SEKSI 2: ANTREAN PERUBAHAN DATA PROFIL */}
          <div>
            <h2 className="text-sm font-extrabold text-navy-400 uppercase tracking-wider mb-3 px-1">Pengajuan Perubahan Data</h2>
            {dataDraft.length === 0 ? (
              <div className="py-6 text-center bg-white border-2 border-dashed border-slate-200 rounded-2xl">
                <p className="text-slate-500 text-sm font-medium">Tidak ada pengajuan update profil.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {dataDraft.map((draft) => (
                  <div key={draft.id} className="bg-white p-5 rounded-2xl border border-blue-200 bg-blue-50/10 shadow-sm flex flex-col md:flex-row gap-5 items-start md:items-center justify-between transition-all hover:shadow-md">
                    <div className="flex items-start gap-4 flex-1 w-full min-w-0">
                      <div className="p-3 rounded-xl shrink-0 bg-blue-100 text-blue-600">
                        <Edit3 size={24} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-slate-900 text-lg truncate">{draft.buku_induk?.nama_lengkap}</h3>
                        <p className="text-sm text-slate-500 mt-1">Mengajukan pembaruan data profil.</p>
                        
                        {/* Preview Singkat Data Baru */}
                        <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1.5 overflow-hidden">
                          <p><span className="text-slate-500 font-bold">Nama KTP:</span> {draft.data_baru.nama_lengkap || '-'}</p>
                          <p><span className="text-slate-500 font-bold">WhatsApp:</span> {draft.data_baru.no_wa || '-'}</p>
                          <p><span className="text-slate-500 font-bold">Pekerjaan:</span> {draft.data_baru.pekerjaan || '-'}</p>
                          <p><span className="text-slate-500 font-bold">Domisili:</span> {draft.data_baru.status_tinggal || '-'}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-row md:flex-col gap-2 shrink-0 border-t md:border-t-0 border-slate-100 pt-4 md:pt-0 mt-2 md:mt-0 w-full md:w-auto">
                      <button 
                        onClick={() => handleDraftAction(draft, 'setujui')}
                        disabled={isUpdating}
                        className="flex-1 md:w-full px-5 py-2 text-sm font-bold bg-navy-900 text-white hover:bg-navy-800 rounded-xl transition shadow-sm flex items-center justify-center gap-2"
                      >
                        {isUpdating ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />} Setujui
                      </button>
                      <button 
                        onClick={() => handleDraftAction(draft, 'tolak')}
                        disabled={isUpdating}
                        className="flex-1 md:w-full px-5 py-2 text-sm font-bold bg-white border border-red-200 text-red-600 hover:bg-red-50 rounded-xl transition flex items-center justify-center gap-2"
                      >
                        <X size={16} /> Tolak
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      );
    }
  };

  const pendingAkunCount = dataAkun.length + dataDraft.length;

  return (
    <div className="p-6 md:p-8 w-full max-w-5xl mx-auto flex flex-col gap-6 pb-24">
      <div>
        <h1 className="text-3xl font-extrabold text-navy-900 tracking-tight">Pusat Layanan Warga</h1>
        <p className="text-navy-500 mt-1 text-sm font-medium">Kelola pengajuan surat, aduan, usulan, dan manajemen akun.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
        {[
          { id: 'surat', label: 'Surat Pengantar', icon: FileText, count: 0 },
          { id: 'aduan', label: 'Aduan Warga', icon: MessageSquareWarning, count: 0 },
          { id: 'usulan', label: 'Usulan Warga', icon: Lightbulb, count: 0 },
          { id: 'akun', label: 'Manajemen Akun', icon: UserCheck, count: pendingAkunCount }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all shrink-0 ${
              activeTab === tab.id 
                ? 'bg-navy-900 text-white shadow-md' 
                : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            <tab.icon size={16} /> 
            {tab.label}
            {tab.count > 0 ? (
              <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold ${activeTab === tab.id ? 'bg-white text-navy-900' : 'bg-orange-500 text-white'}`}>
                {tab.count}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="mt-2">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-slate-800" size={40} />
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}