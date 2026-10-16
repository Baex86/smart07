'use client';

import { useEffect, useState } from 'react';
import { Wallet, Loader2, Clock, Receipt, Search, TrendingUp, TrendingDown } from 'lucide-react';
import { getIuranWarga, konfirmasiPembayaran, getRingkasanKasRT, getTransparansiKeuangan } from '../../actions/iuran';
import PageHeader from '@/components/warga/PageHeader';
import EmptyState from '@/components/warga/EmptyState';

type TabType = 'iuran' | 'kas';

export default function KeuanganWargaPage() {
  const [tagihan, setTagihan] = useState<any[]>([]);
  const [kasRT, setKasRT] = useState({ saldo: 0, totalMasuk: 0, totalKeluar: 0 });
  const [transparansi, setTransparansi] = useState({ kasRT: [] as any[] });

  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('iuran');

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'terbaru' | 'terlama' | 'tertinggi' | 'terendah'>('terbaru');
  const [groupBy, setGroupBy] = useState<'none' | 'bulan' | 'tipe'>('none');

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [resIuran, resKas, resTrans] = await Promise.all([
        getIuranWarga(),
        getRingkasanKasRT(),
        getTransparansiKeuangan()
      ]);

      if (resIuran.success && resIuran.data) setTagihan(resIuran.data);
      if (resKas.success) setKasRT({ saldo: resKas.saldo || 0, totalMasuk: resKas.totalMasuk || 0, totalKeluar: resKas.totalKeluar || 0 });
      if (resTrans.success) setTransparansi({ kasRT: resTrans.kasRT || [] });

    } catch (error) {
      console.error('Gagal memuat transparansi:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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


  const prosesData = (data: any[], type: TabType) => {
    let result = data.filter(item => {
      const text = type === 'iuran' ? item.nama_iuran : item.keterangan;
      return text?.toLowerCase().includes(searchQuery.toLowerCase());
    });

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
    <div className="flex flex-col md:flex-row gap-3 mb-6 bg-surface p-4 rounded-xl border border-navy-100 shadow-card">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400" size={18} />
        <input
          placeholder="Cari nama transaksi..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-paper border border-navy-100 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-accent text-navy-900"
        />
      </div>
      <div className="flex gap-2 w-full md:w-auto">
        <select value={sortBy} onChange={e => setSortBy(e.target.value as any)} className="flex-1 md:w-auto px-4 py-2.5 bg-paper border border-navy-100 rounded-lg text-xs font-semibold text-navy-700 outline-none focus:ring-2 focus:ring-accent appearance-none">
          <option value="terbaru">Sort: Terbaru</option>
          <option value="terlama">Sort: Terlama</option>
          <option value="tertinggi">Sort: Nominal Tertinggi</option>
          <option value="terendah">Sort: Nominal Terendah</option>
        </select>
        <select value={groupBy} onChange={e => setGroupBy(e.target.value as any)} className="flex-1 md:w-auto px-4 py-2.5 bg-paper border border-navy-100 rounded-lg text-xs font-semibold text-navy-700 outline-none focus:ring-2 focus:ring-accent appearance-none">
          <option value="none">Grup: Tidak Ada</option>
          <option value="bulan">Grup: Per Bulan</option>
          <option value="tipe">Grup: Tipe Transaksi</option>
        </select>
      </div>
    </div>
  );

  const IuranCard = ({ item }: { item: any }) => (
    <div className="bg-surface border border-navy-100 p-4 rounded-lg shadow-card flex items-center justify-between gap-4 transition-colors hover:border-navy-200">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-navy-50 text-navy-600 rounded-lg flex items-center justify-center shrink-0 border border-navy-100">
          <Receipt size={18} />
        </div>
        <div>
          <h3 className="font-semibold text-navy-900 text-sm md:text-base">{item.nama_iuran}</h3>
          <p className="text-[11px] text-navy-400 font-medium uppercase tracking-wide mt-0.5">Periode: {item.bulan} / {item.tahun}</p>
        </div>
      </div>
      <div className="text-right shrink-0">
        <p className="font-bold text-navy-900 text-sm md:text-base">{formatRupiah(item.nominal)}</p>
        <span className={`inline-block mt-1 text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-md border ${item.status === 'lunas' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : item.status === 'menunggu_konfirmasi' ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
          {item.status.replace('_', ' ')}
        </span>
      </div>
    </div>
  );

  const KasCard = ({ item }: { item: any }) => (
    <div className="bg-surface border border-navy-100 p-4 rounded-lg shadow-card flex items-center justify-between gap-4 transition-colors hover:border-navy-200">
      <div className="flex items-center gap-4 min-w-0">
        <div className={`w-10 h-10 shrink-0 rounded-lg flex items-center justify-center border ${item.tipe === 'masuk' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
          {item.tipe === 'masuk' ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
        </div>
        <div className="min-w-0">
          <h3 className="font-semibold text-navy-900 text-sm md:text-base truncate">{item.keterangan}</h3>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <span className="text-[10px] font-semibold text-navy-500 bg-navy-50 px-1.5 py-0.5 rounded-md uppercase tracking-wide border border-navy-100">
              {item.kategori_kas?.nama || 'Lainnya'}
            </span>
            <span className="text-[11px] font-medium text-navy-400">{new Date(item.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          </div>
        </div>
      </div>
      <div className="text-right shrink-0">
        <p className={`font-bold text-sm md:text-base ${item.tipe === 'masuk' ? 'text-emerald-600' : 'text-navy-900'}`}>
          {item.tipe === 'masuk' ? '+' : '-'}{formatRupiah(item.nominal)}
        </p>
      </div>
    </div>
  );

  const renderGroupedData = (dataToProcess: any[], type: TabType) => {
    const grouped = prosesData(dataToProcess, type);
    const keys = Object.keys(grouped);

    if (keys.length === 0 || (keys.length === 1 && grouped[keys[0]].length === 0)) {
      return <EmptyState title="Belum ada data" description="Tidak ada data yang sesuai dengan filter ini." />;
    }

    return keys.map(groupName => (
      <div key={groupName} className="mb-8">
        {groupBy !== 'none' && <h3 className="text-xs font-semibold text-navy-400 uppercase tracking-wide mb-3 px-1">{groupName}</h3>}
        <div className="space-y-3">
          {grouped[groupName].map(item => {
            if (type === 'iuran') return <IuranCard key={item.id} item={item} />;
            return <KasCard key={item.id} item={item} />;
          })}
        </div>
      </div>
    ));
  };

  const renderDynamicWidget = () => {
    if (activeTab === 'iuran') {
      const totalTunggakan = tagihanAktif.reduce((sum, t) => sum + Number(t.nominal), 0);
      const totalLunas = tagihanLunas.reduce((sum, t) => sum + Number(t.nominal), 0);
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-navy-900 p-6 md:p-8 rounded-xl text-white shadow-card border border-navy-800">
            <p className="text-[11px] font-semibold text-navy-300 uppercase tracking-wide mb-2">Total Tunggakan Saya</p>
            <h2 className="text-3xl md:text-4xl font-bold text-accent">{formatRupiah(totalTunggakan)}</h2>
          </div>
          <div className="bg-surface p-6 md:p-8 rounded-xl border border-navy-100 shadow-card text-navy-900">
            <p className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wide mb-2">Total Riwayat Lunas</p>
            <h2 className="text-3xl md:text-4xl font-bold">{formatRupiah(totalLunas)}</h2>
          </div>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-navy-900 p-6 rounded-xl text-white shadow-card border border-navy-800">
          <p className="text-[11px] font-semibold text-navy-300 uppercase tracking-wide mb-2">Saldo Kas RT</p>
          <h2 className="text-2xl md:text-3xl font-bold text-accent">{formatRupiah(kasRT.saldo)}</h2>
        </div>
        <div className="bg-surface p-6 rounded-xl border border-navy-100 shadow-card text-navy-900">
          <p className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wide mb-2">Pemasukan Bulan Ini</p>
          <h2 className="text-xl md:text-2xl font-bold">{formatRupiah(kasRT.totalMasuk)}</h2>
        </div>
        <div className="bg-surface p-6 rounded-xl border border-navy-100 shadow-card text-navy-900">
          <p className="text-[11px] font-semibold text-red-600 uppercase tracking-wide mb-2">Pengeluaran Bulan Ini</p>
          <h2 className="text-xl md:text-2xl font-bold">{formatRupiah(kasRT.totalKeluar)}</h2>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader2 className="animate-spin text-navy-600" size={40} />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24 lg:pb-0">
      <PageHeader
        title="Keuangan"
        description="Pantau tagihan iuran dan transparansi arus kas RT secara real-time."
      />

      {renderDynamicWidget()}

      <div className="flex gap-2 overflow-x-auto no-scrollbar border-b border-navy-100">
        {[
          { id: 'iuran', label: 'Iuran Saya', icon: Receipt, count: tagihanAktif.length },
          { id: 'kas', label: 'Arus Kas RT', icon: Wallet }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={`flex items-center gap-2 px-5 py-3 font-semibold text-sm transition-colors border-b-2 whitespace-nowrap shrink-0 ${activeTab === tab.id ? 'border-accent text-navy-900' : 'border-transparent text-navy-400 hover:text-navy-700'}`}
          >
            <tab.icon size={16} /> {tab.label}
            {tab.count ? <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${activeTab === tab.id ? 'bg-accent/15 text-navy-800' : 'bg-red-500 text-white'}`}>{tab.count}</span> : null}
          </button>
        ))}
      </div>

      {activeTab === 'iuran' && (
        <div key="iuran">
          {tagihanAktif.length > 0 && (
            <div className="mb-10">
              <h3 className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-4 px-1 flex items-center gap-2">
                <Clock size={16} /> Tagihan Aktif & Menunggu
              </h3>
              <div className="space-y-4">
                {tagihanAktif.map((t) => (
                  <div key={t.id} className="bg-surface border border-red-200 p-5 md:p-6 rounded-xl shadow-card flex flex-col md:flex-row justify-between gap-5 md:items-center">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[11px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-md bg-navy-50 text-navy-600 border border-navy-100">
                          {t.bulan} / {t.tahun}
                        </span>
                        {t.status === 'menunggu_konfirmasi' && (
                          <span className="text-[11px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-md bg-orange-50 text-orange-700 flex items-center gap-1 border border-orange-200">
                            <Clock size={12} /> Sedang Diverifikasi
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold text-navy-900 text-lg">{t.nama_iuran}</h3>
                      <p className="text-2xl font-bold text-navy-900 mt-1">{formatRupiah(t.nominal)}</p>
                      {t.batas_waktu && (
                        <p className="text-xs text-red-600 font-medium mt-1.5 flex items-center gap-1">
                          <Clock size={12} /> Jatuh Tempo: {new Date(t.batas_waktu).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      )}
                    </div>

                    <div className="border-t border-navy-100 md:border-t-0 pt-4 md:pt-0 shrink-0 w-full md:w-auto">
                      {t.status === 'belum_lunas' ? (
                        <button
                          onClick={() => handleKonfirmasi(t.id)} disabled={isProcessing === t.id}
                          className="w-full md:w-auto px-6 py-3 bg-navy-900 text-white font-semibold rounded-lg hover:bg-navy-800 transition flex items-center justify-center gap-2 disabled:opacity-70"
                        >
                          {isProcessing === t.id ? <Loader2 size={18} className="animate-spin" /> : <Wallet size={18} />} Konfirmasi Pembayaran
                        </button>
                      ) : (
                        <button disabled className="w-full md:w-auto px-6 py-3 bg-navy-50 border border-navy-100 text-navy-400 font-semibold rounded-lg cursor-not-allowed flex items-center justify-center gap-2">
                          <Clock size={18} /> Menunggu ACC Admin
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {renderFilterBar()}
          <div className="mt-6">
            {renderGroupedData(tagihanLunas, 'iuran')}
          </div>
        </div>
      )}

      {activeTab === 'kas' && (
        <div key="kas">
          {renderFilterBar()}
          <div className="mt-6">
            {renderGroupedData(transparansi.kasRT, 'kas')}
          </div>
        </div>
      )}
    </div>
  );
}
