'use client';

import { useEffect, useState } from 'react';
import { Bell, Wallet, FileText, LayoutGrid, Store, Megaphone, Loader2, CheckCircle2, AlertCircle, ChevronRight, X, Receipt, Inbox, Clock, Lightbulb, Trash2, MessageSquareWarning } from 'lucide-react';
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

    (async () => {
      try {
        const d = await getDashboardData();
        setData({ profil: d.profil, tagihanTerbaru: d.tagihan, pengumuman: d.pengumuman, notifikasi: d.notifikasi || [] });
      } catch (e) { console.error('Gagal memuat dashboard:', e); }
      finally { setIsLoading(false); }
    })();
  }, []);

  const formatRupiah = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n || 0);

  const handleHapusNotif = (id: string) => setData(prev => ({ ...prev, notifikasi: prev.notifikasi.filter(i => i.id !== id) }));
  const handleHapusSemuaNotif = () => setData(prev => ({ ...prev, notifikasi: [] }));

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col justify-center items-center">
        <Loader2 className="animate-spin text-navy-400 mb-4" size={32} />
        <p className="text-navy-500 font-semibold text-sm">Menyiapkan beranda...</p>
      </div>
    );
  }

  const tagihan = data.tagihanTerbaru;
  const isLunas = !tagihan;

  const quickMenu = [
    { name: 'Keuangan', icon: Wallet, href: '/keuangan' },
    { name: 'Surat', icon: FileText, href: '/surat' },
    { name: 'Layanan', icon: LayoutGrid, href: '/layanan' },
    { name: 'Badan Usaha', icon: Store, href: '/badan-usaha' },
  ];

  return (
    <div className="flex flex-col gap-6 lg:gap-8">
      {/* HEADER */}
      <div className="flex justify-between items-end pb-4 border-b border-navy-100">
        <div>
          <p className="text-xs font-semibold text-accent-600 uppercase tracking-widest mb-1">{greeting},</p>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-navy-900 tracking-tight leading-none">
            {data.profil?.nama_lengkap || 'Warga'}
          </h1>
        </div>
        <button onClick={() => setIsNotifOpen(true)} className="relative p-3 bg-surface text-navy-900 rounded-lg border border-navy-100 shadow-card hover:border-navy-200 transition">
          <Bell size={21} />
          {(data.pengumuman.length > 0 || data.notifikasi.length > 0) && (
            <span className="absolute top-2.5 right-2.5 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-surface"></span>
          )}
        </button>
      </div>

      {/* GRID UTAMA */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Kartu Tagihan (Hero) */}
          <div className="rounded-xl bg-navy-900 text-white p-6 md:p-8 flex flex-col justify-between min-h-[210px] border border-navy-900">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-full border border-white/10">
                <Wallet size={15} className="text-accent" />
                <span className="text-[11px] font-semibold tracking-wide uppercase">Iuran Kas Aktif</span>
              </div>
              <span className="text-xs font-semibold text-navy-300 border border-navy-700 px-3 py-1 rounded-md bg-navy-800">
                BLOK {data.profil?.nomor_rumah || '-'}
              </span>
            </div>

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                {isLunas ? (
                  <>
                    <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight mb-3">Lunas</h2>
                    <p className="text-sm font-semibold flex items-center gap-2 text-emerald-400 bg-emerald-400/10 w-fit px-3 py-1 rounded-full border border-emerald-400/20">
                      <CheckCircle2 size={15} /> Kewajiban bulan ini tuntas
                    </p>
                  </>
                ) : (
                  <>
                    <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight mb-3 text-accent">{formatRupiah(tagihan.nominal)}</h2>
                    <div className="space-y-2">
                      <p className="text-sm font-semibold flex items-center gap-2 text-navy-100 uppercase tracking-wide">
                        <Receipt size={15} className="text-navy-300" /> {tagihan.nama_iuran}
                      </p>
                      {tagihan.status === 'menunggu_konfirmasi' ? (
                        <p className="text-sm font-semibold flex items-center gap-2 text-orange-400 bg-orange-400/10 w-fit px-3 py-1 rounded-full border border-orange-400/20">
                          <Clock size={15} /> Sedang diverifikasi Admin
                        </p>
                      ) : (
                        <p className="text-sm font-semibold flex items-center gap-2 text-red-400 bg-red-400/10 w-fit px-3 py-1 rounded-full border border-red-400/20">
                          <AlertCircle size={15} /> Jatuh Tempo: {tagihan.batas_waktu ? new Date(tagihan.batas_waktu).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                        </p>
                      )}
                    </div>
                  </>
                )}
              </div>
              <button onClick={() => setIsTagihanOpen(true)} className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-surface text-navy-900 font-semibold rounded-lg hover:bg-navy-100 transition shrink-0">
                Lihat Tagihan <ChevronRight size={17} />
              </button>
            </div>
          </div>

          {/* Papan Informasi */}
          <div className="bg-surface rounded-xl p-6 border border-navy-100 shadow-card flex-1">
            <div className="flex items-center gap-2.5 mb-5 pb-4 border-b border-navy-50">
              <div className="p-2 bg-accent/15 rounded-lg text-navy-800"><Megaphone size={18} /></div>
              <h3 className="font-display font-bold text-navy-900 uppercase tracking-wide text-sm">Papan Informasi</h3>
            </div>
            {data.pengumuman.length > 0 ? (
              <div className="flex flex-col gap-3">
                {data.pengumuman.map((info) => (
                  <div key={info.id} className="bg-paper border border-navy-100 p-5 rounded-lg relative overflow-hidden pl-6">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-accent"></div>
                    <h4 className="font-display font-semibold text-navy-900 leading-snug">{info.pesan}</h4>
                    <p className="text-[11px] font-medium text-navy-400 uppercase tracking-wide mt-2">
                      Berlaku s/d {new Date(info.batas_waktu).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border border-dashed border-navy-200 rounded-lg p-10 flex flex-col items-center justify-center text-center">
                <div className="h-14 w-14 bg-navy-50 rounded-lg flex items-center justify-center text-navy-400 mb-3"><Inbox size={24} /></div>
                <p className="font-display font-semibold text-navy-800">Tidak ada pengumuman</p>
              </div>
            )}
          </div>
        </div>

        {/* Akses Layanan */}
        <div className="lg:col-span-4">
          <div className="bg-surface rounded-xl p-6 border border-navy-100 shadow-card h-full flex flex-col">
            <div className="flex items-center gap-2.5 mb-5 pb-4 border-b border-navy-50">
              <div className="p-2 bg-navy-50 rounded-lg text-navy-600"><Lightbulb size={18} /></div>
              <h3 className="font-display font-bold text-navy-900 uppercase tracking-wide text-sm">Akses Layanan</h3>
            </div>
            <div className="grid grid-cols-2 gap-3 flex-1 content-start">
              {quickMenu.map((item, idx) => (
                <Link key={idx} href={item.href} className="group flex flex-col items-center justify-center gap-3 p-4 rounded-lg bg-paper border border-navy-100 hover:bg-navy-900 hover:border-navy-900 transition-colors">
                  <div className="text-navy-600 group-hover:text-accent transition-colors"><item.icon size={26} strokeWidth={1.75} /></div>
                  <span className="text-xs font-semibold text-navy-800 group-hover:text-white uppercase tracking-wide text-center line-clamp-1">{item.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL TAGIHAN */}
      {isTagihanOpen && (
        <>
          <div onClick={() => setIsTagihanOpen(false)} className="fixed inset-0 bg-navy-900/60 backdrop-blur-sm z-50" />
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-surface rounded-xl shadow-pop z-50 overflow-hidden">
            <div className="bg-navy-900 p-6 text-white flex justify-between items-center">
              <h3 className="font-display font-bold flex items-center gap-2"><Receipt size={19} className="text-accent" /> Detail Tagihan</h3>
              <button onClick={() => setIsTagihanOpen(false)} className="p-1.5 rounded-lg hover:bg-white/10 text-navy-300 hover:text-white transition"><X size={19} /></button>
            </div>
            <div className="p-6 space-y-4">
              {!isLunas ? (
                <>
                  <div className="flex justify-between items-center border-b border-navy-50 pb-3"><span className="text-xs font-semibold text-navy-400 uppercase tracking-wide">Periode</span><span className="font-semibold text-navy-900">{tagihan.bulan} / {tagihan.tahun}</span></div>
                  <div className="flex justify-between items-center border-b border-navy-50 pb-3"><span className="text-xs font-semibold text-navy-400 uppercase tracking-wide">Jenis Iuran</span><span className="font-semibold text-navy-900">{tagihan.nama_iuran}</span></div>
                  <div className="flex justify-between items-center border-b border-navy-50 pb-3"><span className="text-xs font-semibold text-navy-400 uppercase tracking-wide">Nominal</span><span className="font-display font-bold text-xl text-navy-900">{formatRupiah(tagihan.nominal)}</span></div>
                  {tagihan.batas_waktu && (
                    <div className="flex justify-between items-center border-b border-navy-50 pb-3"><span className="text-xs font-semibold text-navy-400 uppercase tracking-wide">Jatuh Tempo</span><span className="font-semibold text-red-600">{new Date(tagihan.batas_waktu).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span></div>
                  )}
                  <Link href="/keuangan" className="w-full mt-4 py-3 bg-navy-900 text-white font-semibold rounded-lg hover:bg-navy-800 transition flex justify-center">Menuju Kasir Pembayaran</Link>
                </>
              ) : (
                <div className="text-center py-6">
                  <div className="h-16 w-16 bg-emerald-50 rounded-lg flex items-center justify-center mx-auto mb-3 border border-emerald-100"><CheckCircle2 size={32} className="text-emerald-500" /></div>
                  <p className="font-display font-bold text-navy-900 text-lg">Tidak ada tagihan aktif</p>
                  <p className="text-sm text-navy-500 mt-1.5">Semua kewajiban iuran Anda bulan ini sudah selesai.</p>
                  <Link href="/keuangan" className="w-full mt-6 py-3 bg-paper text-navy-900 font-semibold rounded-lg hover:bg-navy-100 transition flex justify-center border border-navy-100">Lihat Riwayat</Link>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* MODAL NOTIFIKASI */}
      {isNotifOpen && (
        <>
          <div onClick={() => setIsNotifOpen(false)} className="fixed inset-0 bg-navy-900/60 backdrop-blur-sm z-50" />
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-surface rounded-xl shadow-pop z-50 flex flex-col overflow-hidden max-h-[85vh]">
            <div className="px-5 py-4 border-b border-navy-100 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2.5">
                <h3 className="font-display font-bold text-navy-900 flex items-center gap-2"><Bell size={17} className="text-navy-400" /> Pusat Notifikasi</h3>
                {data.notifikasi.length > 0 && (
                  <button onClick={handleHapusSemuaNotif} className="text-[11px] font-semibold text-red-600 hover:text-red-700 bg-red-50 px-2.5 py-1 rounded-md border border-red-100 transition">Hapus Semua</button>
                )}
              </div>
              <button onClick={() => setIsNotifOpen(false)} className="p-1.5 rounded-lg hover:bg-navy-50 transition text-navy-400"><X size={18} /></button>
            </div>
            <div className="p-5 overflow-y-auto">
              {data.notifikasi.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="h-14 w-14 bg-navy-50 rounded-lg flex items-center justify-center text-navy-400 mb-3"><Inbox size={26} /></div>
                  <p className="font-display font-semibold text-navy-900">Kotak Masuk Bersih</p>
                  <p className="text-sm text-navy-500 mt-1.5">Notifikasi persetujuan surat, konfirmasi bayar, dan tanggapan aduan/usulan akan muncul di sini.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {data.notifikasi.map((item: any) => {
                    const iconMap: Record<string, any> = {
                      surat: item.status === 'selesai' ? { icon: FileText, cls: 'bg-emerald-50 text-emerald-600' } : { icon: FileText, cls: 'bg-red-50 text-red-600' },
                      iuran: { icon: Wallet, cls: 'bg-navy-50 text-navy-600' },
                      aduan: { icon: MessageSquareWarning, cls: 'bg-orange-50 text-orange-600' },
                      usulan: { icon: Lightbulb, cls: 'bg-amber-50 text-amber-600' }
                    };
                    const info = iconMap[item.tipe] || { icon: Bell, cls: 'bg-navy-50 text-navy-600' };
                    const IconC = info.icon;
                    return (
                    <div key={item.id} className="bg-paper p-4 rounded-lg border border-navy-100 flex items-start justify-between gap-3">
                      <div className="flex gap-3 items-start min-w-0">
                        <div className={`p-2.5 rounded-lg shrink-0 ${info.cls}`}>
                          <IconC size={19} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-navy-900 leading-snug">{item.judul}</p>
                          <p className="text-[11px] font-medium text-navy-400 uppercase tracking-wide mt-1">{new Date(item.waktu).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                      </div>
                      <button onClick={() => handleHapusNotif(item.id)} className="text-navy-300 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition shrink-0" title="Hapus"><Trash2 size={15} /></button>
                    </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
