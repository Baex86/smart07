'use client';

import { useEffect, useState } from 'react';
import { Loader2, Plus, TrendingUp, TrendingDown, Store, X, Calendar, ArrowUpRight, ArrowDownRight, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getKasBadanUsaha, catatKasBadanUsaha, hapusKasBadanUsaha } from '@/app/actions/badan_usaha';

export default function BadanUsahaAdminPage() {
  const [arusKas, setArusKas] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ tanggal: new Date().toISOString().split('T')[0], nama_usaha: '', keterangan: '', tipe: 'masuk', nominal: '' });

  const fetchData = async () => {
    setIsLoading(true);
    const result = await getKasBadanUsaha();
    if (result.success) setArusKas(result.data || []);
    setIsLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleManualKasSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing('kas');
    try {
      const payload = { ...formData, nominal: Number(formData.nominal) };
      const result = await catatKasBadanUsaha(payload);
      if (!result.success) throw new Error(result.message);
      setFormData({ tanggal: new Date().toISOString().split('T')[0], nama_usaha: '', keterangan: '', tipe: 'masuk', nominal: '' });
      setIsModalOpen(false);
      fetchData();
    } catch (error: any) { alert(`Gagal: ${error.message}`); } finally { setIsProcessing(null); }
  };

  const handleHapus = async (id: string) => {
    if (!confirm('Yakin ingin menghapus transaksi ini?')) return;
    setIsProcessing(id);
    const res = await hapusKasBadanUsaha(id);
    if (res.success) fetchData();
    else alert('Gagal menghapus data.');
    setIsProcessing(null);
  };

  const formatRupiah = (angka: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
  const totalMasuk = arusKas.filter(k => k.tipe === 'masuk').reduce((sum, k) => sum + Number(k.nominal), 0);
  const totalKeluar = arusKas.filter(k => k.tipe === 'keluar').reduce((sum, k) => sum + Number(k.nominal), 0);
  const saldoAkhir = totalMasuk - totalKeluar;

  if (isLoading) return <div className="flex justify-center items-center h-[70vh]"><Loader2 className="animate-spin text-navy-800" size={40} /></div>;

  return (
    <div className="p-6 md:p-8 w-full max-w-6xl mx-auto flex flex-col gap-6 pb-24">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-navy-900 tracking-tight">Kas Badan Usaha</h1>
          <p className="text-navy-500 mt-1 text-sm font-medium">Laporan keuangan independen untuk unit usaha RT.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center justify-center gap-2 px-5 py-3 bg-navy-900 text-ivory-50 font-bold rounded-xl hover:bg-navy-800 transition shadow-md">
          <Plus size={18} /> Catat Transaksi Usaha
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-navy-900 p-6 md:p-8 rounded-2xl border border-navy-800 shadow-md flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-gold/20 rounded-full blur-2xl"></div>
          <div className="relative z-10">
            <p className="text-[10px] font-bold text-navy-300 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Store size={14}/> Saldo Usaha</p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white">{formatRupiah(saldoAkhir)}</h2>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-ivory-300 shadow-sm flex flex-col justify-center">
          <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-1 flex items-center gap-1"><ArrowUpRight size={14}/> Total Pemasukan</p>
          <h2 className="text-2xl font-extrabold text-navy-900">{formatRupiah(totalMasuk)}</h2>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-ivory-300 shadow-sm flex flex-col justify-center">
          <p className="text-[10px] font-bold text-red-600 uppercase tracking-wider mb-1 flex items-center gap-1"><ArrowDownRight size={14}/> Total Pengeluaran</p>
          <h2 className="text-2xl font-extrabold text-navy-900">{formatRupiah(totalKeluar)}</h2>
        </div>
      </div>

      <div className="bg-white border border-ivory-300 rounded-2xl shadow-sm overflow-hidden">
        {arusKas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Store size={40} className="text-ivory-300 mb-3" />
            <p className="font-bold text-navy-900">Belum Ada Transaksi</p>
          </div>
        ) : (
          <div className="divide-y divide-ivory-100">
            {arusKas.map((kas) => (
              <div key={kas.id} className="p-5 hover:bg-ivory-50/50 transition-colors flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className={`w-12 h-12 shrink-0 rounded-xl flex items-center justify-center shadow-sm ${kas.tipe === 'masuk' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                    {kas.tipe === 'masuk' ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-navy-900 truncate">{kas.keterangan}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-extrabold text-navy-700 bg-ivory-200 px-2 py-0.5 rounded tracking-wide uppercase">{kas.nama_usaha}</span>
                      <span className="text-[10px] font-bold text-navy-400 flex items-center gap-1"><Calendar size={10} /> {new Date(kas.tanggal).toLocaleDateString('id-ID')}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <p className={`font-extrabold text-lg ${kas.tipe === 'masuk' ? 'text-emerald-600' : 'text-navy-900'}`}>{kas.tipe === 'masuk' ? '+' : '-'}{formatRupiah(kas.nominal)}</p>
                  <button onClick={() => handleHapus(kas.id)} disabled={isProcessing === kas.id} className="p-2 text-navy-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    {isProcessing === kas.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="fixed inset-0 bg-navy-900/60 backdrop-blur-sm z-50" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-3xl shadow-2xl z-50 flex flex-col max-h-[90vh]">
              <div className="px-6 py-5 border-b border-ivory-200 flex justify-between items-center bg-ivory-50 shrink-0 rounded-t-3xl">
                <h2 className="text-xl font-bold text-navy-900">Catat Transaksi Usaha</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 bg-white rounded-full hover:bg-ivory-200 transition text-navy-400"><X size={18} /></button>
              </div>
              <div className="p-6 overflow-y-auto">
                <form onSubmit={handleManualKasSubmit} className="space-y-4">
                  <div className="flex p-1 bg-ivory-100 rounded-xl mb-2">
                    <button type="button" onClick={() => setFormData({...formData, tipe: 'masuk'})} className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${formData.tipe === 'masuk' ? 'bg-white text-emerald-600 shadow-sm' : 'text-navy-400'}`}>Pemasukan</button>
                    <button type="button" onClick={() => setFormData({...formData, tipe: 'keluar'})} className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${formData.tipe === 'keluar' ? 'bg-white text-red-600 shadow-sm' : 'text-navy-400'}`}>Pengeluaran</button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-navy-500 uppercase tracking-wider mb-1.5">Tanggal</label>
                      <input type="date" required value={formData.tanggal} onChange={e => setFormData({...formData, tanggal: e.target.value})} className="w-full px-4 py-3 bg-ivory-50 border border-ivory-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-navy-400 outline-none text-navy-900 font-medium text-sm" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-navy-500 uppercase tracking-wider mb-1.5">Nama Usaha / Unit</label>
                      <input type="text" required placeholder="Cth: Koperasi RT" value={formData.nama_usaha} onChange={e => setFormData({...formData, nama_usaha: e.target.value})} className="w-full px-4 py-3 bg-ivory-50 border border-ivory-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-navy-400 outline-none text-navy-900 font-medium text-sm" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-navy-500 uppercase tracking-wider mb-1.5">Keterangan Transaksi</label>
                    <input type="text" required placeholder="Cth: Sewa Tenda 2 Hari" value={formData.keterangan} onChange={e => setFormData({...formData, keterangan: e.target.value})} className="w-full px-4 py-3 bg-ivory-50 border border-ivory-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-navy-400 outline-none text-navy-900 font-medium text-sm" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-navy-500 uppercase tracking-wider mb-1.5">Nominal (Rp)</label>
                    <input type="number" required placeholder="500000" value={formData.nominal} onChange={e => setFormData({...formData, nominal: e.target.value})} className="w-full px-4 py-3 bg-ivory-50 border border-ivory-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-navy-400 outline-none text-navy-900 font-extrabold text-lg font-mono" />
                  </div>
                  <button type="submit" disabled={isProcessing === 'kas'} className="w-full py-3.5 bg-navy-900 text-ivory-50 rounded-xl font-bold hover:bg-navy-800 transition flex justify-center gap-2 shadow-md mt-2">
                    {isProcessing === 'kas' ? <Loader2 size={18} className="animate-spin" /> : 'Simpan Transaksi Usaha'}
                  </button>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}