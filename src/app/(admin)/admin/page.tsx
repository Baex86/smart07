'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../../lib/supabaseClient';
import {
  Wallet, TrendingUp, TrendingDown, AlertCircle,
  FileSignature, ChevronRight, CheckCircle2, Clock,
  MessageSquareWarning, Lightbulb, Loader2, Megaphone
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
          supabase.from('iuran_kas').select('status, nominal, nama_iuran, buku_induk(nama_lengkap)'),
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

  const totalPemasukan = data.arusKas.filter(item => item.tipe === 'masuk').reduce((sum, item) => sum + item.nominal, 0);
  const totalPengeluaran = data.arusKas.filter(item => item.tipe === 'keluar').reduce((sum, item) => sum + item.nominal, 0);
  const saldoAktif = totalPemasukan - totalPengeluaran;
  const totalPiutang = data.iuranKas.filter(item => item.status === 'belum_lunas').reduce((sum, item) => sum + item.nominal, 0);
  const totalMenungguKonfirmasi = data.iuranKas.filter(item => item.status === 'menunggu_konfirmasi').reduce((sum, item) => sum + item.nominal, 0);

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
      <div className="flex justify-center items-center h-[70vh]">
        <Loader2 className="animate-spin text-slate-800" size={40} />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 w-full max-w-7xl mx-auto flex flex-col gap-8 pb-20">
      
      {/* Header dengan Multiple Blast Info dari Database */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
        <div className="shrink-0">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Ringkasan Operasional</h1>
          <p className="text-slate-500 mt-1 text-sm">Selamat bertugas, {data.profile?.nama_lengkap || 'Admin'}. Berikut pantauan terkini.</p>
        </div>
        
        {/* Render Pengumuman Maksimal 4 (Hilang total kalau kosong) */}
        {data.pengumuman.length > 0 && (
          <div className="flex flex-col gap-2 w-full lg:max-w-md">
            {data.pengumuman.map((info) => (
              <div key={info.id} className="flex items-start gap-3 text-sm font-semibold text-blue-800 bg-blue-50 border border-blue-200 px-4 py-3 rounded-xl shadow-sm animate-pulse group cursor-default">
                <Megaphone className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                <span className="leading-snug text-balance">{info.pesan}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Row 1: Metrik Keuangan Utama */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100 fill-mode-both">
        
        {/* Main Balance Card */}
        <div className="lg:col-span-2 relative overflow-hidden rounded-3xl bg-slate-900 p-8 text-white shadow-xl flex flex-col justify-between">
          <div className="relative z-10 flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-400">Saldo Kas RT Tersedia</p>
              <h2 className="text-4xl md:text-5xl font-bold mt-2 tracking-tight">{formatRupiah(saldoAktif)}</h2>
            </div>
            <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-sm">
              <Wallet className="h-8 w-8 text-white" />
            </div>
          </div>
          
          <div className="relative z-10 mt-8 flex flex-col sm:flex-row gap-4 sm:gap-8 border-t border-slate-700/50 pt-6">
            <div>
              <p className="text-xs text-slate-400 flex items-center gap-1"><TrendingUp className="h-3 w-3 text-emerald-400" /> Total Pemasukan</p>
              <p className="text-lg font-semibold mt-1">{formatRupiah(totalPemasukan)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 flex items-center gap-1"><TrendingDown className="h-3 w-3 text-red-400" /> Total Pengeluaran</p>
              <p className="text-lg font-semibold mt-1">{formatRupiah(totalPengeluaran)}</p>
            </div>
          </div>
          <div className="absolute -bottom-16 -right-16 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl"></div>
          <div className="absolute top-0 right-1/4 h-32 w-32 rounded-full bg-emerald-500/10 blur-3xl"></div>
        </div>

        {/* Secondary Metrics */}
        <div className="flex flex-col gap-6">
          <div className="flex-1 rounded-3xl bg-white p-6 border border-slate-200 shadow-sm flex flex-col justify-center relative overflow-hidden">
            <div className="flex justify-between items-start mb-2">
              <p className="text-sm font-semibold text-slate-500">Konfirmasi Kas</p>
              <div className="h-8 w-8 rounded-full bg-orange-50 flex items-center justify-center text-orange-600">
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-slate-900">{formatRupiah(totalMenungguKonfirmasi)}</h3>
            <p className="text-xs text-orange-600 mt-2 font-medium">Dari {pendingKas.length} setoran warga</p>
          </div>
          <div className="flex-1 rounded-3xl bg-white p-6 border border-slate-200 shadow-sm flex flex-col justify-center">
            <div className="flex justify-between items-start mb-2">
              <p className="text-sm font-semibold text-slate-500">Estimasi Piutang</p>
              <div className="h-8 w-8 rounded-full bg-red-50 flex items-center justify-center text-red-600">
                <AlertCircle className="h-4 w-4" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-slate-900">{formatRupiah(totalPiutang)}</h3>
            <p className="text-xs text-slate-400 mt-2">Iuran kas belum dibayar</p>
          </div>
        </div>
      </div>

      {/* Row 2: Actionable Items & Mutasi */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200 fill-mode-both">
        
        {/* Butuh Perhatian */}
        <div className="rounded-3xl bg-white border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              Butuh Tindakan Admin
            </h3>
          </div>
          
          <div className="p-6 flex-1 flex flex-col gap-4">
            {isAllClear ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
                <CheckCircle2 className="h-10 w-10 text-emerald-400 mb-2" />
                <p className="text-sm font-medium text-slate-600">Semua tugas beres!</p>
                <p className="text-xs text-slate-400">Tidak ada pengajuan atau aduan tertunda.</p>
              </div>
            ) : (
              <>
                {pendingAduan.map((item: any, i) => (
                  <div key={`aduan-${i}`} className="flex items-center justify-between gap-4 p-3 rounded-2xl border border-red-100 bg-red-50/30 hover:bg-red-50 transition cursor-pointer group">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 shrink-0">
                        <MessageSquareWarning className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{item.buku_induk?.nama_lengkap}</p>
                        <p className="text-xs text-red-600 font-medium">Aduan: {item.judul}</p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-red-600 transition" />
                  </div>
                ))}
                
                {pendingKas.map((item: any, i) => (
                  <div key={`kas-${i}`} className="flex items-center justify-between gap-4 p-3 rounded-2xl border border-slate-100 hover:shadow-md transition cursor-pointer group">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                        <Wallet className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{item.buku_induk?.nama_lengkap}</p>
                        <p className="text-xs text-slate-500">Setoran: {item.nama_iuran}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-slate-900">{formatRupiah(item.nominal)}</span>
                      <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-blue-600 transition" />
                    </div>
                  </div>
                ))}
                
                {pendingSurat.map((item: any, i) => (
                  <div key={`surat-${i}`} className="flex items-center justify-between gap-4 p-3 rounded-2xl border border-slate-100 hover:shadow-md transition cursor-pointer group">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
                        <FileSignature className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{item.buku_induk?.nama_lengkap}</p>
                        <p className="text-xs text-slate-500">Surat: {item.jenis_surat}</p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-purple-600 transition" />
                  </div>
                ))}

                {pendingUsulan.map((item: any, i) => (
                  <div key={`usulan-${i}`} className="flex items-center justify-between gap-4 p-3 rounded-2xl border border-slate-100 hover:shadow-md transition cursor-pointer group">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                        <Lightbulb className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{item.buku_induk?.nama_lengkap}</p>
                        <p className="text-xs text-slate-500">Usulan: {item.judul}</p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-emerald-600 transition" />
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Mutasi Kas Terakhir */}
        <div className="rounded-3xl bg-white border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              Mutasi Terakhir
            </h3>
            <Link href="/admin/keuangan" className="text-xs font-semibold text-blue-600 hover:text-blue-700">Lihat Semua</Link>
          </div>
          
          <div className="p-6 flex-1 flex flex-col gap-4">
            {mutasiTerakhir.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-8 text-slate-500">
                <p className="text-sm">Belum ada mutasi kas tercatat.</p>
              </div>
            ) : (
              mutasiTerakhir.map((item, i) => (
                <div key={i} className="flex items-center justify-between border-b border-slate-50 pb-4 last:border-0 last:pb-0">
                  <div>
                    <p className="text-sm font-bold text-slate-900">{item.keterangan}</p>
                    <p className="text-xs text-slate-500">{new Date(item.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  </div>
                  <span className={`text-sm font-bold ${item.tipe === 'masuk' ? 'text-emerald-600' : 'text-slate-900'}`}>
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