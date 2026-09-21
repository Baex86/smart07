'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { Bell, Wallet, FileText, MessageSquareWarning, Megaphone, Loader2, CheckCircle2, AlertCircle, ChevronRight, X, Receipt, Inbox, Clock, Lightbulb, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { getDashboardData } from '../../actions/dashboard';

export default function DashboardPage() {
  const [data, setData] = useState({
    profil: null as any,
    tagihanTerbaru: null as any,
    pengumuman: [] as any[],
    notifikasi: [] as any[]
  });
  const [isLoading, setIsLoading] = useState(true);
  const [greeting, setGreeting] = useState('Selamat Datang');

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
          tagihanTerbaru: dashboardData.tagihan, 
          pengumuman: dashboardData.pengumuman,
          notifikasi: dashboardData.notifikasi || []
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
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka || 0);
  };

  // --- LOGIKA HAPUS NOTIFIKASI ---
  const handleHapusNotif = (id: string) => {
    setData(prev => ({
      ...prev,
      notifikasi: prev.notifikasi.filter(item => item.id !== id)
    }));
  };

  const handleHapusSemuaNotif = () => {
    setData(prev => ({ ...prev, notifikasi: [] }));
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
      <div className="min-h-[70vh] flex flex-col justify-center items-center">
        <Loader2 className="animate-spin text-navy-800 mb-4" size={32} />
        <p className="text-navy-500 font-bold text-sm animate-pulse tracking-wide">Menyiapkan Portal VIP...</p>
      </div>
    );
  }

  const tagihan = data.tagihanTerbaru;
  const isLunas = !tagihan;

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="pb-24 md:pb-8 flex flex-col gap-6 lg:gap-8">
      
      {/* HEADER SECTION */}
      <motion.div variants={itemVariants} className="flex justify-between items-end pb-2 border-b border-ivory-300">
        <div>
          <p className="text-xs font-extrabold text-gold uppercase tracking-widest mb-1">{greeting},</p>
          <h1 className="text-3xl md:text-4xl font-extrabold text-navy-900 tracking-tight leading-none">
            {data.profil?.nama_lengkap || 'Warga'}
          </h1>
        </div>
        <button 
          onClick={() => setIsNotifOpen(true)}
          className="relative p-3.5 bg-white text-navy-900 rounded-full border border-ivory-300 shadow-sm hover:shadow-md hover:border-navy-300 transition-all group"
        >
          <Bell size={22} className="group-hover:rotate-12 transition-transform" />
          {(data.pengumuman.length > 0 || data.notifikasi.length > 0) && (
            <span className="absolute top-3 right-3 flex h-3 w-3 rounded-full bg-red-500 ring-4 ring-white"></span>
          )}
        </button>
      </motion.div>

      {/* BENTO BOX UTAMA */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        
        <div className="lg:col-span-8 flex flex-col gap-6 lg:gap-8">
          <motion.div variants={itemVariants} className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-navy-900 via-navy-800 to-navy-900 text-ivory-50 shadow-2xl shadow-navy-900/20 p-8 md:p-10 flex flex-col justify-between min-h-[220px] border border-navy-700">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-gold/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute -bottom-24 -left-12 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
            
            <div className="relative z-10 flex justify-between items-center mb-8">
              <div className="flex items-center gap-2.5 px-4 py-1.5 bg-white/10 backdrop-blur-md rounded-full border border-white/10">
                <Wallet size={16} className="text-gold" />
                <span className="text-xs font-bold tracking-widest uppercase text-ivory-50">Iuran Kas Aktif</span>
              </div>
              <span className="text-xs font-bold text-navy-300 tracking-[0.2em] font-mono border border-navy-700 px-3 py-1 rounded-md bg-navy-900/50">
                BLOK {data.profil?.nomor_rumah || '-'}
              </span>
            </div>

            <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-8">
              <div>
                {isLunas ? (
                  <>
                    <h2 className="text-4xl md:text-5xl font-extrabold tracking-tighter mb-3 text-white">Lunas</h2>
                    <p className="text-sm font-bold flex items-center gap-2 text-emerald-400 bg-emerald-400/10 w-fit px-3 py-1 rounded-full border border-emerald-400/20">
                      <CheckCircle2 size={16} /> Kewajiban bulan ini tuntas
                    </p>
                  </>
                ) : (
                  <>
                    <h2 className="text-4xl md:text-5xl font-extrabold tracking-tighter mb-4 text-gold drop-shadow-lg">
                      {formatRupiah(tagihan.nominal)}
                    </h2>
                    <div className="space-y-2">
                      <p className="text-sm font-bold flex items-center gap-2 text-ivory-100 uppercase tracking-widest">
                        <Receipt size={16} className="text-navy-300" /> {tagihan.nama_iuran}
                      </p>
                      {tagihan.status === 'menunggu_konfirmasi' ? (
                        <p className="text-sm font-bold flex items-center gap-2 text-orange-400 bg-orange-400/10 w-fit px-3 py-1 rounded-full border border-orange-400/20">
                          <Clock size={16} /> Sedang diverifikasi Admin
                        </p>
                      ) : (
                        <p className="text-sm font-bold flex items-center gap-2 text-red-400 bg-red-400/10 w-fit px-3 py-1 rounded-full border border-red-400/20">
                          <AlertCircle size={16} /> Jatuh Tempo: {tagihan.batas_waktu ? new Date(tagihan.batas_waktu).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                        </p>
                      )}
                    </div>
                  </>
                )}
              </div>
              
              <button 
                onClick={() => setIsTagihanOpen(true)}
                className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-6 py-4 bg-white text-navy-900 font-extrabold rounded-2xl hover:bg-ivory-200 transition-all shrink-0 shadow-lg active:scale-95 group"
              >
                Lihat Tagihan <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="bg-white rounded-3xl p-6 md:p-8 border border-ivory-300 shadow-sm flex-1">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-ivory-100">
              <div className="p-2.5 bg-gold/10 rounded-xl text-gold"><Megaphone size={20} /></div>
              <h3 className="text-base font-extrabold text-navy-900 uppercase tracking-widest">Papan Informasi</h3>
            </div>
            
            {data.pengumuman.length > 0 ? (
              <div className="flex flex-col gap-4">
                {data.pengumuman.map((info) => (
                  <div key={info.id} className="group bg-ivory-50 border border-ivory-200 p-5 md:p-6 rounded-2xl shadow-sm hover:shadow-md transition-all relative overflow-hidden pl-6 md:pl-8">
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gold group-hover:w-2 transition-all"></div>
                    <h4 className="font-extrabold text-navy-900 text-lg mb-2 leading-snug">{info.pesan}</h4>
                    <p className="text-[10px] font-extrabold text-navy-400 uppercase tracking-widest flex items-center gap-1.5">
                      Berlaku s/d {new Date(info.batas_waktu).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border-2 border-dashed border-ivory-200 rounded-2xl p-10 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-ivory-100 rounded-full flex items-center justify-center text-navy-300 mb-4 shadow-inner">
                  <CheckCircle2 size={32} />
                </div>
                <p className="font-extrabold text-navy-900 text-lg">Suasana Terkendali</p>
                <p className="text-sm text-navy-400 mt-1 font-medium">Belum ada informasi atau instruksi terbaru dari RT.</p>
              </div>
            )}
          </motion.div>
        </div>

        <div className="lg:col-span-4 flex flex-col">
          <motion.div variants={itemVariants} className="bg-white rounded-3xl p-6 md:p-8 border border-ivory-300 shadow-sm h-full flex flex-col">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-ivory-100">
              <div className="p-2.5 bg-navy-100 rounded-xl text-navy-700"><Lightbulb size={20} /></div>
              <h3 className="text-base font-extrabold text-navy-900 uppercase tracking-widest">Akses Layanan</h3>
            </div>

            <div className="grid grid-cols-4 lg:grid-cols-2 gap-3 md:gap-4 flex-1 content-start">
              {[
                { name: 'Iuran Kas', icon: Wallet, href: '/iuran' },
                { name: 'Surat', icon: FileText, href: '/surat' },
                { name: 'Aduan', icon: MessageSquareWarning, href: '/aduan' },
                { name: 'Usulan', icon: Lightbulb, href: '/usulan' },
              ].map((item, idx) => (
                <Link key={idx} href={item.href} className="group flex flex-col items-center justify-center gap-3 p-4 rounded-2xl bg-ivory-50 border border-ivory-200 hover:bg-navy-900 hover:border-navy-900 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                  <div className="text-navy-600 group-hover:text-gold transition-colors">
                    <item.icon size={28} strokeWidth={2} />
                  </div>
                  <span className="text-[11px] md:text-xs font-extrabold text-navy-800 group-hover:text-white uppercase tracking-wider text-center line-clamp-1">{item.name}</span>
                </Link>
              ))}
            </div>
          </motion.div>
        </div>

      </div>

      {/* MODAL: TAGIHAN */}
      <AnimatePresence>
        {isTagihanOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsTagihanOpen(false)} className="fixed inset-0 bg-navy-900/60 backdrop-blur-md z-50" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-white rounded-3xl shadow-2xl z-50 flex flex-col overflow-hidden">
              <div className="bg-navy-900 p-6 text-ivory-50 flex justify-between items-center relative overflow-hidden">
                  <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-gold/20 rounded-full blur-2xl"></div>
                  <h3 className="font-extrabold text-lg flex items-center gap-2 relative z-10"><Receipt size={20} className="text-gold" /> Detail Tagihan</h3>
                  <button onClick={() => setIsTagihanOpen(false)} className="p-1.5 rounded-full hover:bg-white/10 text-navy-300 hover:text-white transition-colors relative z-10"><X size={20} /></button>
              </div>
              <div className="p-6 space-y-5">
                 {!isLunas ? (
                   <>
                     <div className="flex justify-between items-center border-b border-ivory-100 pb-4">
                       <span className="text-xs font-bold text-navy-400 uppercase tracking-wider">Periode</span>
                       <span className="font-extrabold text-navy-900">{tagihan.bulan} / {tagihan.tahun}</span>
                     </div>
                     <div className="flex justify-between items-center border-b border-ivory-100 pb-4">
                       <span className="text-xs font-bold text-navy-400 uppercase tracking-wider">Jenis Iuran</span>
                       <span className="font-extrabold text-navy-900">{tagihan.nama_iuran}</span>
                     </div>
                     <div className="flex justify-between items-center border-b border-ivory-100 pb-4">
                       <span className="text-xs font-bold text-navy-400 uppercase tracking-wider">Nominal</span>
                       <span className="font-extrabold text-2xl text-navy-900">{formatRupiah(tagihan.nominal)}</span>
                     </div>
                     {tagihan.batas_waktu && (
                       <div className="flex justify-between items-center border-b border-ivory-100 pb-4">
                         <span className="text-xs font-bold text-navy-400 uppercase tracking-wider">Jatuh Tempo</span>
                         <span className="font-extrabold text-red-600 bg-red-50 px-2 py-1 rounded-md">{new Date(tagihan.batas_waktu).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                       </div>
                     )}
                     <div className="flex justify-between items-center pt-2">
                       <span className="text-xs font-bold text-navy-400 uppercase tracking-wider">Status</span>
                       <span className={`px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-widest rounded-md border ${tagihan.status === 'menunggu_konfirmasi' ? 'bg-orange-50 border-orange-200 text-orange-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                         {tagihan.status === 'menunggu_konfirmasi' ? 'Menunggu ACC' : 'Belum Lunas'}
                       </span>
                     </div>
                     <Link href="/iuran" className="w-full mt-6 py-4 bg-navy-900 text-white font-extrabold rounded-xl hover:bg-navy-800 transition-all shadow-md flex justify-center hover:-translate-y-1">
                       Menuju Kasir Pembayaran
                     </Link>
                   </>
                 ) : (
                   <div className="text-center py-8">
                     <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-100">
                       <CheckCircle2 size={40} className="text-emerald-500" />
                     </div>
                     <p className="font-extrabold text-navy-900 text-xl">Tidak ada tagihan aktif</p>
                     <p className="text-sm text-navy-500 mt-2 font-medium leading-relaxed">Semua kewajiban iuran Anda bulan ini sudah diselesaikan.</p>
                     <Link href="/iuran" className="w-full mt-8 py-3.5 bg-ivory-100 text-navy-900 font-extrabold rounded-xl hover:bg-ivory-200 transition-colors flex justify-center">
                       Lihat Riwayat Lunas
                     </Link>
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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsNotifOpen(false)} className="fixed inset-0 bg-navy-900/60 backdrop-blur-md z-50" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-3xl shadow-2xl z-50 flex flex-col overflow-hidden max-h-[85vh]">
              <div className="px-6 py-5 border-b border-ivory-200 flex justify-between items-center bg-ivory-50 shrink-0">
                  <div className="flex items-center gap-3">
                    <h3 className="font-extrabold text-navy-900 flex items-center gap-2"><Bell size={18} className="text-navy-400" /> Pusat Notifikasi</h3>
                    {data.notifikasi.length > 0 && (
                      <button 
                        onClick={handleHapusSemuaNotif}
                        className="text-[11px] font-bold text-red-600 hover:text-red-700 bg-red-50 px-2.5 py-1 rounded-lg border border-red-100 transition-colors"
                      >
                        Hapus Semua
                      </button>
                    )}
                  </div>
                  <button onClick={() => setIsNotifOpen(false)} className="p-1.5 bg-white rounded-full hover:bg-ivory-200 transition text-navy-400 shadow-sm border border-ivory-200"><X size={18} /></button>
              </div>
              <div className="p-6 overflow-y-auto bg-ivory-50/50">
                 {data.notifikasi.length === 0 ? (
                   <div className="flex flex-col items-center justify-center py-10 text-center">
                     <div className="w-16 h-16 bg-white border border-ivory-200 shadow-sm rounded-full flex items-center justify-center text-navy-300 mb-4">
                       <Inbox size={28} />
                     </div>
                     <p className="font-extrabold text-navy-900 text-lg">Kotak Masuk Bersih</p>
                     <p className="text-sm text-navy-500 mt-2 font-medium leading-relaxed">Notifikasi persetujuan surat dan konfirmasi bayar akan muncul di sini.</p>
                   </div>
                 ) : (
                   <div className="flex flex-col gap-3">
                     {data.notifikasi.map((item: any) => (
                        <div key={item.id} className="bg-white p-4 rounded-2xl border border-ivory-200 shadow-sm flex items-start justify-between gap-3 transition-all hover:shadow-md group">
                           <div className="flex gap-3 items-start min-w-0">
                             <div className={`p-2.5 rounded-xl shrink-0 ${item.tipe === 'surat' ? (item.status === 'selesai' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600') : 'bg-blue-50 text-blue-600'}`}>
                                {item.tipe === 'surat' ? <FileText size={20}/> : <Wallet size={20}/>}
                             </div>
                             <div className="min-w-0">
                               <p className="text-sm font-bold text-navy-900 leading-snug">{item.judul}</p>
                               <p className="text-[10px] font-extrabold text-navy-400 uppercase tracking-widest mt-1.5">
                                 {new Date(item.waktu).toLocaleString('id-ID', {day: 'numeric', month: 'short', hour: '2-digit', minute:'2-digit'})}
                               </p>
                             </div>
                           </div>
                           <button 
                             onClick={() => handleHapusNotif(item.id)}
                             className="text-navy-300 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors shrink-0"
                             title="Hapus notifikasi ini"
                           >
                             <Trash2 size={16} />
                           </button>
                        </div>
                     ))}
                   </div>
                 )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </motion.div>
  );
}