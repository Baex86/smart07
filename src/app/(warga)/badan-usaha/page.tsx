'use client';

import { useEffect, useState, useMemo } from 'react';
import { Store, Loader2, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { getSaldoBadanUsaha, getTransparansiKeuangan } from '../../actions/iuran';
import PageHeader from '@/components/warga/PageHeader';
import StatCard from '@/components/warga/StatCard';
import EmptyState from '@/components/warga/EmptyState';

const rupiah = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

export default function BadanUsahaPage() {
  const [saldo, setSaldo] = useState({ totalMasuk: 0, totalKeluar: 0, saldo: 0 });
  const [riwayat, setRiwayat] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'semua' | 'masuk' | 'keluar'>('semua');

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      const [resSaldo, resTrans] = await Promise.all([getSaldoBadanUsaha(), getTransparansiKeuangan()]);
      if (resSaldo.success) setSaldo(resSaldo as any);
      if (resTrans.success) setRiwayat(resTrans.kasUsaha || []);
      setIsLoading(false);
    })();
  }, []);

  const grouped = useMemo(() => {
    const filtered = riwayat.filter((r) => filter === 'semua' || r.tipe === filter);
    const map = new Map<string, any[]>();
    filtered.forEach((r) => {
      const key = new Date(r.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    });
    return Array.from(map.entries());
  }, [riwayat, filter]);

  const tabs: { key: typeof filter; label: string }[] = [
    { key: 'semua', label: 'Semua' },
    { key: 'masuk', label: 'Masuk' },
    { key: 'keluar', label: 'Keluar' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Badan Usaha"
        description="Transparansi kas Badan Usaha RT — pantau pemasukan, pengeluaran, dan saldo terkini."
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard accent label="Saldo" value={rupiah(saldo.saldo)} icon={<Wallet size={20} />} />
        <StatCard label="Masuk (bulan ini)" value={rupiah(saldo.totalMasuk)} icon={<TrendingUp size={20} />} />
        <StatCard label="Keluar (bulan ini)" value={rupiah(saldo.totalKeluar)} icon={<TrendingDown size={20} />} />
      </div>

      <div className="flex gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setFilter(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
              filter === t.key
                ? 'bg-navy-900 text-white'
                : 'bg-surface border border-navy-100 text-navy-500 hover:text-navy-900'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-navy-400" size={30} /></div>
      ) : grouped.length === 0 ? (
        <EmptyState icon={<Store size={24} />} title="Belum ada transaksi" description="Belum ada catatan kas Badan Usaha." />
      ) : (
        <div className="space-y-5">
          {grouped.map(([tanggal, items]) => (
            <div key={tanggal}>
              <p className="text-xs font-semibold text-navy-400 uppercase tracking-wide mb-2 px-1">{tanggal}</p>
              <div className="bg-surface border border-navy-100 rounded-xl shadow-card divide-y divide-navy-50 overflow-hidden">
                {items.map((r: any, i: number) => (
                  <div key={i} className="flex items-center justify-between gap-3 px-4 py-3.5">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${
                        r.tipe === 'masuk' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                      }`}>
                        {r.tipe === 'masuk' ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-navy-900 truncate">{r.keterangan || 'Transaksi'}</p>
                        <p className="text-xs text-navy-400">{r.tipe === 'masuk' ? 'Pemasukan' : 'Pengeluaran'}</p>
                      </div>
                    </div>
                    <p className={`font-display font-bold text-sm shrink-0 ${
                      r.tipe === 'masuk' ? 'text-emerald-600' : 'text-red-600'
                    }`}>
                      {r.tipe === 'masuk' ? '+' : '-'}{rupiah(Number(r.nominal))}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}