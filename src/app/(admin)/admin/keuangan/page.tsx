'use client';

import { useEffect, useState, useRef } from 'react';
import { Loader2, Plus, TrendingUp, TrendingDown, Wallet, X, Calendar, ArrowUpRight, ArrowDownRight, ChevronDown, CheckCircle2, ShieldAlert, ListFilter, Search, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getKeuanganData, catatArusKasManual, prosesVerifikasiIuran, tambahMasterIuran, generateTagihanMassal } from '@/app/actions/keuangan';

type TabType = 'buku_besar' | 'verifikasi' | 'pantau' | 'master';

export default function KeuanganAdminPage() {
  const [activeTab, setActiveTab] = useState<TabType>('buku_besar');
  const [arusKas, setArusKas] = useState<any[]>([]);
  const [kategoriList, setKategoriList] = useState<any[]>([]);
  const [antreanIuran, setAntreanIuran] = useState<any[]>([]);
  const [masterIuran, setMasterIuran] = useState<any[]>([]);
  const [riwayatIuran, setRiwayatIuran] = useState<any[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  
  // Filter & Search untuk Pantauan Iuran
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('semua');
  
  // State Modal Manual Kas
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState({ tanggal: new Date().toISOString().split('T')[0], keterangan: '', tipe: 'keluar', nominal: '', kategori_id: '' });

  // State Modal Master Iuran Baru (Sudah 5 Parameter)
  const [isMasterModalOpen, setIsMasterModalOpen] = useState(false);
  const [masterForm, setMasterForm] = useState({ 
    nama: '', 
    tipe: 'rutin', 
    nominal_default: '', 
    tgl_terbit_default: '1', 
    tgl_jatuh_tempo_default: '10' 
  });

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setIsDropdownOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const result = await getKeuanganData();
      if (result.success) {
        setArusKas(result.arusKas ?? []);
        setKategoriList(result.kategoriList ?? []);
        setAntreanIuran(result.antreanIuran ?? []);
        setMasterIuran(result.masterIuran ?? []);
        setRiwayatIuran(result.riwayatIuran ?? []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualKasSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.kategori_id) return alert('Pilih kategori terlebih dahulu.');
    setIsProcessing('kas');
    try {
      const payload = { ...formData, nominal: Number(formData.nominal) };
      const result = await catatArusKasManual(payload);
      if (!result.success) throw new Error(result.message);
      setFormData({ tanggal: new Date().toISOString().split('T')[0], keterangan: '', tipe: 'keluar', nominal: '', kategori_id: '' });
      setIsModalOpen(false);
      fetchData();
    } catch (error: any) { alert(`Gagal: ${error.message}`); } finally { setIsProcessing(null); }
  };

  const handleVerifikasi = async (id: string, action: 'terima' | 'tolak') => {
    if (!confirm(action === 'terima' ? 'Setujui dan masukkan ke Buku Besar?' : 'Tolak pembayaran ini?')) return;
    setIsProcessing(id);
    try {
      const result = await prosesVerifikasiIuran(id, action);
      if (!result.success) throw new Error(result.message);
      fetchData();
    } catch (error: any) { alert(`Gagal: ${error.message}`); } finally { setIsProcessing(null); }
  };

  const handleTambahMaster = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing('master');
    try {
      const result = await tambahMasterIuran({ 
        nama: masterForm.nama,
        tipe: masterForm.tipe,
        nominal_default: Number(masterForm.nominal_default),
        tgl_terbit_default: Number(masterForm.tgl_terbit_default),
        tgl_jatuh_tempo_default: Number(masterForm.tgl_jatuh_tempo_default)
      });
      if (!result.success) throw new Error(result.message);
      
      setMasterForm({ nama: '', tipe: 'rutin', nominal_default: '', tgl_terbit_default: '1', tgl_jatuh_tempo_default: '10' });
      setIsMasterModalOpen(false);
      fetchData();
    } catch (error: any) { alert(`Gagal: ${error.message}`); } finally { setIsProcessing(null); }
  };

  const handleGenerateTagihan = async (masterId: string, nama: string) => {
    if (!confirm(`Terbitkan tagihan "${nama}" bulan ini untuk SEMUA KK yang aktif?`)) return;
    setIsProcessing(masterId);
    try {
      const result = await generateTagihanMassal(masterId);
      if (!result.success) throw new Error(result.message);
      alert(result.message);
      fetchData();
    } catch (error: any) { alert(error.message); } finally { setIsProcessing(null); }
  };

  const formatRupiah = (angka: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
  
  const totalMasuk = arusKas.filter(k => k.tipe === 'masuk').reduce((sum, k) => sum + Number(k.nominal), 0);
  const totalKeluar = arusKas.filter(k => k.tipe === 'keluar').reduce((sum, k) => sum + Number(k.nominal), 0);
  const saldoAkhir = totalMasuk - totalKeluar;

  const filteredRiwayat = riwayatIuran.filter(item => {
    const matchSearch = item.buku_induk?.nama_lengkap?.toLowerCase().includes(searchQuery.toLowerCase()) || item.buku_induk?.nomor_rumah?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = filterStatus === 'semua' || item.status === filterStatus;
    return matchSearch && matchStatus;
  });

  if (isLoading) return <div className="flex justify-center items-center h-[70vh]"><Loader2 className="animate-spin text-slate-800" size={40} /></div>;

  return (
    <div className="p-6 md:p-8 w-full max-w-6xl mx-auto flex flex-col gap-6 pb-24">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-navy-900 tracking-tight">Pusat Keuangan RT</h1>
          <p className="text-navy-500 mt-1 text-sm font-medium">Buku besar, verifikasi, dan manajemen tagihan massal.</p>
        </div>
        {activeTab === 'buku_besar' && (
          <button onClick={() => setIsModalOpen(true)} className="flex items-center justify-center gap-2 px-5 py-3 bg-navy-900 text-ivory-50 font-bold rounded-xl hover:bg-navy-800 transition shadow-md shadow-navy-900/10">
            <Plus size={18} /> Catat Manual Kas
          </button>
        )}
        {activeTab === 'master' && (
          <button onClick={() => setIsMasterModalOpen(true)} className="flex items-center justify-center gap-2 px-5 py-3 bg-navy-900 text-ivory-50 font-bold rounded-xl hover:bg-navy-800 transition shadow-md">
            <Plus size={18} /> Buat Master Iuran Baru
          </button>
        )}
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar border-b border-ivory-300 pb-px">
        {[
          { id: 'buku_besar', label: 'Buku Besar', icon: Wallet },
          { id: 'verifikasi', label: 'Verifikasi', icon: ShieldAlert, count: antreanIuran.length },
          { id: 'pantau', label: 'Pantau Iuran', icon: ListFilter },
          { id: 'master', label: 'Master Tarif', icon: Settings },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as TabType)} className={`flex items-center gap-2 px-4 py-3 font-bold text-sm transition-all border-b-2 whitespace-nowrap ${activeTab === tab.id ? 'border-navy-900 text-navy-900' : 'border-transparent text-navy-400 hover:text-navy-700'}`}>
            <tab.icon size={16} /> {tab.label}
            {tab.count ? <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${activeTab === tab.id ? 'bg-orange-100 text-orange-700' : 'bg-orange-500 text-white'}`}>{tab.count}</span> : null}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'buku_besar' && (
          <motion.div key="buku_besar" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-6 rounded-2xl border border-ivory-300 shadow-sm flex flex-col justify-between relative overflow-hidden">
                <div className="relative z-10">
                  <p className="text-xs font-bold text-navy-400 uppercase tracking-wider mb-1 flex items-center gap-1"><Wallet size={14}/> Saldo Saat Ini</p>
                  <h2 className="text-3xl font-extrabold text-navy-900">{formatRupiah(saldoAkhir)}</h2>
                </div>
                <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl"></div>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-ivory-300 shadow-sm flex flex-col justify-between">
                <p className="text-xs font-bold text-green-600 uppercase tracking-wider mb-1 flex items-center gap-1"><ArrowUpRight size={14}/> Total Pemasukan</p>
                <h2 className="text-xl font-bold text-navy-900">{formatRupiah(totalMasuk)}</h2>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-ivory-300 shadow-sm flex flex-col justify-between">
                <p className="text-xs font-bold text-red-600 uppercase tracking-wider mb-1 flex items-center gap-1"><ArrowDownRight size={14}/> Total Pengeluaran</p>
                <h2 className="text-xl font-bold text-navy-900">{formatRupiah(totalKeluar)}</h2>
              </div>
            </div>

            <div className="bg-white border border-ivory-300 rounded-2xl shadow-sm overflow-hidden">
              {arusKas.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Wallet size={32} className="text-navy-300 mb-3" />
                  <p className="font-bold text-navy-900">Buku Kas Kosong</p>
                </div>
              ) : (
                <div className="divide-y divide-ivory-100">
                  {arusKas.map((kas) => (
                    <div key={kas.id} className="p-5 hover:bg-ivory-50 transition-colors flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center shadow-sm ${kas.tipe === 'masuk' ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                          {kas.tipe === 'masuk' ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-navy-900 truncate">{kas.keterangan}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-extrabold text-navy-500 bg-ivory-200 px-2 py-0.5 rounded tracking-wide uppercase">{kas.kategori_kas?.nama || 'Lainnya'}</span>
                            <span className="text-[11px] font-medium text-navy-400 flex items-center gap-1"><Calendar size={10} /> {new Date(kas.tanggal).toLocaleDateString('id-ID')}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={`font-extrabold text-lg ${kas.tipe === 'masuk' ? 'text-green-600' : 'text-navy-900'}`}>{kas.tipe === 'masuk' ? '+' : '-'}{formatRupiah(kas.nominal)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'verifikasi' && (
          <motion.div key="verifikasi" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
            {antreanIuran.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white border border-ivory-300 rounded-2xl">
                <CheckCircle2 size={40} className="text-emerald-400 mb-3" />
                <p className="font-bold text-navy-900">Antrean Bersih</p>
              </div>
            ) : (
              antreanIuran.map((item) => (
                <div key={item.id} className="bg-white border border-orange-200 bg-orange-50/10 p-5 rounded-2xl flex flex-col md:flex-row justify-between gap-5 md:items-center shadow-sm">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">{item.bulan} / {item.tahun}</span>
                      <span className="text-[10px] font-bold text-navy-400 uppercase tracking-wider">Blok {item.buku_induk?.nomor_rumah}</span>
                    </div>
                    <h3 className="font-bold text-navy-900 text-lg">{item.buku_induk?.nama_lengkap}</h3>
                    <p className="text-sm text-slate-500 mt-0.5">Membayar: <span className="font-bold text-navy-800">{item.nama_iuran}</span></p>
                    <p className="text-xl font-extrabold text-navy-900 mt-2">{formatRupiah(item.nominal)}</p>
                  </div>
                  <div className="flex flex-row md:flex-col gap-2 w-full md:w-auto shrink-0 border-t border-ivory-200 md:border-t-0 pt-4 md:pt-0">
                    <button onClick={() => handleVerifikasi(item.id, 'terima')} disabled={isProcessing === item.id} className="flex-1 md:w-full px-5 py-2.5 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-70">
                      {isProcessing === item.id ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />} Terima & Masuk Kas
                    </button>
                    <button onClick={() => handleVerifikasi(item.id, 'tolak')} disabled={isProcessing === item.id} className="flex-1 md:w-full px-5 py-2.5 bg-white border border-red-200 text-red-600 font-bold rounded-xl hover:bg-red-50 transition flex items-center justify-center gap-2 disabled:opacity-70">
                      <X size={16} /> Tolak Pembayaran
                    </button>
                  </div>
                </div>
              ))
            )}
          </motion.div>
        )}

        {activeTab === 'pantau' && (
          <motion.div key="pantau" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-300" size={18} />
                <input 
                  type="text" placeholder="Cari nama warga atau blok..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-ivory-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium"
                />
              </div>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-4 py-3 bg-white border border-ivory-300 rounded-xl outline-none text-sm font-bold text-navy-700">
                <option value="semua">Semua Status</option>
                <option value="lunas">Sudah Lunas</option>
                <option value="belum_lunas">Belum Bayar</option>
                <option value="menunggu_konfirmasi">Menunggu ACC</option>
              </select>
            </div>

            <div className="bg-white border border-ivory-300 rounded-2xl shadow-sm overflow-hidden">
              {filteredRiwayat.length === 0 ? (
                <div className="py-16 text-center"><p className="text-sm font-bold text-navy-400">Tidak ada riwayat tagihan yang sesuai.</p></div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-ivory-50 border-b border-ivory-200 text-xs uppercase tracking-wider text-navy-500 font-bold">
                      <tr>
                        <th className="px-6 py-4">Warga & Blok</th>
                        <th className="px-6 py-4">Tagihan (Periode)</th>
                        <th className="px-6 py-4">Nominal</th>
                        <th className="px-6 py-4 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-ivory-100">
                      {filteredRiwayat.map((item) => (
                        <tr key={item.id} className="hover:bg-ivory-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <p className="font-bold text-navy-900">{item.buku_induk?.nama_lengkap}</p>
                            <p className="text-[10px] font-extrabold uppercase text-navy-400 mt-0.5">BLOK {item.buku_induk?.nomor_rumah}</p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="font-bold text-navy-800">{item.nama_iuran}</p>
                            <p className="text-[10px] font-bold text-navy-400 mt-0.5">Bulan: {item.bulan} / {item.tahun}</p>
                          </td>
                          <td className="px-6 py-4 font-extrabold text-navy-900">{formatRupiah(item.nominal)}</td>
                          <td className="px-6 py-4 text-right">
                            <span className={`inline-block px-3 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wider
                              ${item.status === 'lunas' ? 'bg-green-100 text-green-700' : item.status === 'menunggu_konfirmasi' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}
                            `}>
                              {item.status.replace('_', ' ')}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'master' && (
          <motion.div key="master" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {masterIuran.length === 0 ? (
                <div className="col-span-full py-16 text-center bg-white border-2 border-dashed border-ivory-300 rounded-2xl">
                  <p className="font-bold text-navy-400">Belum ada Master Iuran. Buat baru untuk mulai menerbitkan tagihan.</p>
                </div>
              ) : (
                masterIuran.map((m) => (
                  <div key={m.id} className="bg-white border border-ivory-300 p-6 rounded-2xl shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-100">{m.tipe}</span>
                        <span className={`w-2 h-2 rounded-full ${m.is_active ? 'bg-green-500' : 'bg-red-500'}`}></span>
                      </div>
                      <h3 className="font-bold text-navy-900 text-lg leading-snug">{m.nama}</h3>
                      <p className="text-2xl font-extrabold text-navy-900 mt-2">{formatRupiah(m.nominal_default)}</p>
                    </div>
                    <div className="mt-6 pt-4 border-t border-ivory-100">
                      <button 
                        onClick={() => handleGenerateTagihan(m.id, m.nama)} disabled={isProcessing === m.id}
                        className="w-full py-2.5 bg-navy-900 text-white font-bold rounded-xl hover:bg-navy-800 transition flex items-center justify-center gap-2 shadow-md disabled:opacity-70 text-sm"
                      >
                        {isProcessing === m.id ? <Loader2 size={16} className="animate-spin" /> : <TrendingUp size={16} />} Terbitkan Tagihan Massal
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="fixed inset-0 bg-navy-900/60 backdrop-blur-sm z-50" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-3xl shadow-2xl z-50 flex flex-col max-h-[90vh]">
              <div className="px-6 py-5 border-b border-ivory-200 flex justify-between items-center bg-ivory-50 shrink-0 rounded-t-3xl">
                <h2 className="text-xl font-bold text-navy-900">Catat Transaksi</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 bg-white rounded-full hover:bg-ivory-200 transition text-navy-400"><X size={18} /></button>
              </div>
              <div className="p-6 overflow-y-auto">
                <form onSubmit={handleManualKasSubmit} className="space-y-5">
                  <div className="flex p-1 bg-ivory-100 rounded-xl">
                    <button type="button" onClick={() => setFormData({...formData, tipe: 'keluar', kategori_id: ''})} className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${formData.tipe === 'keluar' ? 'bg-white text-red-600 shadow-sm' : 'text-navy-400'}`}>Pengeluaran</button>
                    <button type="button" onClick={() => setFormData({...formData, tipe: 'masuk', kategori_id: ''})} className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${formData.tipe === 'masuk' ? 'bg-white text-green-600 shadow-sm' : 'text-navy-400'}`}>Pemasukan</button>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-navy-500 uppercase tracking-wider mb-1.5">Tanggal</label>
                    <input type="date" required value={formData.tanggal} onChange={e => setFormData({...formData, tanggal: e.target.value})} className="w-full px-4 py-3 bg-ivory-50 border border-ivory-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-navy-900 font-medium" />
                  </div>
                  <div className="relative" ref={dropdownRef}>
                    <label className="block text-xs font-bold text-navy-500 uppercase tracking-wider mb-1.5">Kategori</label>
                    <div onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="w-full px-4 py-3 bg-ivory-50 border border-ivory-300 rounded-xl cursor-pointer flex justify-between items-center text-navy-900 font-medium">
                      <span>{kategoriList.find(k => k.id === formData.kategori_id)?.nama || 'Pilih kategori...'}</span>
                      <ChevronDown size={18} className="text-navy-400" />
                    </div>
                    {isDropdownOpen && (
                      <div className="absolute z-50 w-full mt-2 bg-white border border-ivory-200 rounded-xl shadow-xl max-h-48 overflow-y-auto py-1">
                        {kategoriList.filter(k => k.tipe === formData.tipe).map(kat => (
                          <div key={kat.id} onClick={() => { setFormData({ ...formData, kategori_id: kat.id }); setIsDropdownOpen(false); }} className="px-4 py-3 hover:bg-ivory-50 cursor-pointer text-sm font-medium border-b border-ivory-100">{kat.nama}</div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-navy-500 uppercase tracking-wider mb-1.5">Keterangan & Nominal</label>
                    <input type="text" required placeholder="Keterangan..." value={formData.keterangan} onChange={e => setFormData({...formData, keterangan: e.target.value})} className="w-full px-4 py-3 bg-ivory-50 border border-ivory-300 rounded-xl mb-3 outline-none text-navy-900 font-medium" />
                    <input type="number" required placeholder="Rp" value={formData.nominal} onChange={e => setFormData({...formData, nominal: e.target.value})} className="w-full px-4 py-3 bg-ivory-50 border border-ivory-300 rounded-xl outline-none text-navy-900 font-medium font-mono text-lg" />
                  </div>
                  <button type="submit" disabled={isProcessing === 'kas'} className="w-full py-3.5 bg-navy-900 text-ivory-50 rounded-xl font-bold hover:bg-navy-800 transition flex justify-center gap-2 shadow-md">
                    {isProcessing === 'kas' ? <Loader2 size={18} className="animate-spin" /> : 'Simpan Transaksi'}
                  </button>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isMasterModalOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsMasterModalOpen(false)} className="fixed inset-0 bg-navy-900/60 backdrop-blur-sm z-50" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-3xl shadow-2xl z-50 flex flex-col max-h-[90vh]">
              <div className="px-6 py-5 border-b border-ivory-200 flex justify-between items-center bg-ivory-50 shrink-0 rounded-t-3xl">
                <h2 className="text-xl font-bold text-navy-900">Master Tarif Baru</h2>
                <button onClick={() => setIsMasterModalOpen(false)} className="p-2 bg-white rounded-full hover:bg-ivory-200 transition text-navy-400"><X size={18} /></button>
              </div>
              <div className="p-6 overflow-y-auto">
                <form onSubmit={handleTambahMaster} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-navy-500 uppercase tracking-wider mb-1.5">Nama Iuran</label>
                    <input type="text" required placeholder="Cth: Iuran Keamanan & Sampah" value={masterForm.nama} onChange={e => setMasterForm({...masterForm, nama: e.target.value})} className="w-full px-4 py-3 bg-ivory-50 border border-ivory-300 rounded-xl outline-none text-navy-900 font-medium" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-navy-500 uppercase tracking-wider mb-1.5">Tipe Tagihan</label>
                    <select value={masterForm.tipe} onChange={e => setMasterForm({...masterForm, tipe: e.target.value})} className="w-full px-4 py-3 bg-ivory-50 border border-ivory-300 rounded-xl outline-none text-navy-900 font-medium">
                      <option value="rutin">Rutin Bulanan</option>
                      <option value="insidental">Insidental (Sekali Bayar)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-navy-500 uppercase tracking-wider mb-1.5">Nominal Tarif (Rp)</label>
                    <input type="number" required placeholder="50000" value={masterForm.nominal_default} onChange={e => setMasterForm({...masterForm, nominal_default: e.target.value})} className="w-full px-4 py-3 bg-ivory-50 border border-ivory-300 rounded-xl outline-none text-navy-900 font-medium font-mono text-lg" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-navy-500 uppercase tracking-wider mb-1.5">Tgl Muncul Tagihan</label>
                      <input type="number" required min="1" max="31" placeholder="Tgl 1" value={masterForm.tgl_terbit_default} onChange={e => setMasterForm({...masterForm, tgl_terbit_default: e.target.value})} className="w-full px-4 py-3 bg-ivory-50 border border-ivory-300 rounded-xl outline-none text-navy-900 font-medium" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-navy-500 uppercase tracking-wider mb-1.5">Akhir Pembayaran</label>
                      <input type="number" required min="1" max="31" placeholder="Tgl 10" value={masterForm.tgl_jatuh_tempo_default} onChange={e => setMasterForm({...masterForm, tgl_jatuh_tempo_default: e.target.value})} className="w-full px-4 py-3 bg-ivory-50 border border-ivory-300 rounded-xl outline-none text-navy-900 font-medium" />
                    </div>
                  </div>
                  <div className="pt-2">
                    <button type="submit" disabled={isProcessing === 'master'} className="w-full py-3.5 bg-navy-900 text-ivory-50 rounded-xl font-bold hover:bg-navy-800 transition flex justify-center gap-2 shadow-md disabled:opacity-70">
                      {isProcessing === 'master' ? <Loader2 size={18} className="animate-spin" /> : 'Simpan Master Iuran'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}