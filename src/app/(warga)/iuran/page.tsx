'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, Loader2, CheckCircle2, Clock, Receipt, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { getIuranWarga, konfirmasiPembayaran, getRingkasanKasRT } from '../../actions/iuran';

export default function IuranWargaPage() {
  const [tagihan, setTagihan] = useState<any[]>([]);
  const [kasRT, setKasRT] = useState({ saldo: 0, totalMasuk: 0, totalKeluar: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'berjalan' | 'riwayat'>('berjalan');

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [resIuran, resKas] = await Promise.all([
        getIuranWarga(),
        getRingkasanKasRT()
      ]);

      if (resIuran.success && resIuran.data) setTagihan(resIuran.data);
      if (resKas.success) {
        // Fix TypeScript: Kasih fallback 0 kalau datanya undefined
        setKasRT({ 
          saldo: resKas.saldo || 0, 
          totalMasuk: resKas.totalMasuk || 0, 
          totalKeluar: resKas.totalKeluar || 0 
        });
      }
    } catch (error) {
      console.error('Gagal memuat iuran:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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
        <h1 className="text-3xl font-extrabold text-navy-900 tracking-tight">Iuran Kas</h1>
        <p className="text-navy-500 mt-1 text-sm font-medium">Pantau kewajiban bulanan dan transparansi kas RT.</p>
      </div>

      {/* WIDGET TRANSPARANSI KAS RT (Dengan Label Bulan Ini) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-ivory-300 shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-xs font-bold text-navy-400 uppercase tracking-wider mb-1 flex items-center gap-1.5"><Wallet size={14}/> Saldo Kas RT</p>
            <h2 className="text-2xl font-extrabold text-navy-900">{formatRupiah(kasRT.saldo)}</h2>
          </div>
          <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-gold/10 rounded-full blur-xl"></div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-ivory-300 shadow-sm flex flex-col justify-between">
          <p className="text-xs font-bold text-green-600 uppercase tracking-wider mb-1 flex items-center gap-1.5"><ArrowUpRight size={14}/> Pemasukan (Bulan Ini)</p>
          <h2 className="text-lg font-bold text-navy-900">{formatRupiah(kasRT.totalMasuk)}</h2>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-ivory-300 shadow-sm flex flex-col justify-between">
          <p className="text-xs font-bold text-red-600 uppercase tracking-wider mb-1 flex items-center gap-1.5"><ArrowDownRight size={14}/> Pengeluaran (Bulan Ini)</p>
          <h2 className="text-lg font-bold text-navy-900">{formatRupiah(kasRT.totalKeluar)}</h2>
        </div>
      </div>

      {/* TAB NAVIGATION */}
      <div className="flex bg-ivory-100 p-1 rounded-xl w-full max-w-sm">
        <button 
          onClick={() => setActiveTab('berjalan')}
          className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all flex justify-center items-center gap-2 ${activeTab === 'berjalan' ? 'bg-white text-navy-900 shadow-sm' : 'text-navy-400 hover:text-navy-700'}`}
        >
          <Receipt size={16} /> Tagihan Aktif
          {tagihanAktif.length > 0 && <span className={`ml-1 px-1.5 py-0.5 rounded text-[10px] ${activeTab === 'berjalan' ? 'bg-red-100 text-red-600' : 'bg-navy-200 text-white'}`}>{tagihanAktif.length}</span>}
        </button>
        <button 
          onClick={() => setActiveTab('riwayat')}
          className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all flex justify-center items-center gap-2 ${activeTab === 'riwayat' ? 'bg-white text-navy-900 shadow-sm' : 'text-navy-400 hover:text-navy-700'}`}
        >
          <CheckCircle2 size={16} /> Riwayat Lunas
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'berjalan' ? (
          <motion.div key="berjalan" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-4">
            {tagihanAktif.length === 0 ? (
              <div className="bg-ivory-50 border-2 border-dashed border-ivory-300 rounded-2xl p-8 text-center">
                <CheckCircle2 size={40} className="text-green-500 mx-auto mb-3" />
                <p className="font-bold text-navy-900">Semua Tagihan Beres</p>
                <p className="text-sm text-navy-400 mt-1">Tidak ada iuran kas yang menunggu pembayaran.</p>
              </div>
            ) : (
              tagihanAktif.map((t) => (
                <div key={t.id} className="bg-white border border-ivory-300 p-5 md:p-6 rounded-2xl shadow-sm flex flex-col md:flex-row justify-between gap-5 md:items-center">
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
              ))
            )}
          </motion.div>
        ) : (
          <motion.div key="riwayat" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-4">
            {tagihanLunas.length === 0 ? (
              <div className="bg-ivory-50 border-2 border-dashed border-ivory-300 rounded-2xl p-8 text-center">
                <p className="text-sm font-medium text-navy-400">Belum ada riwayat iuran yang lunas.</p>
              </div>
            ) : (
              tagihanLunas.map((t) => (
                <div key={t.id} className="bg-white border border-ivory-200 p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 opacity-80 hover:opacity-100 transition-opacity">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-50 text-green-600 rounded-full flex items-center justify-center shrink-0 border border-green-100">
                      <CheckCircle2 size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-navy-900 text-base">{t.nama_iuran}</h3>
                      <p className="text-xs text-navy-400 font-bold uppercase tracking-wider mt-1">Periode: {t.bulan} / {t.tahun}</p>
                    </div>
                  </div>
                  <div className="text-left md:text-right shrink-0 pl-16 md:pl-0">
                    <p className="font-extrabold text-navy-900 text-lg">{formatRupiah(t.nominal)}</p>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-green-600 mt-1 block bg-green-50 px-2 py-0.5 rounded w-fit md:ml-auto">LUNAS</span>
                  </div>
                </div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}