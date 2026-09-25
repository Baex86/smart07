'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../../../lib/supabaseClient';
import { 
  Search, User, ChevronDown, ChevronUp, UserCheck, 
  MapPin, CreditCard, FileText, Phone, X, Users, 
  Wallet, ShieldAlert, Loader2, AlertCircle
} from 'lucide-react';

export default function BukuIndukPage() {
  const [wargaList, setWargaList] = useState<any[]>([]);
  const [filteredWarga, setFilteredWarga] = useState<any[]>([]);
  const [pengaturan, setPengaturan] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedWarga, setSelectedWarga] = useState<any | null>(null);
  const [detailData, setDetailData] = useState<{
    anggota: any[];
    iuran: any[];
    layanan: any[];
  }>({ anggota: [], iuran: [], layanan: [] });
  
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('biodata');
  
  const [expandedAnggota, setExpandedAnggota] = useState<string | null>(null);

  useEffect(() => {
    fetchDataAwal();
  }, []);

  const fetchDataAwal = async () => {
    try {
      setIsLoading(true);
      // REVISI: Inner join dengan users table, tarik semua yang is_approved = true tanpa memandang is_completed
      const [wargaRes, anggotaRes, pengRes] = await Promise.all([
        supabase.from('buku_induk').select('*, users!inner(is_approved)').is('kepala_keluarga_id', null).eq('users.is_approved', true).order('nama_lengkap', { ascending: true }),
        supabase.from('buku_induk').select('kepala_keluarga_id').not('kepala_keluarga_id', 'is', null),
        supabase.from('pengaturan_rt').select('*').limit(1).single()
      ]);

      if (wargaRes.error) throw wargaRes.error;
      
      // Kalkulasi Jumlah Tanggungan Keluarga
      const familyCounts: Record<string, number> = {};
      if (anggotaRes.data) {
        anggotaRes.data.forEach((a: any) => {
          familyCounts[a.kepala_keluarga_id] = (familyCounts[a.kepala_keluarga_id] || 0) + 1;
        });
      }

      // Map jumlah tanggungan ke data utama
      const processedWarga = (wargaRes.data || []).map((warga: any) => ({
        ...warga,
        jumlah_keluarga: familyCounts[warga.id] || 0
      }));

      setWargaList(processedWarga);
      setFilteredWarga(processedWarga);
      
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
    setExpandedAnggota(null);
    
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
    setExpandedAnggota(null);
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

  const renderKotakData = (label: string, value: string, fullWidth: boolean = false) => (
    <div className={`bg-white p-4 rounded-2xl border border-slate-100 shadow-sm ${fullWidth ? 'sm:col-span-2' : ''}`}>
      <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider mb-1.5">{label}</p>
      <p className="text-sm font-bold text-slate-900 leading-snug">{value || '-'}</p>
    </div>
  );

  return (
    <div className="p-6 md:p-8 w-full max-w-5xl mx-auto flex flex-col gap-6 pb-24">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-navy-900 tracking-tight">Buku Induk</h1>
          <p className="text-navy-500 mt-1 text-sm font-medium">Direktori hierarki data warga RT 07 yang telah diverifikasi.</p>
        </div>
        
        <div className="relative w-full md:w-72">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Cari nama, NIK, atau no. rumah..."
            className="pl-10 pr-4 py-2.5 w-full border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm text-sm font-medium text-navy-900 outline-none transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* List Warga (Card UI) */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-slate-800" size={40} />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filteredWarga.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-2xl border border-slate-200">
              <p className="text-slate-500 font-medium">Tidak ada data warga yang sesuai filter pencarian.</p>
            </div>
          ) : (
            filteredWarga.map((warga) => {
              const isExpanded = expandedId === warga.id;
              
              return (
                <div key={warga.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all duration-200">
                  
                  {/* BARIS UTAMA (HEADER KARTU) */}
                  <div 
                    className="p-4 md:p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
                    onClick={() => setExpandedId(isExpanded ? null : warga.id)}
                  >
                    <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0 pr-2 md:pr-4">
                      <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-navy-900 flex items-center justify-center text-white shrink-0 shadow-inner">
                        <User size={18} className="md:w-5 md:h-5" />
                      </div>
                      <div className="overflow-hidden">
                        <h3 className="font-bold text-slate-900 text-base md:text-lg truncate" title={warga.nama_lengkap}>
                          {warga.nama_lengkap}
                        </h3>
                        <p className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider mt-0.5">
                          Blok {warga.nomor_rumah || 'NO DATA'}
                        </p>
                      </div>
                    </div>
                    
                    {/* STATUS BADGE & CHEVRON */}
                    <div className="flex items-center gap-2 md:gap-3 shrink-0">
                      {warga.is_completed ? (
                        <span className="text-[9px] md:text-[10px] font-extrabold tracking-wider uppercase text-slate-500 bg-slate-100 px-2 py-1 md:px-3 md:py-1.5 rounded-lg border border-slate-200 text-center">
                          <span className="hidden md:inline">{warga.jumlah_keluarga} Anggota Keluarga</span>
                          <span className="md:hidden">{warga.jumlah_keluarga} Anggota</span>
                        </span>
                      ) : (
                        <span className="text-[9px] md:text-[10px] font-extrabold tracking-wider uppercase text-orange-600 bg-orange-50 px-2 py-1 md:px-3 md:py-1.5 rounded-lg border border-orange-200 text-center flex items-center gap-1 md:gap-1.5">
                          <AlertCircle size={12} className="hidden md:block md:w-3.5 md:h-3.5"/> 
                          <span className="hidden md:inline">Belum Isi Biodata</span>
                          <span className="md:hidden">Pending Data</span>
                        </span>
                      )}
                      {isExpanded ? <ChevronUp className="text-slate-400 shrink-0" size={18} /> : <ChevronDown className="text-slate-400 shrink-0" size={18} />}
                    </div>
                  </div>

                  {/* ISI ACCORDION (DETAIL) */}
                  {isExpanded && (
                    <div className="px-4 md:px-5 pb-5 pt-2 border-t border-slate-100 bg-slate-50/50">
                      
                      <div className="flex items-center justify-between mb-4 mt-2">
                        <div className="text-[10px] md:text-xs font-extrabold text-navy-400 uppercase tracking-wider">
                          Informasi Dasar
                        </div>
                        {warga.no_wa && (
                          <a href={`https://wa.me/${warga.no_wa}`} target="_blank" rel="noopener noreferrer" className="shrink-0 flex items-center gap-1.5 text-emerald-600 font-bold text-xs hover:text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 transition-colors">
                            <Phone size={14} /> <span className="hidden sm:inline">Hubungi via WA</span><span className="sm:hidden">Hubungi</span>
                          </a>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-5">
                        <div>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1 mb-1"><CreditCard size={12} /> NIK</p>
                          <p className="text-sm font-bold text-slate-800">{warga.nik || '-'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1 mb-1"><MapPin size={12} /> Domisili</p>
                          <p className="text-sm font-bold text-slate-800">{warga.status_tinggal || '-'}</p>
                        </div>
                      </div>
                      
                      <button 
                        onClick={() => openDetailModal(warga)}
                        disabled={!warga.is_completed}
                        className={`w-full py-3 font-bold rounded-xl text-sm flex justify-center items-center gap-2 shadow-md transition-all ${warga.is_completed ? 'bg-navy-900 text-white hover:bg-navy-800 active:scale-[0.98]' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                      >
                        <User size={16} /> {warga.is_completed ? 'Lihat Detail Lengkap' : 'Biodata Belum Tersedia'}
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
          <div className="absolute inset-0 bg-navy-900/60 backdrop-blur-sm" onClick={closeModal}></div>
          
          <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
              <div>
                <h2 className="text-xl font-extrabold text-navy-900 tracking-tight">{selectedWarga.nama_lengkap}</h2>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">Kepala Keluarga • Blok {selectedWarga.nomor_rumah}</p>
              </div>
              <button onClick={closeModal} className="p-2 bg-white rounded-full hover:bg-slate-200 transition text-slate-500 shadow-sm border border-slate-200">
                <X size={20} />
              </button>
            </div>

            <div className="flex border-b border-slate-200 px-6 overflow-x-auto no-scrollbar shrink-0 bg-white">
              {[
                { id: 'biodata', label: 'Biodata Diri', icon: User },
                { id: 'keluarga', label: 'Daftar Keluarga', icon: Users },
                { id: 'finansial', label: 'Riwayat Iuran', icon: Wallet },
                { id: 'layanan', label: 'Administrasi', icon: FileText }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-4 border-b-2 font-bold text-sm whitespace-nowrap transition-all ${
                    activeTab === tab.id 
                      ? 'border-navy-900 text-navy-900' 
                      : 'border-transparent text-slate-400 hover:text-slate-700'
                  }`}
                >
                  <tab.icon size={16} /> {tab.label}
                </button>
              ))}
            </div>

            <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50">
              {isDetailLoading ? (
                <div className="flex justify-center items-center h-40">
                  <Loader2 className="animate-spin text-navy-900" size={32} />
                </div>
              ) : (
                <>
                  {activeTab === 'biodata' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {renderKotakData('Nama Lengkap', selectedWarga.nama_lengkap)}
                      {renderKotakData('NIK', selectedWarga.nik)}
                      {renderKotakData('Nomor KK', selectedWarga.no_kk)}
                      {renderKotakData('Jenis Kelamin', selectedWarga.jenis_kelamin)}
                      {renderKotakData('Tempat, Tanggal Lahir', `${selectedWarga.tempat_lahir || '-'}, ${selectedWarga.tanggal_lahir ? new Date(selectedWarga.tanggal_lahir).toLocaleDateString('id-ID') : '-'}`)}
                      {renderKotakData('Agama', selectedWarga.agama)}
                      {renderKotakData('Pekerjaan', selectedWarga.pekerjaan)}
                      {renderKotakData('Status Perkawinan', selectedWarga.status_perkawinan || 'Belum Kawin')}
                      {renderKotakData('Nomor WhatsApp', selectedWarga.no_wa || selectedWarga.nomor_hp)}
                      {renderKotakData('Status Domisili', selectedWarga.status_tinggal || 'Tetap')}
                      {renderKotakData('Alamat Lengkap', selectedWarga.status_tinggal === 'Tetap' || !selectedWarga.status_tinggal ? generateAlamatLengkap(selectedWarga.nomor_rumah) : (selectedWarga.alamat_ktp || generateAlamatLengkap(selectedWarga.nomor_rumah)), true)}
                    </div>
                  )}

                  {activeTab === 'keluarga' && (
                    <div className="space-y-4">
                      {detailData.anggota.length === 0 ? (
                        <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-2xl bg-white">
                          <Users size={32} className="mx-auto text-slate-300 mb-3" />
                          <p className="font-bold text-slate-500">Belum ada tanggungan keluarga yang terdaftar.</p>
                        </div>
                      ) : (
                        detailData.anggota.map((anggota: any) => {
                          const isExpanded = expandedAnggota === anggota.id;
                          return (
                            <div key={anggota.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all duration-200">
                              <button 
                                onClick={() => setExpandedAnggota(isExpanded ? null : anggota.id)}
                                className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
                              >
                                <div>
                                  <p className="font-extrabold text-navy-900 text-lg leading-snug">{anggota.nama_lengkap}</p>
                                  <div className="flex items-center gap-2 mt-1.5">
                                    <span className="bg-blue-50 border border-blue-100 text-blue-700 px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider">
                                      {anggota.status_hubungan}
                                    </span>
                                    <span className="text-[10px] font-bold text-slate-500">NIK: {anggota.nik || '-'}</span>
                                  </div>
                                </div>
                                {isExpanded ? <ChevronUp className="text-slate-400 shrink-0" /> : <ChevronDown className="text-slate-400 shrink-0" />}
                              </button>
                              
                              {/* Sub-Tab Biodata Anggota Keluarga */}
                              {isExpanded && (
                                <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {renderKotakData('NIK', anggota.nik)}
                                    {renderKotakData('Jenis Kelamin', anggota.jenis_kelamin)}
                                    {renderKotakData('Tempat, Tanggal Lahir', `${anggota.tempat_lahir || '-'}, ${anggota.tanggal_lahir ? new Date(anggota.tanggal_lahir).toLocaleDateString('id-ID') : '-'}`)}
                                    {renderKotakData('Agama', anggota.agama)}
                                    {renderKotakData('Pekerjaan', anggota.pekerjaan)}
                                    {renderKotakData('Status Perkawinan', anggota.status_perkawinan || 'Belum Kawin')}
                                    {renderKotakData('Nomor WhatsApp', anggota.no_wa, true)}
                                  </div>
                                </div>
                              )}
                            </div>
                          )
                        })
                      )}
                    </div>
                  )}

                  {activeTab === 'finansial' && (
                    <div className="space-y-3">
                      {detailData.iuran.length === 0 ? (
                        <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-2xl bg-white">
                          <Wallet size={32} className="mx-auto text-slate-300 mb-3" />
                          <p className="font-bold text-slate-500">Belum ada riwayat tagihan atau pembayaran.</p>
                        </div>
                      ) : (
                        detailData.iuran.map((trx: any, idx) => (
                          <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between transition-colors hover:border-slate-300">
                            <div>
                              <p className="font-bold text-navy-900">{trx.nama_iuran}</p>
                              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1">Periode: {trx.bulan} / {trx.tahun}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-extrabold text-navy-900">Rp {trx.nominal?.toLocaleString('id-ID')}</p>
                              <span className={`inline-block mt-1 text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md border ${trx.status === 'lunas' ? 'bg-green-50 border-green-200 text-green-700' : trx.status === 'menunggu_konfirmasi' ? 'bg-orange-50 border-orange-200 text-orange-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                                {trx.status.replace('_', ' ')}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {activeTab === 'layanan' && (
                    <div className="space-y-3">
                      {detailData.layanan.length === 0 ? (
                        <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-2xl bg-white">
                          <FileText size={32} className="mx-auto text-slate-300 mb-3" />
                          <p className="font-bold text-slate-500">Belum ada riwayat administrasi.</p>
                        </div>
                      ) : (
                        detailData.layanan.map((item: any, idx) => {
                          const isAduan = item.judul !== undefined;
                          return (
                            <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-start gap-4 transition-colors hover:border-slate-300">
                              <div className={`p-3 rounded-xl shrink-0 ${isAduan ? 'bg-red-50 text-red-600' : 'bg-purple-50 text-purple-600'}`}>
                                {isAduan ? <ShieldAlert size={18} /> : <FileText size={18} />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-navy-900 truncate">{isAduan ? item.judul : item.jenis_surat}</p>
                                <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">{new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                              </div>
                              <span className="text-[10px] font-extrabold uppercase px-2 py-1 rounded-md bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
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