'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, UserCheck, FileText, MessageSquare, Lightbulb, Database, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '../../../../lib/supabaseclient';

type TabType = 'akun' | 'data' | 'surat' | 'aduan' | 'usulan';

export default function LayananPage() {
  const [activeTab, setActiveTab] = useState<TabType>('akun');
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  const tabs = [
    { id: 'akun', label: 'Approval Akun', icon: UserCheck },
    { id: 'data', label: 'Update Data', icon: Database },
    { id: 'surat', label: 'Surat', icon: FileText },
    { id: 'aduan', label: 'Aduan', icon: MessageSquare },
    { id: 'usulan', label: 'Usulan', icon: Lightbulb },
  ];

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      setIsLoading(true);
      setData([]); // Reset data saat pindah tab

      try {
        if (activeTab === 'akun') {
          // Inner join buat narik data buku induk yang user-nya belum di-ACC
          const { data: result, error } = await supabase
            .from('buku_induk')
            .select(`*, users!inner(is_approved)`)
            .eq('users.is_approved', false);
          
          if (error) throw error;
          if (isMounted && result) setData(result);
        }
        // TODO: Tambahin logic fetch buat tab 'data', 'surat', dll di sini
      } catch (err) {
        console.error(`Gagal fetch data tab ${activeTab}:`, err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchData();
    return () => { isMounted = false; };
  }, [activeTab]);

  const handleApproveAkun = async (userId: string, bukuIndukId: string) => {
    setIsProcessing(bukuIndukId);
    try {
      const { error } = await supabase
        .from('users')
        .update({ is_approved: true })
        .eq('id', userId);
      
      if (error) throw error;
      
      // Hapus data dari state lokal biar card-nya langsung hilang dari antrean
      setData(prev => prev.filter(item => item.id !== bukuIndukId));
    } catch (err) {
      console.error('Gagal approve akun:', err);
      alert('Terjadi kesalahan saat verifikasi akun.');
    } finally {
      setIsProcessing(null);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 pb-20 md:pb-0">
      <div>
        <h1 className="text-3xl font-extrabold text-navy-900 tracking-tight">Pusat Layanan</h1>
        <p className="text-navy-500 mt-1 text-sm">Kelola semua antrean persetujuan dan tiket warga.</p>
      </div>

      {/* Tab Navigation (Scrollable di HP) */}
      <div className="flex overflow-x-auto hide-scrollbar gap-2 pb-2 -mx-4 px-4 md:mx-0 md:px-0">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl font-bold whitespace-nowrap transition-all duration-300 ${
                isActive 
                  ? 'bg-navy-900 text-gold shadow-md' 
                  : 'bg-ivory-50 text-navy-400 border border-ivory-300 hover:bg-ivory-100'
              }`}
            >
              <Icon size={18} />
              <span className="text-sm">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Konten Area */}
      <div className="min-h-[400px]">
        {isLoading ? (
          <div className="flex justify-center items-center h-32">
            <Loader2 className="animate-spin text-navy-800" size={32} />
          </div>
        ) : data.length === 0 ? (
          <div className="bg-ivory-50 border border-ivory-300 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center text-center">
            <CheckCircle className="text-green-500 mb-3" size={40} />
            <p className="text-navy-900 font-bold">Semua Selesai!</p>
            <p className="text-navy-400 text-sm mt-1">Tidak ada antrean tiket di kategori ini.</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeTab === 'akun' && data.map(item => (
                <motion.div 
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  key={item.id} 
                  className="bg-white border border-ivory-300 rounded-2xl p-5 shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-extrabold text-navy-900 text-lg">{item.nama_lengkap}</h3>
                      <span className="px-2 py-1 bg-red-50 text-red-600 text-[10px] font-bold rounded-md border border-red-100 uppercase tracking-wider">
                        Menunggu ACC
                      </span>
                    </div>
                    <p className="text-navy-600 text-sm font-medium mb-1">WA: {item.no_wa}</p>
                    <p className="text-navy-400 text-xs uppercase tracking-wider font-bold">Blok: {item.nomor_rumah}</p>
                  </div>
                  
                  <div className="mt-5 flex gap-2 border-t border-ivory-100 pt-4">
                    <button 
                      onClick={() => handleApproveAkun(item.user_id, item.id)}
                      disabled={isProcessing === item.id}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-lg font-bold text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
                    >
                      {isProcessing === item.id ? <Loader2 size={16} className="animate-spin" /> : <><CheckCircle size={16} /> Setujui Akun</>}
                    </button>
                    <button 
                      className="px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg font-bold transition-colors"
                      title="Tolak & Hapus"
                    >
                      <XCircle size={18} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        )}
      </div>
    </motion.div>
  );
}