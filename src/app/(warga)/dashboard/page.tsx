'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { Bell, Wallet, FileText, MessageSquareWarning, Megaphone, Loader2, CheckCircle2, AlertCircle, ChevronRight, X, Receipt, Inbox } from 'lucide-react';
import Link from 'next/link';
import { getDashboardData } from '../../actions/dashboard';

export default function DashboardPage() {
  const [data, setData] = useState({
    profil: null as any,
    tagihanTerbaru: null as any,
    pengumuman: [] as any[]
  });
  const [isLoading, setIsLoading] = useState(true);
  const [greeting, setGreeting] = useState('Selamat Datang');

  // State untuk Modals
  const [isTagihanOpen, setIsTagihanOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 11) setGreeting('Selamat Pagi');
    else if (hour < 15) setGreeting('Selamat Siang');
    else if (hour < 19) setGreeting('Selamat Sore');
    else setGreeting('Selamat Malam');

    const fetchDashboardData = async () => {
      try {
        const dashboardData = await getDashboardData();
        setData({
          profil: dashboardData.profil,
          tagihanTerbaru: dashboardData.tagihan, // Kita selaraskan namanya di sini
          pengumuman: dashboardData.pengumuman
        });
      } catch (error) {
        console.error('Gagal memuat dashboard:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col justify-center items-center">
        <Loader2 className="animate-spin text-navy-800 mb-4" size={32} />
        <p className="text-navy-400 font-medium text-sm animate-pulse">Menyiapkan portal VIP...</p>
      </div>
    );
  }

  const isLunas = data.tagihanTerbaru?.status === 'lunas';
  const hasTagihan = !!data.tagihanTerbaru;

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-8 pb-24 md:pb-8">
      
      {/* HEADER SECTION */}
      <motion.div variants={itemVariants} className="flex justify-between items-center">
        <div>
          <p className="text-sm font-bold text-navy-400 uppercase tracking-wider mb-1">{greeting},</p>
          <h1 className="text-2xl md:text-3xl font-extrabold text-navy-900 tracking-tight leading-none">
            {data.profil?.nama_lengkap || 'Warga'}
          </h1>
        </div>
        <button 
          onClick={() => setIsNotifOpen(true)}
          className="relative p-3 bg-white text-navy-900 rounded-full border border-ivory-300 shadow-sm hover:shadow-md hover:bg-ivory-50 transition-all"
        >
          <Bell size={20} />
          {data.pengumuman.length > 0 && (
            <span className="absolute top-2.5 right-2.5 flex h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white"></span>
          )}
        </button>
      </motion.div>

      {/* HERO CARD: STATUS FINANSIAL */}
      <motion.div variants={itemVariants} className="relative overflow-hidden rounded-3xl bg-navy-900 text-ivory-50 shadow-2xl shadow-navy-900/20 p-6 md:p-8 flex flex-col justify-between min-h-[200px]">
        <div className="absolute -bottom-16 -right-16 w-48 h-48 bg-gold/20 rounded-full blur-3xl"></div>
        <div className="absolute top-0 right-1/4 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl"></div>

        <div className="relative z-10 flex justify-between items-start mb-6">
          <div className="flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-lg border border-white/10">
            <Wallet size={14} className="text-gold" />
            <span className="text-xs font-bold tracking-wider uppercase text-ivory-100">Iuran Kas Aktif</span>
          </div>
          <span className="text-sm font-bold text-navy-300 tracking-widest font-mono">
            BLOK {data.profil?.nomor_rumah || '-'}
          </span>
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tighter mb-2">
              {hasTagihan ? (isLunas ? 'Lunas' : 'Belum Lunas') : 'Aman'}
            </h2>
            <p className="text-sm font-medium flex items-center gap-2 text-navy-200">
              {hasTagihan 
                ? (isLunas ? <><CheckCircle2 size={16} className="text-emerald-400"/> Kewajiban bulan ini beres</> : <><AlertCircle size={16} className="text-red-400"/> Segera lunasi tagihan bulan ini</>)
                : <><CheckCircle2 size={16} className="text-emerald-400"/> Belum ada tagihan baru</>
              }
            </p>
          </div>
          <button 
            onClick={() => setIsTagihanOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white text-navy-900 font-bold rounded-xl hover:bg-ivory-100 transition-colors shrink-0 shadow-lg active:scale-95"
          >
            Lihat Tagihan <ChevronRight size={16} />
          </button>
        </div>
      </motion.div>

      {/* QUICK ACCESS GRID */}
      <motion.div variants={itemVariants}>
        <h3 className="text-sm font-extrabold text-navy-400 uppercase tracking-wider mb-4">Akses Cepat</h3>
        <div className="grid grid-cols-4 gap-3 md:gap-4">
          {[
            { name: 'Iuran', icon: Wallet, href: '/iuran', bg: 'bg-blue-50 text-blue-600' },
            { name: 'Surat', icon: FileText, href: '/surat', bg: 'bg-emerald-50 text-emerald-600' },
            { name: 'Aduan', icon: MessageSquareWarning, href: '/aduan', bg: 'bg-red-50 text-red-600' },
            { name: 'Fasilitas', icon: Megaphone, href: '/fasilitas', bg: 'bg-purple-50 text-purple-600' },
          ].map((item, idx) => (
            <Link key={idx} href={item.href} className="group flex flex-col items-center gap-2">
              <div className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center ${item.bg} border border-white shadow-sm transition-all duration-300 group-hover:scale-105 group-hover:shadow-md group-active:scale-95`}>
                <item.icon size={24} strokeWidth={2.5} />
              </div>
              <span className="text-xs font-bold text-navy-700">{item.name}</span>
            </Link>
          ))}
        </div>
      </motion.div>

      {/* MEGAPHONE: BLAST INFORMASI */}
      <motion.div variants={itemVariants} className="pt-4">
        <h3 className="text-sm font-extrabold text-navy-400 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Megaphone size={16} /> Papan Informasi
        </h3>
        
        {data.pengumuman.length > 0 ? (
          <div className="flex flex-col gap-4">
            {data.pengumuman.map((info) => (
              <div key={info.id} className="bg-white border border-ivory-300 p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden pl-6">
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gold"></div>
                <h4 className="font-extrabold text-navy-900 text-lg mb-1.5 leading-snug">{info.pesan}</h4>
                <p className="text-[10px] font-extrabold text-navy-400 uppercase tracking-wider flex items-center gap-1.5">
                  Berlaku s/d {new Date(info.batas_waktu).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-ivory-50 border-2 border-dashed border-ivory-300 rounded-2xl p-8 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-navy-300 mb-3 shadow-sm">
              <CheckCircle2 size={24} />
            </div>
            <p className="font-bold text-navy-900">Tidak ada pengumuman</p>
            <p className="text-xs text-navy-400 mt-1">Belum ada informasi terbaru dari pengurus RT.</p>
          </div>
        )}
      </motion.div>

      {/* MODAL: TAGIHAN */}
      <AnimatePresence>
        {isTagihanOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsTagihanOpen(false)} className="fixed inset-0 bg-navy-900/60 backdrop-blur-sm z-50" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-white rounded-3xl shadow-2xl z-50 flex flex-col overflow-hidden">
              <div className="bg-navy-900 p-6 text-ivory-50 flex justify-between items-center relative overflow-hidden">
                  <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-gold/20 rounded-full blur-2xl"></div>
                  <h3 className="font-extrabold text-lg flex items-center gap-2 relative z-10"><Receipt size={20} className="text-gold" /> Detail Tagihan</h3>
                  <button onClick={() => setIsTagihanOpen(false)} className="text-navy-300 hover:text-white transition-colors relative z-10"><X size={20} /></button>
              </div>
              <div className="p-6 space-y-4">
                 {hasTagihan ? (
                   <>
                     <div className="flex justify-between items-center border-b border-ivory-200 pb-3">
                       <span className="text-sm font-bold text-navy-400">Periode</span>
                       <span className="font-bold text-navy-900">{data.tagihanTerbaru.bulan} / {data.tagihanTerbaru.tahun}</span>
                     </div>
                     <div className="flex justify-between items-center border-b border-ivory-200 pb-3">
                       <span className="text-sm font-bold text-navy-400">Jenis Iuran</span>
                       <span className="font-bold text-navy-900">{data.tagihanTerbaru.nama_iuran}</span>
                     </div>
                     <div className="flex justify-between items-center border-b border-ivory-200 pb-3">
                       <span className="text-sm font-bold text-navy-400">Nominal</span>
                       <span className="font-extrabold text-lg text-navy-900">{formatRupiah(data.tagihanTerbaru.nominal)}</span>
                     </div>
                     <div className="flex justify-between items-center pt-1">
                       <span className="text-sm font-bold text-navy-400">Status</span>
                       <span className={`px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider rounded-md ${isLunas ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                         {isLunas ? 'Lunas' : 'Belum Lunas'}
                       </span>
                     </div>
                     {!isLunas && (
                       <Link href="/iuran" className="w-full mt-4 py-3 bg-navy-900 text-white font-bold rounded-xl hover:bg-navy-800 transition-colors shadow-md flex justify-center">
                         Menuju Kasir Pembayaran
                       </Link>
                     )}
                   </>
                 ) : (
                   <div className="text-center py-6">
                     <CheckCircle2 size={40} className="text-green-500 mx-auto mb-3" />
                     <p className="font-bold text-navy-900">Tidak ada tagihan aktif</p>
                     <p className="text-sm text-navy-400 mt-1">Semua kewajiban iuran Anda sudah beres.</p>
                   </div>
                 )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* MODAL: NOTIFIKASI */}
      <AnimatePresence>
        {isNotifOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsNotifOpen(false)} className="fixed inset-0 bg-navy-900/60 backdrop-blur-sm z-50" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-white rounded-3xl shadow-2xl z-50 flex flex-col overflow-hidden">
              <div className="px-6 py-5 border-b border-ivory-200 flex justify-between items-center bg-ivory-50">
                  <h3 className="font-extrabold text-navy-900 flex items-center gap-2"><Bell size={18} className="text-navy-400" /> Pusat Notifikasi</h3>
                  <button onClick={() => setIsNotifOpen(false)} className="p-1.5 bg-white rounded-full hover:bg-ivory-200 transition text-navy-400 shadow-sm border border-ivory-200"><X size={18} /></button>
              </div>
              <div className="p-6 h-64 overflow-y-auto">
                 <div className="flex flex-col items-center justify-center h-full text-center">
                   <div className="w-12 h-12 bg-ivory-100 rounded-full flex items-center justify-center text-navy-300 mb-3">
                     <Inbox size={24} />
                   </div>
                   <p className="font-bold text-navy-900">Belum ada notifikasi</p>
                   <p className="text-sm text-navy-400 mt-1">Notifikasi persetujuan surat dan konfirmasi bayar akan muncul di sini.</p>
                 </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </motion.div>
  );
}