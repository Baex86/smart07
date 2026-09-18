'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Wallet, FileText, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '../../../lib/supabaseclient';

export default function AdminDashboard() {
  const [statsData, setStatsData] = useState({
    totalWarga: 0,
    saldoKas: 0,
    suratPending: 0,
    aduanAktif: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data, error } = await supabase.rpc('get_admin_dashboard_stats');
        if (error) throw error;
        
        if (data) {
          setStatsData({
            totalWarga: data.total_warga || 0,
            saldoKas: data.saldo_kas || 0,
            suratPending: data.surat_pending || 0,
            aduanAktif: data.aduan_aktif || 0
          });
        }
      } catch (err) {
        console.error('Gagal mengambil data dashboard:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(angka);
  };

  const stats = [
    { title: 'Total Warga', value: statsData.totalWarga.toString(), icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: 'Saldo Kas RT', value: formatRupiah(statsData.saldoKas), icon: Wallet, color: 'text-green-600', bg: 'bg-green-50' },
    { title: 'Surat Pending', value: statsData.suratPending.toString(), icon: FileText, color: 'text-orange-600', bg: 'bg-orange-50' },
    { title: 'Aduan Aktif', value: statsData.aduanAktif.toString(), icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50' },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-3xl font-extrabold text-navy-900 tracking-tight">Ruang Kendali RT</h1>
        <p className="text-navy-500 mt-1 text-sm">Ringkasan data operasional RT 07 Griya Permata Meri.</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-32">
          <Loader2 className="animate-spin text-navy-800" size={32} />
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="bg-ivory-50 p-5 rounded-2xl border border-ivory-300 shadow-sm flex flex-col gap-3">
                <div className={`w-10 h-10 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center`}>
                  <Icon size={20} strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-navy-400 text-xs font-bold uppercase tracking-wider">{stat.title}</p>
                  <p className="text-2xl font-extrabold text-navy-900 mt-1">{stat.value}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      <div className="bg-ivory-50 border border-ivory-300 rounded-2xl p-6 min-h-[300px] shadow-sm flex items-center justify-center">
        <p className="text-navy-400 font-medium">Data Buku Induk dan Arus Kas akan terhubung di sini.</p>
      </div>
    </motion.div>
  );
}