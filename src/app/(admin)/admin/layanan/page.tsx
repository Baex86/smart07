'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../../../lib/supabaseClient';
import { 
  Search, User, ChevronDown, ChevronUp, UserCheck, 
  MapPin, CreditCard, FileText, Phone, X, Users, 
  Wallet, ShieldAlert, Loader2, Shield, ShieldOff 
} from 'lucide-react';

export default function BukuIndukPage() {
  const [wargaList, setWargaList] = useState<any[]>([]);
  const [filteredWarga, setFilteredWarga] = useState<any[]>([]);
  const [pengaturan, setPengaturan] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedWarga, setSelectedWarga] = useState<any | null>(null);
  const [myUid, setMyUid] = useState<string | null>(null);

  const [detailData, setDetailData] = useState<{
    anggota: any[];
    iuran: any[];
    layanan: any[];
  }>({ anggota: [], iuran: [], layanan: [] });
  
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('biodata');

  useEffect(() => {
    // Ambil UID admin yang sedang login dari Cookie untuk proteksi "Bunuh Diri Admin"
    const value = `; ${document.cookie}`;
    const parts = value.split(`; smart_system_uid=`);
    if (parts.length === 2) setMyUid(parts.pop()?.split(';').shift() || null);

    fetchDataAwal();
  }, []);

  const fetchDataAwal = async () => {
    try {
      setIsLoading(true);
      // Join ke tabel users untuk menarik data role
      const [wargaRes, pengRes] = await Promise.all([
        supabase.from('buku_induk')
          .select('*, users(role)')
          .is('kepala_keluarga_id', null)
          .order('nama_lengkap', { ascending: true }),
        supabase.from('pengaturan_rt').select('*').limit(1).single()
      ]);

      if (wargaRes.error) throw wargaRes.error;
      
      setWargaList(wargaRes.data || []);
      setFilteredWarga(wargaRes.data || []);
      
      if (pengRes.data) {
        setPengaturan(pengRes.data);
      }
    } catch (error) {
      console.error('Error fetching data awal:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const lowercasedQuery = searchQuery.toLowerCase();
    const filtered = wargaList.filter(warga => 
      warga.nama_lengkap?.toLowerCase().includes(lowercasedQuery) ||
      warga.nomor_rumah?.toLowerCase().includes(lowercasedQuery) ||
      warga.nik?.toLowerCase().includes(lowercasedQuery)
    );
    setFilteredWarga(filtered);
  }, [searchQuery, wargaList]);

  const openDetailModal = async (warga: any) => {
    setSelectedWarga(warga);
    setIsDetailLoading(true);
    setActiveTab('biodata');
    try {
      const [anggotaRes, iuranRes, suratRes, aduanRes] = await Promise.allSettled([
        supabase.from('buku_induk').select('*').eq('kepala_keluarga_id', warga.id),
        supabase.from('iuran_kas').select('*').eq('buku_induk_id', warga.id).order('created_at', { ascending: false }),
        supabase.from('surat_pengantar').select('*').eq('buku_induk_id', warga.id).order('created_at', { ascending: false }),
        supabase.from('aduan_warga').select('*').eq('buku_induk_id', warga.id).order('created_at', { ascending: false })
      ]);

      const surat = suratRes.status === 'fulfilled' && suratRes.value.data ? suratRes.value.data : [];
      const aduan = aduanRes.status === 'fulfilled' && aduanRes.value.data ? aduanRes.value.data : [];

      setDetailData({
        anggota: anggotaRes.status === 'fulfilled' && anggotaRes.value.data ? anggotaRes.value.data : [],
        iuran: iuranRes.status === 'fulfilled' && iuranRes.value.data ? iuranRes.value.data : [],
        layanan: [...surat, ...aduan].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      });
    } catch (error) {
      console.error('Error fetching detail:', error);
    } finally {
      setIsDetailLoading(false);
    }
  };

  const closeModal = () => {
    setSelectedWarga(null);
    setDetailData({ anggota: [], iuran: [], layanan: [] });
  };

  // Logika Mengangkat / Mencabut Jabatan Admin
  const handleToggleRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'warga' : 'admin';
    const confirmText = currentRole === 'admin' 
      ? 'Yakin ingin mencabut akses Admin dari warga ini?' 
      : 'Yakin ingin mengangkat warga ini menjadi Admin Sistem?';

    if (!confirm(confirmText)) return;

    try {
      setIsDetailLoading(true);
      const { error } = await supabase.from('users').update({ role: newRole }).eq('id', userId);
      if (error) throw error;

      // Update state lokal biar UI langsung berubah tanpa perlu refresh page
      const updatedWargaList = wargaList.map(w => {
        if (w.user_id === userId) {
          return { ...w, users: { role: newRole } };
        }
        return w;
      });
      setWargaList(updatedWargaList);
      setFilteredWarga(updatedWargaList);
      setSelectedWarga({ ...selectedWarga, users: { role: newRole } });

    } catch (error) {
      console.error('Gagal update role:', error);
      alert('Gagal mengubah hak akses.');
    } finally {
      setIsDetailLoading(false);
    }
  };

  const generateAlamatLengkap = (blok: string) => {
    if (!pengaturan) return 'Data alamat master belum diatur';
    const alamat = [
      blok ? `Blok ${blok}` : '',
      pengaturan.jalan,
      pengaturan.rt_rw ? `RT/RW ${pengaturan.rt_rw.replace(/[^\d/]/g, '')}` : '',
      pengaturan.kelurahan ? `Kel. ${pengaturan.kelurahan}` : '',
      pengaturan.kecamatan ? `Kec. ${pengaturan.kecamatan}` : '',
      pengaturan.kota,
      pengaturan.provinsi_kodepos
    ].filter(Boolean).join(', ');
    
    return alamat || 'Alamat tidak lengkap';
  };

  return (
    <div className="p-6 md:p-8 w-full max-w-5xl mx-auto flex flex-col gap-6 pb-24">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-navy-900 tracking-tight">Buku Induk</h1>
          <p className="text-navy-500 mt-1 text-sm">Direktori hierarki data warga dan manajemen akses Admin.</p>
        </div>
        
        <div className="relative w-full md:w-72">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Cari nama, NIK, atau no. rumah..."
            className="pl-10 pr-4 py-2.5 w-full border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-slate-800" size={40} />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filteredWarga.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-2xl border border-slate-200">
              <p className="text-slate-500">Tidak ada data warga yang sesuai.</p>
            </div>
          ) : (
            filteredWarga.map((warga) => {
              const isExpanded = expandedId === warga.id;
              const isAdmin = warga.users?.role === 'admin';
              
              return (
                <div key={warga.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all duration-200">
                  <div 
                    className="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50"
                    onClick={() => setExpandedId(isExpanded ? null : warga.id)}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`h-12 w-12 rounded-full flex items-center justify-center text-white shrink-0 shadow-inner ${isAdmin ? 'bg-amber-500' : 'bg-navy-900'}`}>
                        {isAdmin ? <Shield size={20} /> : <User size={20} />}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                          {warga.nama_lengkap}
                          {isAdmin && (
                            <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded text-[10px] uppercase font-extrabold tracking-wider border border-amber-200">
                              Admin
                            </span>
                          )}
                        </h3>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{warga.nomor_rumah || 'NO DATA'}</p>
                      </div>
                    </div>
                    {isExpanded ? <ChevronUp className="text-slate-400" /> : <ChevronDown className="text-slate-400" />}
                  </div>

                  {isExpanded && (
                    <div className="px-5 pb-5 pt-2 border-t border-slate-100 bg-slate-50/50">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-1.5 bg-green-100 text-green-700 px-3 py-1 rounded-md text-xs font-bold tracking-wide">
                          <UserCheck size={14} /> AKTIF
                        </div>
                        <button className="flex items-center gap-1.5 text-green-600 font-bold text-sm hover:text-green-700">
                          <Phone size={14} /> Hubungi
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-5">
                        <div>
                          <p className="text-xs text-slate-400 font-medium flex items-center gap-1 mb-1"><CreditCard size={12} /> NIK</p>
                          <p className="text-sm font-semibold text-slate-800">{warga.nik || '-'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 font-medium flex items-center gap-1 mb-1"><MapPin size={12} /> Domisili</p>
                          <p className="text-sm font-semibold text-slate-800">{warga.status_domisili || 'Tetap'}</p>
                        </div>
                      </div>

                      <button 
                        onClick={() => openDetailModal(warga)}
                        className="w-full py-2.5 bg-navy-900 text-white font-bold rounded-xl text-sm hover:bg-navy-800 transition-colors flex justify-center items-center gap-2 shadow-md"
                      >
                        <User size={16} /> Lihat Detail & Manajemen Akses
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* MODAL DETAIL LENGKAP */}
      {selectedWarga && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={closeModal}></div>
          
          <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  {selectedWarga.nama_lengkap}
                  {selectedWarga.users?.role === 'admin' && (
                    <Shield size={18} className="text-amber-500" />
                  )}
                </h2>
                <p className="text-sm font-medium text-slate-500">Blok {selectedWarga.nomor_rumah}</p>
              </div>
              <button onClick={closeModal} className="p-2 bg-white rounded-full hover:bg-slate-200 transition text-slate-500 shadow-sm border border-slate-200">
                <X size={20} />
              </button>
            </div>

            <div className="flex border-b border-slate-200 px-6 overflow-x-auto no-scrollbar shrink-0">
              {[
                { id: 'biodata', label: 'Biodata & Akses', icon: User },
                { id: 'keluarga', label: 'Keluarga', icon: Users },
                { id: 'finansial', label: 'Riwayat Iuran', icon: Wallet },
                { id: 'layanan', label: 'Administrasi', icon: FileText }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-4 border-b-2 font-semibold text-sm whitespace-nowrap transition-colors ${
                    activeTab === tab.id 
                      ? 'border-blue-600 text-blue-700' 
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <tab.icon size={16} /> {tab.label}
                </button>
              ))}
            </div>

            <div className="p-6 overflow-y-auto flex-1 bg-slate-50/30">
              {isDetailLoading ? (
                <div className="flex justify-center items-center h-40">
                  <Loader2 className="animate-spin text-blue-600" size={32} />
                </div>
              ) : (
                <>
                  {activeTab === 'biodata' && (
                    <div className="space-y-6">
                      
                      {/* FITUR JADIKAN ADMIN (Hanya muncul jika bukan akunnya sendiri) */}
                      {selectedWarga.user_id && selectedWarga.id !== myUid && (
                        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div>
                            <p className="text-sm font-bold text-slate-900 flex items-center gap-1.5 mb-1">
                              <ShieldAlert size={16} className={selectedWarga.users?.role === 'admin' ? 'text-amber-500' : 'text-slate-400'} />
                              Hak Akses Sistem
                            </p>
                            <p className="text-xs text-slate-500 leading-relaxed">
                              {selectedWarga.users?.role === 'admin'
                                ? 'Warga ini memiliki akses penuh ke fitur dan Dasbor Admin.'
                                : 'Warga ini hanya memiliki akses standar ke Portal Warga.'}
                            </p>
                          </div>
                          <button
                            onClick={() => handleToggleRole(selectedWarga.user_id, selectedWarga.users?.role)}
                            className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 shrink-0 ${
                              selectedWarga.users?.role === 'admin'
                                ? 'bg-red-100 text-red-700 hover:bg-red-200 border border-red-200'
                                : 'bg-navy-900 text-gold hover:bg-navy-800 shadow-md'
                            }`}
                          >
                            {selectedWarga.users?.role === 'admin' 
                              ? <><ShieldOff size={16}/> Cabut Admin</> 
                              : <><Shield size={16}/> Jadikan Admin</>}
                          </button>
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Nama Lengkap</p>
                          <p className="text-base font-semibold text-slate-900">{selectedWarga.nama_lengkap}</p>
                        </div>
                        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">NIK</p>
                          <p className="text-base font-semibold text-slate-900">{selectedWarga.nik || '-'}</p>
                        </div>
                        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Nomor HP/WA</p>
                          <p className="text-base font-semibold text-slate-900">{selectedWarga.no_wa || '-'}</p>
                        </div>
                        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Status Domisili</p>
                          <p className="text-base font-semibold text-slate-900">{selectedWarga.status_domisili || 'Warga Tetap'}</p>
                        </div>
                        <div className="sm:col-span-2 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Alamat Lengkap (KTP)</p>
                          <p className="text-base font-semibold text-slate-900">
                            {selectedWarga.status_domisili === 'Warga Tetap' || !selectedWarga.status_domisili
                              ? generateAlamatLengkap(selectedWarga.nomor_rumah)
                              : (selectedWarga.alamat_ktp || generateAlamatLengkap(selectedWarga.nomor_rumah))}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'keluarga' && (
                    <div className="space-y-4">
                      {detailData.anggota.length === 0 ? (
                        <div className="text-center py-10">
                          <p className="text-slate-500">Belum ada data anggota keluarga yang terdaftar.</p>
                        </div>
                      ) : (
                        detailData.anggota.map((anggota: any) => (
                          <div key={anggota.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                            <div>
                              <p className="font-bold text-slate-900">{anggota.nama_lengkap}</p>
                              <p className="text-sm text-slate-500">NIK: {anggota.nik || '-'}</p>
                            </div>
                            <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-blue-100">
                              {anggota.status_hubungan || 'Anggota'}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {activeTab === 'finansial' && (
                    <div className="space-y-4">
                      {detailData.iuran.length === 0 ? (
                        <div className="text-center py-10">
                          <p className="text-slate-500">Belum ada riwayat pembayaran iuran.</p>
                        </div>
                      ) : (
                        detailData.iuran.map((trx: any, idx) => (
                          <div key={idx} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                            <div>
                              <p className="font-bold text-slate-900">{trx.nama_iuran}</p>
                              <p className="text-xs text-slate-400">{new Date(trx.created_at).toLocaleDateString('id-ID')}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-slate-900">Rp {trx.nominal?.toLocaleString('id-ID')}</p>
                              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${trx.status === 'lunas' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                {trx.status}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {activeTab === 'layanan' && (
                    <div className="space-y-4">
                      {detailData.layanan.length === 0 ? (
                        <div className="text-center py-10">
                          <p className="text-slate-500">Belum ada riwayat pengajuan surat atau aduan.</p>
                        </div>
                      ) : (
                        detailData.layanan.map((item: any, idx) => {
                          const isAduan = item.judul !== undefined;
                          return (
                            <div key={idx} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                              <div className={`p-3 rounded-full shrink-0 ${isAduan ? 'bg-red-50 text-red-600' : 'bg-purple-50 text-purple-600'}`}>
                                {isAduan ? <ShieldAlert size={18} /> : <FileText size={18} />}
                              </div>
                              <div className="flex-1">
                                <p className="font-bold text-slate-900">{isAduan ? item.judul : item.jenis_surat}</p>
                                <p className="text-xs text-slate-400">{new Date(item.created_at).toLocaleDateString('id-ID')}</p>
                              </div>
                              <span className="text-[10px] font-bold uppercase px-2 py-1 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                                {item.status}
                              </span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}

                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}