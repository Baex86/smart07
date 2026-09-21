'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { MessageSquareWarning, Loader2, Plus, Clock, CheckCircle2, Ticket, Send } from 'lucide-react';
import { buatTiket, getTiketWarga } from '../../actions/layanan';

export default function usulanWargaPage() {
  const [tiket, setTiket] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({ judul: '', deskripsi: '' });
  const [showForm, setShowForm] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    const res = await getTiketWarga('usulan');
    if (res.success && res.data) setTiket(res.data);
    setIsLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const res = await buatTiket('usulan', formData);
    setIsSubmitting(false);
    
    if (res.success) {
      setFormData({ judul: '', deskripsi: '' });
      setShowForm(false);
      fetchData();
    } else {
      alert(`Gagal: ${res.message}`);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open': return <span className="bg-orange-100 text-orange-700 px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1"><Clock size={12}/> Menunggu</span>;
      case 'progress': return <span className="bg-blue-100 text-blue-700 px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1"><Loader2 size={12} className="animate-spin"/> Diproses</span>;
      case 'resolved': return <span className="bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1"><CheckCircle2 size={12}/> Selesai</span>;
      default: return null;
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 pb-24 md:pb-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-extrabold text-navy-900 tracking-tight">Usulan Warga</h1>
          <p className="text-navy-500 mt-1 text-sm font-medium">Layanan Usulan warga.</p>
        </div>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="px-4 py-2.5 bg-navy-900 text-white font-bold rounded-xl hover:bg-navy-800 transition shadow-md flex items-center gap-2 text-sm">
            <Plus size={16} /> Ajukan Usulan
          </button>
        )}
      </div>

      {showForm && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="bg-white p-6 rounded-2xl border border-ivory-300 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-navy-900 flex items-center gap-2"><MessageSquareWarning size={18} className="text-red-500" /> Tulis Laporan usulan</h3>
            <button onClick={() => setShowForm(false)} className="text-navy-400 hover:text-red-500 text-sm font-bold">Batal</button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-navy-500 uppercase tracking-wider mb-1.5">Judul Laporan</label>
              <input type="text" required placeholder="Cth: Lampu PJU Mati di Blok F5" value={formData.judul} onChange={e => setFormData({...formData, judul: e.target.value})} className="w-full px-4 py-3 bg-ivory-50 border border-ivory-300 rounded-xl outline-none text-navy-900 font-medium text-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold text-navy-500 uppercase tracking-wider mb-1.5">Detail Keluhan</label>
              <textarea required rows={4} placeholder="Jelaskan detail permasalahan..." value={formData.deskripsi} onChange={e => setFormData({...formData, deskripsi: e.target.value})} className="w-full px-4 py-3 bg-ivory-50 border border-ivory-300 rounded-xl outline-none text-navy-900 font-medium text-sm" />
            </div>
            <button type="submit" disabled={isSubmitting} className="w-full py-3 bg-navy-900 text-white font-bold rounded-xl hover:bg-navy-800 transition flex justify-center items-center gap-2 shadow-md disabled:opacity-70">
              {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />} Kirim Tiket
            </button>
          </form>
        </motion.div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-navy-800" size={32} /></div>
      ) : tiket.length === 0 ? (
        <div className="bg-ivory-50 border-2 border-dashed border-ivory-300 rounded-2xl p-8 text-center">
          <Ticket size={40} className="text-navy-300 mx-auto mb-3" />
          <p className="font-bold text-navy-900">Belum Ada Tiket</p>
          <p className="text-sm text-navy-400 mt-1">Anda belum pernah mengirim usulan.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {tiket.map((t) => (
            <div key={t.id} className="bg-white border border-ivory-300 rounded-2xl shadow-sm overflow-hidden">
              <div className="p-5">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-navy-400 bg-ivory-100 px-2 py-1 rounded border border-ivory-200">
                    {t.kode_tiket}
                  </span>
                  {getStatusBadge(t.status)}
                </div>
                <h3 className="font-bold text-navy-900 text-lg">{t.judul}</h3>
                <p className="text-sm text-navy-600 mt-2 leading-relaxed">{t.deskripsi}</p>
                <p className="text-[10px] font-bold text-navy-400 mt-4">{new Date(t.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
              </div>
              
              {t.tanggapan_admin && (
                <div className="bg-blue-50/50 border-t border-blue-100 p-5">
                  <p className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><CheckCircle2 size={14}/> Tanggapan Admin RT</p>
                  <p className="text-sm text-blue-900 font-medium leading-relaxed">{t.tanggapan_admin}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}