'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, Loader2, CheckCircle2, Clock, Receipt, Search, TrendingUp, TrendingDown, Store } from 'lucide-react';
import { getIuranWarga, konfirmasiPembayaran, getRingkasanKasRT, getSaldoBadanUsaha, getTransparansiKeuangan } from '../../actions/iuran';

type TabType = 'iuran' | 'kas' | 'usaha';

export default function IuranWargaPage() {
  const [tagihan, setTagihan] = useState<any[]>([]);
  const [kasRT, setKasRT] = useState({ saldo: 0, totalMasuk: 0, totalKeluar: 0 });
  const [usahaRT, setUsahaRT] = useState({ saldo: 0, totalMasuk: 0, totalKeluar: 0 });
  const [transparansi, setTransparansi] = useState({ kasRT: [] as any[], kasUsaha: [] as any[] });
  
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('iuran');

  // State Engine Filter & Grouping
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'terbaru' | 'terlama' | 'tertinggi' | 'terendah'>('terbaru');
  const [groupBy, setGroupBy] = useState<'none' | 'bulan' | 'tipe'>('none');

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [resIuran, resKas, resUsaha, resTrans] = await Promise.all([
        getIuranWarga(),
        getRingkasanKasRT(),
        getSaldoBadanUsaha(),
        getTransparansiKeuangan()
      ]);

      if (resIuran.success && resIuran.data) setTagihan(resIuran.data);
      if (resKas.success) setKasRT({ saldo: resKas.saldo || 0, totalMasuk: resKas.totalMasuk || 0, totalKeluar: resKas.totalKeluar || 0 });
      if (resUsaha.success) setUsahaRT({ saldo: resUsaha.saldo || 0, totalMasuk: resUsaha.totalMasuk || 0, totalKeluar: resUsaha.totalKeluar || 0 });
      if (resTrans.success) setTransparansi({ kasRT: resTrans.kasRT || [], kasUsaha: resTrans.kasUsaha || [] });
      
    } catch (error) {
      console.error('Gagal memuat transparansi:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Reset filter ketika ganti tab
  useEffect(() => {
    setSearchQuery('');
    setSortBy('terbaru');
    setGroupBy('none');
  }, [activeTab]);

  const handleKonfirmasi = async (id: string) => {
    if (!confirm('Pastikan Anda sudah melakukan pembayaran. Lanjutkan konfirmasi?')) return;
    setIsProcessing(id);
    try {
      const res = await konfirmasiPembayaran(id);
      if (!res.success) throw new Error(res.message);
      await fetchData(); 
    } catch (error: any) {
      alert(`Gagal mengirim konfirmasi: ${error.message}`);
    } finally {
      setIsProcessing(null);
    }
  };

  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka || 0);
  };

  const tagihanAktif = tagihan.filter(t => t.status !== 'lunas');
  const tagihanLunas = tagihan.filter(t => t.status === 'lunas');

  // --- ENGINE FILTER & GROUPING ---
  const prosesData = (data: any[], type: TabType) => {
    // 1. Search
    let result = data.filter(item => {
      const text = type === 'iuran' ? item.nama_iuran : (item.keterangan || item.nama_usaha);
      return text?.toLowerCase().includes(searchQuery.toLowerCase());
    });

    // 2. Sort
    result.sort((a, b) => {
      const dateA = new Date(type === 'iuran' ? a.created_at : a.tanggal).getTime();
      const dateB = new Date(type === 'iuran' ? b.created_at : b.tanggal).getTime();
      const nomA = Number(a.nominal);
      const nomB = Number(b.nominal);

      if (sortBy === 'terbaru') return dateB - dateA;
      if (sortBy === 'terlama') return dateA - dateB;
      if (sortBy === 'tertinggi') return nomB - nomA;
      if (sortBy === 'terendah') return nomA - nomB;
      return 0;
    });

    // 3. Group
    if (groupBy === 'none') return { 'Semua Data Transaksi': result };

    const grouped: Record<string, any[]> = {};
    result.forEach(item => {
      let key = 'Lainnya';
      if (groupBy === 'bulan') {
        if (type === 'iuran') {
          key = `Periode ${item.bulan} / ${item.tahun}`;
        } else {
          key = new Date(item.tanggal).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
        }
      } else if (groupBy === 'tipe') {
        if (type === 'iuran') {
          key = item.status === 'lunas' ? 'Sudah Lunas' : 'Belum Lunas';
        } else {
          key = item.tipe === 'masuk' ? 'Pemasukan' : 'Pengeluaran';
        }
      }

      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(item);
    });

    return grouped;
  };

  const renderFilterBar = () => (
    <div className="flex flex-col md:flex-row gap-3 mb-6 bg-white p-4 rounded-2xl border border-ivory-300 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-300" size={18} />
        <input 
          placeholder="Cari nama transaksi..." 
          value={searchQuery} 
          onChange={e => setSearchQuery(e.target.value)} 
          className="w-full pl-10 pr-4 py-2.5 bg-ivory-50 border border-ivory-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-navy-400 text-navy-900" 
        />
      </div>
      <div className="flex gap-2 w-full md:w-auto">
        <select value={sortBy} onChange={e => setSortBy(e.target.value as any)} className="flex-1 md:w-auto px-4 py-2.5 bg-ivory-50 border border-ivory-200 rounded-xl text-xs font-bold text-navy-700 outline-none focus:ring-2 focus:ring-navy-400 appearance-none">
          <option value="terbaru">Sort: Terbaru</option>
          <option value="terlama">Sort: Terlama</option>
          <option value="tertinggi">Sort: Nominal Tertinggi</option>
          <option value="terendah">Sort: Nominal Terendah</option>
        </select>
        <select value={groupBy} onChange={e => setGroupBy(e.target.value as any)} className="flex-1 md:w-auto px-4 py-2.5 bg-ivory-50 border border-ivory-200 rounded-xl text-xs font-bold text-navy-700 outline-none focus:ring-2 focus:ring-navy-400 appearance-none">
          <option value="none">Grup: Tidak Ada</option>
          <option value="bulan">Grup: Per Bulan</option>
          <option value="tipe">Grup: Tipe Transaksi</option>
        </select>
      </div>
    </div>
  );

  const renderGroupedData = (dataToProcess: any[], type: TabType) => {
    const grouped = prosesData(dataToProcess, type);
    const keys = Object.keys(grouped);

    if (keys.length === 0 || (keys.length === 1 && grouped[keys[0]].length === 0)) {
      return (
        <div className="py-12 text-center border-2 border-dashed border-ivory-300 rounded-2xl bg-ivory-50">
           <p className="font-bold text-navy-400">Tidak ada data yang sesuai filter.</p>
        </div>
      );
    }

    return keys.map(groupName => (
      <div key={groupName} className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100 fill-mode-both">
        {groupBy !== 'none' && <h3 className="text-xs font-extrabold text-navy-400 uppercase tracking-wider mb-3 px-1">{groupName}</h3>}
        <div className="space-y-3">
           {grouped[groupName].map(item => {
              if (type === 'iuran') return <IuranCard key={item.id} item={item} />;
              return <KasCard key={item.id} item={item} isUsaha={type === 'usaha'} />;
           })}
        </div>
      </div>
    ));
  };

  // KOMPONEN CARD
  const IuranCard = ({ item }: { item: any }) => (
    <div className="bg-white border border-ivory-200 p-4 rounded-xl shadow-sm flex items-center justify-between gap-4 transition-all hover:shadow-md">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-ivory-100 text-navy-500 rounded-full flex items-center justify-center shrink-0 border border-ivory-200">
          <Receipt size={18} />
        </div>
        <div>
          <h3 className="font-bold text-navy-900 text-sm md:text-base">{item.nama_iuran}</h3>
          <p className="text-[10px] text-navy-400 font-bold uppercase tracking-wider mt-0.5">Periode: {item.bulan} / {item.tahun}</p>
        </div>
      </div>
      <div className="text-right shrink-0">
        <p className="font-extrabold text-navy-900 text-sm md:text-base">{formatRupiah(item.nominal)}</p>
        <span className={`inline-block mt-1 text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded border ${item.status === 'lunas' ? 'bg-green-50 text-green-600 border-green-200' : item.status === 'menunggu_konfirmasi' ? 'bg-orange-50 text-orange-600 border-orange-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
          {item.status.replace('_', ' ')}
        </span>
      </div>
    </div>
  );

  const KasCard = ({ item, isUsaha }: { item: any, isUsaha: boolean }) => (
    <div className="bg-white border border-ivory-200 p-4 rounded-xl shadow-sm flex items-center justify-between gap-4 transition-all hover:shadow-md">
      <div className="flex items-center gap-4 min-w-0">
        <div className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center border shadow-sm ${item.tipe === 'masuk' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
          {item.tipe === 'masuk' ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
        </div>
        <div className="min-w-0">
          <h3 className="font-bold text-navy-900 text-sm md:text-base truncate">{item.keterangan}</h3>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <span className="text-[9px] font-extrabold text-navy-500 bg-ivory-100 px-1.5 py-0.5 rounded uppercase tracking-wider border border-ivory-200">
              {isUsaha ? item.nama_usaha : (item.kategori_kas?.nama || 'Lainnya')}
            </span>
            <span className="text-[10px] font-bold text-navy-400">{new Date(item.tanggal).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year: 'numeric'})}</span>
          </div>
        </div>
      </div>
      <div className="text-right shrink-0">
        <p className={`font-extrabold text-sm md:text-base ${item.tipe === 'masuk' ? 'text-emerald-600' : 'text-navy-900'}`}>
          {item.tipe === 'masuk' ? '+' : '-'}{formatRupiah(item.nominal)}
        </p>
      </div>
    </div>
  );

  const renderDynamicWidget = () => {
    if (activeTab === 'iuran') {
      const totalTunggakan = tagihanAktif.reduce((sum, t) => sum + Number(t.nominal), 0);
      const totalLunas = tagihanLunas.reduce((sum, t) => sum + Number(t.nominal), 0);
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-navy-900 p-6 md:p-8 rounded-2xl text-white shadow-md border border-navy-800 relative overflow-hidden">
            <Receipt className="absolute -right-4 -bottom-4 opacity-10" size={120} />
            <p className="text-[10px] font-bold text-navy-300 uppercase tracking-widest mb-2 relative z-10">Total Tunggakan Saya</p>
            <h2 className="text-3xl md:text-4xl font-extrabold relative z-10 text-gold">{formatRupiah(totalTunggakan)}</h2>
          </div>
          <div className="bg-white p-6 md:p-8 rounded-2xl border border-ivory-300 shadow-sm text-navy-900">
            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-2">Total Riwayat Lunas</p>
            <h2 className="text-3xl md:text-4xl font-extrabold">{formatRupiah(totalLunas)}</h2>
          </div>
        </div>
      );
    } else if (activeTab === 'kas') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-navy-900 p-6 rounded-2xl text-white shadow-md border border-navy-800 relative overflow-hidden">
            <Wallet className="absolute -right-4 -bottom-4 opacity-10" size={100} />
            <p className="text-[10px] font-bold text-navy-300 uppercase tracking-widest mb-2 relative z-10">Saldo Kas RT</p>
            <h2 className="text-2xl md:text-3xl font-extrabold relative z-10">{formatRupiah(kasRT.saldo)}</h2>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-ivory-300 shadow-sm text-navy-900">
            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-2">Pemasukan Bulan Ini</p>
            <h2 className="text-xl md:text-2xl font-extrabold">{formatRupiah(kasRT.totalMasuk)}</h2>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-ivory-300 shadow-sm text-navy-900">
            <p className="text-[10px] font-bold text-red-600 uppercase tracking-widest mb-2">Pengeluaran Bulan Ini</p>
            <h2 className="text-xl md:text-2xl font-extrabold">{formatRupiah(kasRT.totalKeluar)}</h2>
          </div>
        </div>
      );
    } else if (activeTab === 'usaha') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-6 rounded-2xl border border-ivory-300 shadow-sm relative overflow-hidden">
            <Store className="absolute -right-4 -bottom-4 opacity-[0.03]" size={100} />
            <p className="text-[10px] font-bold text-navy-400 uppercase tracking-widest mb-2 relative z-10">Saldo Badan Usaha</p>
            <h2 className="text-2xl md:text-3xl font-extrabold text-navy-900 relative z-10">{formatRupiah(usahaRT.saldo)}</h2>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-ivory-300 shadow-sm text-navy-900">
            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-2">Pemasukan Bulan Ini</p>
            <h2 className="text-xl md:text-2xl font-extrabold">{formatRupiah(usahaRT.totalMasuk)}</h2>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-ivory-300 shadow-sm text-navy-900">
            <p className="text-[10px] font-bold text-red-600 uppercase tracking-widest mb-2">Pengeluaran Bulan Ini</p>
            <h2 className="text-xl md:text-2xl font-extrabold">{formatRupiah(usahaRT.totalKeluar)}</h2>
          </div>
        </div>
      );
    }
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
        <h1 className="text-3xl font-extrabold text-navy-900 tracking-tight">Pusat Keuangan & Transparansi</h1>
        <p className="text-navy-500 mt-1 text-sm font-medium">Pantau kewajiban iuran dan transparansi kas secara real-time.</p>
      </div>

      {/* DYNAMIC WIDGET */}
      {renderDynamicWidget()}

      {/* TAB NAVIGATION */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar border-b border-ivory-300 pb-px">
        {[
          { id: 'iuran', label: 'Riwayat Iuran', icon: Receipt, count: tagihanAktif.length },
          { id: 'kas', label: 'Kas RT', icon: Wallet },
          { id: 'usaha', label: 'Badan Usaha', icon: Store }
        ].map(tab => (
          <button 
            key={tab.id} 
            onClick={() => setActiveTab(tab.id as TabType)} 
            className={`flex items-center gap-2 px-5 py-3 font-bold text-sm transition-all border-b-2 whitespace-nowrap shrink-0 ${activeTab === tab.id ? 'border-navy-900 text-navy-900' : 'border-transparent text-navy-400 hover:text-navy-700'}`}
          >
            <tab.icon size={16} /> {tab.label}
            {tab.count ? <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${activeTab === tab.id ? 'bg-red-100 text-red-600' : 'bg-red-500 text-white'}`}>{tab.count}</span> : null}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        
        {/* VIEW 1: RIWAYAT IURAN (SPESIAL KARENA ADA TAGIHAN AKTIF) */}
        {activeTab === 'iuran' && (
          <motion.div key="iuran" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
            
            {/* PINNED SECTION: TAGIHAN AKTIF (TIDAK IKUT TERFILTER) */}
            {tagihanAktif.length > 0 && (
              <div className="mb-10">
                <h3 className="text-xs font-extrabold text-red-600 uppercase tracking-wider mb-4 px-1 flex items-center gap-2">
                  <Clock size={16} /> Tagihan Aktif & Menunggu
                </h3>
                <div className="space-y-4">
                  {tagihanAktif.map((t) => (
                    <div key={t.id} className="bg-white border-2 border-red-100 p-5 md:p-6 rounded-2xl shadow-sm flex flex-col md:flex-row justify-between gap-5 md:items-center">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                            {t.bulan} / {t.tahun}
                          </span>
                          {t.status === 'menunggu_konfirmasi' && (
                            <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-orange-100 text-orange-700 flex items-center gap-1 border border-orange-200">
                              <Clock size={10} /> Sedang Diverifikasi
                            </span>
                          )}
                        </div>
                        <h3 className="font-bold text-navy-900 text-lg">{t.nama_iuran}</h3>
                        <p className="text-2xl font-extrabold text-navy-900 mt-1">{formatRupiah(t.nominal)}</p>
                        {t.batas_waktu && (
                          <p className="text-xs text-red-500 font-bold mt-1.5 flex items-center gap-1">
                            <Clock size={12} /> Jatuh Tempo: {new Date(t.batas_waktu).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        )}
                      </div>
                      
                      <div className="border-t border-ivory-100 md:border-t-0 pt-4 md:pt-0 shrink-0 w-full md:w-auto">
                        {t.status === 'belum_lunas' ? (
                          <button 
                            onClick={() => handleKonfirmasi(t.id)} disabled={isProcessing === t.id}
                            className="w-full md:w-auto px-6 py-3 bg-navy-900 text-ivory-50 font-bold rounded-xl hover:bg-navy-800 transition shadow-md flex items-center justify-center gap-2 disabled:opacity-70 active:scale-95"
                          >
                            {isProcessing === t.id ? <Loader2 size={18} className="animate-spin" /> : <Wallet size={18} />} Konfirmasi Pembayaran
                          </button>
                        ) : (
                          <button disabled className="w-full md:w-auto px-6 py-3 bg-ivory-100 border border-ivory-300 text-navy-400 font-bold rounded-xl cursor-not-allowed flex items-center justify-center gap-2">
                            <Clock size={18} /> Menunggu ACC Admin
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* FILTER BAR & DAFTAR LUNAS */}
            {renderFilterBar()}
            <div className="mt-6">
              {renderGroupedData(tagihanLunas, 'iuran')}
            </div>

          </motion.div>
        )}

        {/* VIEW 2: KAS RT */}
        {activeTab === 'kas' && (
          <motion.div key="kas" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
            {renderFilterBar()}
            <div className="mt-6">
              {renderGroupedData(transparansi.kasRT, 'kas')}
            </div>
          </motion.div>
        )}

        {/* VIEW 3: KAS BADAN USAHA */}
        {activeTab === 'usaha' && (
          <motion.div key="usaha" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
            {renderFilterBar()}
            <div className="mt-6">
              {renderGroupedData(transparansi.kasUsaha, 'usaha')}
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </motion.div>
  );
}