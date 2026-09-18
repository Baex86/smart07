'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '../../../../lib/supabaseClient';
import { Loader2, Plus, TrendingUp, TrendingDown, Wallet, X, Calendar, ArrowUpRight, ArrowDownRight, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function KeuanganPage() {
  const [arusKas, setArusKas] = useState<any[]>([]);
  const [kategoriList, setKategoriList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // State untuk Modal Input & Dropdown Kustom
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    tanggal: new Date().toISOString().split('T')[0],
    keterangan: '',
    tipe: 'keluar',
    nominal: '',
    kategori_id: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  // Handler Click-Outside untuk Custom Dropdown
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
      const [kasRes, katRes] = await Promise.all([
        supabase
          .from('arus_kas')
          .select('*, kategori_kas(nama)')
          .order('tanggal', { ascending: false })
          .order('created_at', { ascending: false }),
        supabase
          .from('kategori_kas')
          .select('*')
      ]);

      if (kasRes.data) setArusKas(kasRes.data);
      if (katRes.data) setKategoriList(katRes.data);
    } catch (error) {
      console.error('Error fetching data keuangan:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.kategori_id) return alert('Silakan pilih kategori terlebih dahulu.');
    
    setIsSubmitting(true);
    try {
      const payload = {
        tanggal: formData.tanggal,
        keterangan: formData.keterangan,
        tipe: formData.tipe,
        nominal: Number(formData.nominal),
        kategori_id: formData.kategori_id
      };

      const { error } = await supabase.from('arus_kas').insert([payload]);
      if (error) throw error;

      setFormData({
        tanggal: new Date().toISOString().split('T')[0],
        keterangan: '',
        tipe: 'keluar',
        nominal: '',
        kategori_id: ''
      });
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      console.error('Gagal menyimpan transaksi:', error);
      alert('Gagal menyimpan transaksi. Pastikan semua data terisi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
  };

  const totalMasuk = arusKas.filter(k => k.tipe === 'masuk').reduce((sum, k) => sum + Number(k.nominal), 0);
  const totalKeluar = arusKas.filter(k => k.tipe === 'keluar').reduce((sum, k) => sum + Number(k.nominal), 0);
  const saldoAkhir = totalMasuk - totalKeluar;
  const filteredKategori = kategoriList.filter(k => k.tipe === formData.tipe);
  const selectedKategoriName = kategoriList.find(k => k.id === formData.kategori_id)?.nama || 'Pilih kategori...';

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-navy-900 tracking-tight">Arus Kas</h1>
          <p className="text-navy-500 mt-1 text-sm font-medium">Buku besar pencatatan uang RT.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 px-5 py-3 bg-navy-900 text-ivory-50 font-bold rounded-xl hover:bg-navy-800 transition shadow-md shadow-navy-900/10 active:scale-95"
        >
          <Plus size={18} /> Tambah Transaksi
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-ivory-300 shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-xs font-bold text-navy-400 uppercase tracking-wider mb-1 flex items-center gap-1"><Wallet size={14}/> Saldo Kas Saat Ini</p>
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

      <div className="bg-ivory-50 border border-ivory-300 rounded-2xl shadow-sm overflow-hidden min-h-[300px]">
        {isLoading ? (
          <div className="flex justify-center items-center h-48">
            <Loader2 className="animate-spin text-navy-800" size={32} />
          </div>
        ) : arusKas.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center p-6">
            <div className="w-12 h-12 bg-ivory-200 rounded-full flex items-center justify-center text-navy-300 mb-3">
              <Wallet size={24} />
            </div>
            <p className="font-bold text-navy-900">Buku Kas Kosong</p>
            <p className="text-sm text-navy-500 mt-1">Belum ada catatan transaksi uang masuk atau keluar.</p>
          </div>
        ) : (
          <div className="divide-y divide-ivory-200">
            {arusKas.map((kas) => (
              <div key={kas.id} className="p-4 hover:bg-white transition-colors flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center shadow-inner ${kas.tipe === 'masuk' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {kas.tipe === 'masuk' ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-navy-900 truncate">{kas.keterangan}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] font-bold text-navy-400 bg-ivory-200 px-2 py-0.5 rounded tracking-wide uppercase">
                        {kas.kategori_kas?.nama || 'Tanpa Kategori'}
                      </span>
                      <span className="text-[11px] font-medium text-navy-500 flex items-center gap-1">
                        <Calendar size={10} /> {new Date(kas.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className={`font-extrabold ${kas.tipe === 'masuk' ? 'text-green-600' : 'text-navy-900'}`}>
                    {kas.tipe === 'masuk' ? '+' : '-'}{formatRupiah(kas.nominal)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-navy-900/60 backdrop-blur-sm z-50"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-3xl shadow-2xl z-50 flex flex-col max-h-[90vh]"
            >
              <div className="px-6 py-5 border-b border-ivory-200 flex justify-between items-center bg-ivory-50 shrink-0 rounded-t-3xl">
                <h2 className="text-xl font-bold text-navy-900">Catat Transaksi</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 bg-white rounded-full hover:bg-ivory-200 transition text-navy-400 shadow-sm border border-ivory-200">
                  <X size={18} />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto">
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="flex p-1 bg-ivory-100 rounded-xl">
                    <button 
                      type="button" 
                      onClick={() => setFormData({...formData, tipe: 'keluar', kategori_id: ''})}
                      className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${formData.tipe === 'keluar' ? 'bg-white text-red-600 shadow-sm' : 'text-navy-400 hover:text-navy-600'}`}
                    >
                      Pengeluaran
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setFormData({...formData, tipe: 'masuk', kategori_id: ''})}
                      className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${formData.tipe === 'masuk' ? 'bg-white text-green-600 shadow-sm' : 'text-navy-400 hover:text-navy-600'}`}
                    >
                      Pemasukan
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-navy-500 uppercase tracking-wider mb-1.5">Tanggal</label>
                    <input 
                      type="date" required name="tanggal" 
                      value={formData.tanggal} onChange={handleInputChange} 
                      className="w-full px-4 py-3 bg-ivory-50 border border-ivory-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-navy-900 font-medium" 
                    />
                  </div>

                  {/* CUSTOM DROPDOWN KATEGORI */}
                  <div className="relative" ref={dropdownRef}>
                    <label className="block text-xs font-bold text-navy-500 uppercase tracking-wider mb-1.5">Kategori</label>
                    <div 
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className={`w-full px-4 py-3 bg-ivory-50 border rounded-xl cursor-pointer flex justify-between items-center transition-all ${isDropdownOpen ? 'bg-white ring-2 ring-blue-500 border-blue-500' : 'border-ivory-300'}`}
                    >
                      <span className={formData.kategori_id ? 'text-navy-900 font-medium' : 'text-navy-400 font-medium'}>
                        {selectedKategoriName}
                      </span>
                      <ChevronDown size={18} className={`text-navy-400 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                    </div>

                    <AnimatePresence>
                      {isDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2 }}
                          className="absolute z-50 w-full mt-2 bg-white border border-ivory-200 rounded-xl shadow-xl max-h-48 overflow-y-auto py-1"
                        >
                          {filteredKategori.length > 0 ? (
                            filteredKategori.map(kat => (
                              <div
                                key={kat.id}
                                onClick={() => {
                                  setFormData({ ...formData, kategori_id: kat.id });
                                  setIsDropdownOpen(false);
                                }}
                                className="px-4 py-3 hover:bg-ivory-50 cursor-pointer text-navy-900 text-sm font-medium transition-colors border-b border-ivory-100 last:border-0"
                              >
                                {kat.nama}
                              </div>
                            ))
                          ) : (
                            <div className="px-4 py-3 text-navy-400 text-sm italic text-center">
                              Kategori {formData.tipe} belum ada.
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-navy-500 uppercase tracking-wider mb-1.5">Keterangan</label>
                    <input 
                      type="text" required name="keterangan" 
                      placeholder="Cth: Beli lampu pos satpam"
                      value={formData.keterangan} onChange={handleInputChange} 
                      className="w-full px-4 py-3 bg-ivory-50 border border-ivory-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-navy-900 font-medium" 
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-navy-500 uppercase tracking-wider mb-1.5">Nominal (Rp)</label>
                    <input 
                      type="number" required name="nominal" min="1"
                      placeholder="50000"
                      value={formData.nominal} onChange={handleInputChange} 
                      className="w-full px-4 py-3 bg-ivory-50 border border-ivory-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-navy-900 font-medium font-mono text-lg" 
                    />
                  </div>

                  <div className="pt-2 pb-4">
                    <button 
                      type="submit" disabled={isSubmitting} 
                      className="w-full py-3.5 bg-navy-900 text-ivory-50 rounded-xl font-bold tracking-wide hover:bg-navy-800 transition-all flex items-center justify-center gap-2 disabled:opacity-70 shadow-md"
                    >
                      {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : 'Simpan Transaksi'}
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