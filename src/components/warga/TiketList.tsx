'use client';

import { useEffect, useState } from 'react';
import { Loader2, MessageSquareWarning, Lightbulb, Ticket, Plus, Send, X, CheckCircle2 } from 'lucide-react';
import { buatTiket, getTiketWarga } from '@/app/actions/layanan';
import StatusBadge from './StatusBadge';
import EmptyState from './EmptyState';

const STATUS_MAP: Record<string, string> = {
  open: 'menunggu',
  progress: 'diproses',
  resolved: 'selesai',
};

export default function TiketList({ tipe }: { tipe: 'aduan' | 'usulan' }) {
  const isAduan = tipe === 'aduan';
  const [tiket, setTiket] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ judul: '', deskripsi: '' });
  const [showForm, setShowForm] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    const res = await getTiketWarga(tipe);
    if (res.success && res.data) setTiket(res.data);
    setIsLoading(false);
  };

  useEffect(() => { fetchData(); }, [tipe]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const res = await buatTiket(tipe, formData);
    setIsSubmitting(false);
    if (res.success) {
      setFormData({ judul: '', deskripsi: '' });
      setShowForm(false);
      fetchData();
    } else {
      alert(`Gagal: ${res.message}`);
    }
  };

  const inputCls = 'w-full px-4 py-3 bg-paper border border-navy-200 rounded-lg text-navy-900 font-medium text-sm';

  return (
    <div className="space-y-4">
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-navy-900 text-white font-semibold rounded-lg hover:bg-navy-800 transition text-sm"
        >
          <Plus size={16} /> {isAduan ? 'Buat Aduan' : 'Ajukan Usulan'}
        </button>
      )}

      {showForm && (
        <div className="bg-surface p-5 rounded-xl border border-navy-100 shadow-card">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-display font-bold text-navy-900 flex items-center gap-2">
              {isAduan ? <MessageSquareWarning size={18} className="text-red-500" /> : <Lightbulb size={18} className="text-accent-500" />}
              {isAduan ? 'Tulis Laporan Aduan' : 'Tulis Usulan'}
            </h3>
            <button onClick={() => setShowForm(false)} className="text-navy-400 hover:text-red-500 transition"><X size={18} /></button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-navy-500 uppercase tracking-wide mb-1.5">Judul</label>
              <input type="text" required placeholder={isAduan ? 'Cth: Lampu PJU Mati di Blok F5' : 'Cth: Usulan penambahan pos ronda'} value={formData.judul} onChange={e => setFormData({ ...formData, judul: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-navy-500 uppercase tracking-wide mb-1.5">Detail</label>
              <textarea required rows={4} placeholder="Jelaskan detail..." value={formData.deskripsi} onChange={e => setFormData({ ...formData, deskripsi: e.target.value })} className={inputCls} />
            </div>
            <button type="submit" disabled={isSubmitting} className="w-full py-3 bg-navy-900 text-white font-semibold rounded-lg hover:bg-navy-800 transition flex justify-center items-center gap-2 disabled:opacity-60">
              {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />} Kirim
            </button>
          </form>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin text-navy-400" size={28} /></div>
      ) : tiket.length === 0 ? (
        <EmptyState
          icon={<Ticket size={24} />}
          title={isAduan ? 'Belum Ada Aduan' : 'Belum Ada Usulan'}
          description={isAduan ? 'Anda belum pernah mengirim aduan.' : 'Anda belum pernah mengirim usulan.'}
        />
      ) : (
        <div className="space-y-3">
          {tiket.map((t) => (
            <div key={t.id} className="bg-surface border border-navy-100 rounded-xl shadow-card overflow-hidden">
              <div className="p-5">
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-navy-400 bg-navy-50 px-2.5 py-1 rounded-md">
                    {t.kode_tiket}
                  </span>
                  <StatusBadge status={STATUS_MAP[t.status] ?? 'menunggu'} />
                </div>
                <h3 className="font-display font-bold text-navy-900 text-lg">{t.judul}</h3>
                <p className="text-sm text-navy-600 mt-1.5 leading-relaxed">{t.deskripsi}</p>
                <p className="text-[11px] font-medium text-navy-400 mt-3">
                  {new Date(t.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              {t.tanggapan_admin && (
                <div className="bg-navy-50/60 border-t border-navy-100 p-5">
                  <p className="text-xs font-semibold text-navy-600 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                    <CheckCircle2 size={14} /> Tanggapan Admin RT
                  </p>
                  <p className="text-sm text-navy-800 font-medium leading-relaxed">{t.tanggapan_admin}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}