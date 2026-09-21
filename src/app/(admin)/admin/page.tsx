'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../../lib/supabaseClient';
import {
  Wallet, TrendingUp, TrendingDown, AlertCircle,
  FileSignature, ChevronRight, CheckCircle2, Clock,
  MessageSquareWarning, Lightbulb, Loader2, Megaphone, Receipt
} from 'lucide-react';

export default function AdminDashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState({
    profile: null as any,
    arusKas: [] as any[],
    iuranKas: [] as any[],
    suratPengantar: [] as any[],
    aduanWarga: [] as any[],
    usulanWarga: [] as any[],
    pengumuman: [] as any[]
  });

  useEffect(() => {
    let isMounted = true;

    const fetchDashboardData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        let profile = null;

        if (user) {
          const { data } = await supabase.from('buku_induk').select('nama_lengkap').eq('user_id', user.id).single();
          profile = data;
        }

        const now = new Date().toISOString();

        const [
          arusKasRes, iuranKasRes, suratRes, aduanRes, usulanRes, pengumumanRes
        ] = await Promise.allSettled([
          supabase.from('arus_kas').select('tipe, nominal, keterangan, tanggal').order('tanggal', { ascending: false }),
          supabase.from('iuran_kas').select('status, nominal, nama_iuran, bulan, tahun, buku_induk(nama_lengkap)'),
          supabase.from('surat_pengantar').select('status, jenis_surat, buku_induk(nama_lengkap)').order('created_at', { ascending: false }),
          supabase.from('aduan_warga').select('status, judul, buku_induk(nama_lengkap)').order('created_at', { ascending: false }),
          supabase.from('usulan_warga').select('status, judul, buku_induk(nama_lengkap)').order('created_at', { ascending: false }),
          supabase.from('pengumuman').select('id, pesan, batas_waktu').gte('batas_waktu', now).order('batas_waktu', { ascending: true }).limit(4)
        ]);

        if (!isMounted) return;

        setData({
          profile,
          arusKas: arusKasRes.status === 'fulfilled' && arusKasRes.value.data ? arusKasRes.value.data : [],
          iuranKas: iuranKasRes.status === 'fulfilled' && iuranKasRes.value.data ? iuranKasRes.value.data : [],
          suratPengantar: suratRes.status === 'fulfilled' && suratRes.value.data ? suratRes.value.data : [],
          aduanWarga: aduanRes.status === 'fulfilled' && aduanRes.value.data ? aduanRes.value.data : [],
          usulanWarga: usulanRes.status === 'fulfilled' && usulanRes.value.data ? usulanRes.value.data : [],
          pengumuman: pengumumanRes.status === 'fulfilled' && pengumumanRes.value.data ? pengumumanRes.value.data : []
        });

      } catch (error) {
        console.error('Gagal mengambil data operasional:', error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchDashboardData();

    return () => {
      isMounted = false;
    };
  }, []);

  // --- KALKULASI METRIK WAKTU BERJALAN ---
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  // 1. Saldo Aktif (Keseluruhan Waktu)
  const totalPemasukanAll = data.arusKas.filter(item => item.tipe === 'masuk').reduce((sum, item) => sum + item.nominal, 0);
  const totalPengeluaranAll = data.arusKas.filter(item => item.tipe === 'keluar').reduce((sum, item) => sum + item.nominal, 0);
  const saldoAktif = totalPemasukanAll - totalPengeluaranAll;

  // 2. Arus Kas (Hanya Bulan Ini)
  const arusKasBulanIni = data.arusKas.filter(item => {
    const d = new Date(item.tanggal);
    return d.getMonth() + 1 === currentMonth && d.getFullYear() === currentYear;
  });
  const totalPemasukanBulanIni = arusKasBulanIni.filter(item => item.tipe === 'masuk').reduce((sum, item) => sum + item.nominal, 0);
  const totalPengeluaranBulanIni = arusKasBulanIni.filter(item => item.tipe === 'keluar').reduce((sum, item) => sum + item.nominal, 0);

  // 3. Performa Tagihan Iuran (Hanya Tagihan Bulan Ini)
  const iuranBulanIni = data.iuranKas.filter(item => item.bulan === currentMonth && item.tahun === currentYear);
  const iuranMasukBulanIni = iuranBulanIni.filter(item => item.status === 'lunas').reduce((sum, item) => sum + item.nominal, 0);
  const iuranBelumSetorBulanIni = iuranBulanIni.filter(item => item.status !== 'lunas').reduce((sum, item) => sum + item.nominal, 0);

  // Antrean Layanan Berjalan
  const pendingKas = data.iuranKas.filter(item => item.status === 'menunggu_konfirmasi').slice(0, 3);
  const pendingAduan = data.aduanWarga.filter(item => item.status === 'menunggu').slice(0, 3);
  const pendingSurat = data.suratPengantar.filter(item => item.status === 'menunggu').slice(0, 3);
  const pendingUsulan = data.usulanWarga.filter(item => item.status === 'ditampung').slice(0, 2);
  const mutasiTerakhir = data.arusKas.slice(0, 5);

  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
  };

  const isAllClear = pendingKas.length === 0 && pendingSurat.length === 0 && pendingAduan.length === 0 && pendingUsulan.length === 0;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="animate-spin text-navy-800" size={40} />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 w-full max-w-7xl mx-auto flex flex-col gap-8 pb-20 bg-ivory-50/30 min-h-screen">
      
      {/* Header & Informasi */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
        <div className="shrink-0 border-l-4 border-navy-900 pl-4">
          <h1 className="text-3xl font-extrabold text-navy-900 tracking-tight">Ringkasan Operasional</h1>
          <p className="text-navy-500 mt-1 text-sm font-medium">Selamat bertugas, {data.profile?.nama_lengkap || 'Admin'}.</p>
        </div>
        
        {data.pengumuman.length > 0 && (
          <div className="flex flex-col gap-3 w-full lg:max-w-md">
            {data.pengumuman.map((info) => (
              <div key={info.id} className="flex items-start gap-3 text-sm font-semibold text-amber-900 bg-amber-50/80 border border-amber-200/60 px-4 py-3 rounded-xl shadow-sm group cursor-default transition-colors hover:bg-amber-100/80">
                <Megaphone className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <span className="leading-snug text-balance">{info.pesan}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Row 1: Metrik Keuangan Utama */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100 fill-mode-both">
        
        {/* Main Balance Card (Premium Executive Look) */}
        <div className="lg:col-span-2 relative overflow-hidden rounded-2xl bg-navy-900 p-8 md:p-10 text-ivory-50 shadow-md flex flex-col justify-between border border-navy-800">
          {/* Subtle Watermark Icon */}
          <div className="absolute -right-8 -top-8 opacity-5 pointer-events-none">
            <Wallet size={240} />
          </div>
          
          <div className="relative z-10 flex justify-between items-start">
            <div>
              <p className="text-[10px] font-bold text-navy-300 uppercase tracking-[0.2em]">Total Kas Tersedia</p>
              <h2 className="text-4xl md:text-5xl font-extrabold mt-3 tracking-tight text-white">{formatRupiah(saldoAktif)}</h2>
            </div>
            <div className="p-3 bg-white/10 rounded-xl backdrop-blur-md border border-white/10">
              <Wallet className="h-6 w-6 text-gold" />
            </div>
          </div>
          
          <div className="relative z-10 mt-12 flex flex-col sm:flex-row gap-6 sm:gap-12 border-t border-navy-700/50 pt-6">
            <div>
              <p className="text-[10px] text-emerald-400 flex items-center gap-1.5 font-bold uppercase tracking-wider mb-1">
                <TrendingUp className="h-3 w-3" /> Pemasukan (Bulan Ini)
              </p>
              <p className="text-lg font-bold text-white">{formatRupiah(totalPemasukanBulanIni)}</p>
            </div>
            <div>
              <p className="text-[10px] text-red-400 flex items-center gap-1.5 font-bold uppercase tracking-wider mb-1">
                <TrendingDown className="h-3 w-3" /> Pengeluaran (Bulan Ini)
              </p>
              <p className="text-lg font-bold text-white">{formatRupiah(totalPengeluaranBulanIni)}</p>
            </div>
          </div>
        </div>

        {/* Secondary Metrics */}
        <div className="flex flex-col gap-6">
          <div className="flex-1 rounded-2xl bg-white p-6 md:p-8 border border-ivory-200 shadow-sm flex flex-col justify-center relative overflow-hidden group">
            <div className="flex justify-between items-start mb-4">
              <p className="text-[10px] font-bold text-navy-400 uppercase tracking-wider">Iuran Masuk (Bulan Ini)</p>
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            </div>
            <h3 className="text-2xl md:text-3xl font-extrabold text-navy-900">{formatRupiah(iuranMasukBulanIni)}</h3>
            <p className="text-xs text-navy-400 mt-2 font-medium">Total tagihan terbayar lunas</p>
          </div>

          <div className="flex-1 rounded-2xl bg-white p-6 md:p-8 border border-ivory-200 shadow-sm flex flex-col justify-center relative overflow-hidden group">
            <div className="flex justify-between items-start mb-4">
              <p className="text-[10px] font-bold text-navy-400 uppercase tracking-wider">Belum Setor (Bulan Ini)</p>
              <AlertCircle className="h-5 w-5 text-red-600" />
            </div>
            <h3 className="text-2xl md:text-3xl font-extrabold text-navy-900">{formatRupiah(iuranBelumSetorBulanIni)}</h3>
            <p className="text-xs text-navy-400 mt-2 font-medium">Total tunggakan warga</p>
          </div>
        </div>
      </div>

      {/* Row 2: Actionable Items & Mutasi */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200 fill-mode-both">
        
        {/* Antrean & Tugas */}
        <div className="rounded-2xl bg-white border border-ivory-200 shadow-sm flex flex-col h-full">
          <div className="px-6 py-5 border-b border-ivory-100 flex justify-between items-center bg-ivory-50/50 rounded-t-2xl">
            <h3 className="font-extrabold text-navy-900 text-sm uppercase tracking-wide flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-gold" /> Tindakan Admin
            </h3>
          </div>
          
          <div className="p-6 flex-1 flex flex-col gap-3">
            {isAllClear ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
                <CheckCircle2 className="h-12 w-12 text-ivory-300 mb-3" />
                <p className="text-sm font-bold text-navy-900">Seluruh tugas selesai</p>
                <p className="text-xs text-navy-400 mt-1">Tidak ada pengajuan atau aduan yang tertunda.</p>
              </div>
            ) : (
              <>
                {pendingAduan.map((item: any, i) => (
                  <div key={`aduan-${i}`} className="flex items-center justify-between gap-4 p-4 rounded-xl border border-ivory-200 bg-white hover:border-red-300 transition-colors cursor-pointer group shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="p-2.5 rounded-lg bg-ivory-50 border border-ivory-200 text-red-600 shrink-0">
                        <MessageSquareWarning className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-navy-900">{item.buku_induk?.nama_lengkap}</p>
                        <p className="text-xs text-navy-500 mt-0.5 line-clamp-1">{item.judul}</p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-ivory-400 group-hover:text-navy-900 transition-colors" />
                  </div>
                ))}
                
                {pendingKas.map((item: any, i) => (
                  <div key={`kas-${i}`} className="flex items-center justify-between gap-4 p-4 rounded-xl border border-ivory-200 bg-white hover:border-navy-300 transition-colors cursor-pointer group shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="p-2.5 rounded-lg bg-ivory-50 border border-ivory-200 text-blue-600 shrink-0">
                        <Wallet className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-navy-900">{item.buku_induk?.nama_lengkap}</p>
                        <p className="text-xs text-navy-500 mt-0.5">{item.nama_iuran}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-navy-900">{formatRupiah(item.nominal)}</span>
                      <ChevronRight className="h-4 w-4 text-ivory-400 group-hover:text-navy-900 transition-colors" />
                    </div>
                  </div>
                ))}
                
                {pendingSurat.map((item: any, i) => (
                  <div key={`surat-${i}`} className="flex items-center justify-between gap-4 p-4 rounded-xl border border-ivory-200 bg-white hover:border-navy-300 transition-colors cursor-pointer group shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="p-2.5 rounded-lg bg-ivory-50 border border-ivory-200 text-navy-900 shrink-0">
                        <FileSignature className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-navy-900">{item.buku_induk?.nama_lengkap}</p>
                        <p className="text-xs text-navy-500 mt-0.5">Surat: {item.jenis_surat}</p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-ivory-400 group-hover:text-navy-900 transition-colors" />
                  </div>
                ))}

                {pendingUsulan.map((item: any, i) => (
                  <div key={`usulan-${i}`} className="flex items-center justify-between gap-4 p-4 rounded-xl border border-ivory-200 bg-white hover:border-navy-300 transition-colors cursor-pointer group shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="p-2.5 rounded-lg bg-ivory-50 border border-ivory-200 text-emerald-600 shrink-0">
                        <Lightbulb className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-navy-900">{item.buku_induk?.nama_lengkap}</p>
                        <p className="text-xs text-navy-500 mt-0.5">Usulan: {item.judul}</p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-ivory-400 group-hover:text-navy-900 transition-colors" />
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Mutasi Kas Terakhir */}
        <div className="rounded-2xl bg-white border border-ivory-200 shadow-sm flex flex-col h-full">
          <div className="px-6 py-5 border-b border-ivory-100 flex justify-between items-center bg-ivory-50/50 rounded-t-2xl">
            <h3 className="font-extrabold text-navy-900 text-sm uppercase tracking-wide flex items-center gap-2">
              <Receipt className="h-4 w-4 text-navy-900" /> Riwayat Mutasi
            </h3>
            <Link href="/admin/keuangan" className="text-[10px] font-bold text-navy-500 uppercase tracking-wider hover:text-navy-900 transition-colors">Lihat Semua</Link>
          </div>
          
          <div className="p-6 flex-1 flex flex-col gap-1">
            {mutasiTerakhir.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-12 text-navy-400">
                <Receipt className="h-10 w-10 text-ivory-300 mb-3" />
                <p className="text-sm font-medium">Belum ada mutasi kas tercatat.</p>
              </div>
            ) : (
              mutasiTerakhir.map((item, i) => (
                <div key={i} className="flex items-center justify-between border-b border-ivory-100 py-3.5 last:border-0 hover:bg-ivory-50/50 px-2 -mx-2 rounded-lg transition-colors">
                  <div>
                    <p className="text-sm font-bold text-navy-900">{item.keterangan}</p>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-navy-400 mt-1">
                      {new Date(item.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                  <span className={`text-sm font-extrabold ${item.tipe === 'masuk' ? 'text-emerald-600' : 'text-navy-900'}`}>
                    {item.tipe === 'masuk' ? '+' : '-'}{formatRupiah(item.nominal)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}