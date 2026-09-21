'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Loader2, Plus, Clock, CheckCircle2, XCircle, Send } from 'lucide-react';
import { ajukanSurat, getSuratWarga, getMasterSuratAktif } from '../../actions/layanan';

export default function SuratWargaPage() {
  const [surat, setSurat] = useState<any[]>([]);
  const [masterSurat, setMasterSurat] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({ jenis_surat: '', keperluan: '' });
  const [showForm, setShowForm] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    const [resSurat, resMaster] = await Promise.all([ getSuratWarga(), getMasterSuratAktif() ]);
    if (resSurat.success && resSurat.data) setSurat(resSurat.data);
    if (resMaster.success && resMaster.data) {
      setMasterSurat(resMaster.data);
      if (resMaster.data.length > 0) setFormData(prev => ({ ...prev, jenis_surat: resMaster.data[0].jenis_surat }));
    }
    setIsLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.jenis_surat) return alert('Pilih jenis surat terlebih dahulu.');
    setIsSubmitting(true);
    const res = await ajukanSurat(formData);
    setIsSubmitting(false);
    
    if (res.success) {
      setFormData({ ...formData, keperluan: '' });
      setShowForm(false);
      fetchData();
    } else {
      alert(`Gagal: ${res.message}`);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'menunggu': return <span className="bg-orange-100 text-orange-700 px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1"><Clock size={12}/> Menunggu ACC</span>;
      case 'diproses': return <span className="bg-blue-100 text-blue-700 px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1"><Loader2 size={12} className="animate-spin"/> Sedang Dicetak</span>;
      case 'selesai': return <span className="bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1"><CheckCircle2 size={12}/> Siap Diambil</span>;
      case 'ditolak': return <span className="bg-red-100 text-red-700 px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1"><XCircle size={12}/> Ditolak</span>;
      default: return null;
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 pb-24 md:pb-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-extrabold text-navy-900 tracking-tight">Surat Pengantar</h1>
          <p className="text-navy-500 mt-1 text-sm font-medium">Ajukan permohonan surat administrasi ke RT.</p>
        </div>
        {!showForm && masterSurat.length > 0 && (
          <button onClick={() => setShowForm(true)} className="px-4 py-2.5 bg-navy-900 text-white font-bold rounded-xl hover:bg-navy-800 transition shadow-md flex items-center gap-2 text-sm">
            <Plus size={16} /> Ajukan Surat
          </button>
        )}
      </div>

      {showForm && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="bg-white p-6 rounded-2xl border border-ivory-300 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-navy-900 flex items-center gap-2"><FileText size={18} className="text-emerald-600" /> Form Pengajuan Surat</h3>
            <button onClick={() => setShowForm(false)} className="text-navy-400 hover:text-red-500 text-sm font-bold">Batal</button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-navy-500 uppercase tracking-wider mb-1.5">Pilih Jenis Surat</label>
              <select required value={formData.jenis_surat} onChange={e => setFormData({...formData, jenis_surat: e.target.value})} className="w-full px-4 py-3 bg-ivory-50 border border-ivory-300 rounded-xl outline-none text-navy-900 font-medium text-sm appearance-none">
                {masterSurat.map(m => <option key={m.id} value={m.jenis_surat}>{m.jenis_surat}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-navy-500 uppercase tracking-wider mb-1.5">Keperluan / Keterangan Tambahan</label>
              <textarea required rows={3} placeholder="Jelaskan tujuan pembuatan surat..." value={formData.keperluan} onChange={e => setFormData({...formData, keperluan: e.target.value})} className="w-full px-4 py-3 bg-ivory-50 border border-ivory-300 rounded-xl outline-none text-navy-900 font-medium text-sm" />
            </div>
            <button type="submit" disabled={isSubmitting} className="w-full py-3 bg-navy-900 text-white font-bold rounded-xl hover:bg-navy-800 transition flex justify-center items-center gap-2 shadow-md disabled:opacity-70">
              {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />} Kirim Pengajuan
            </button>
          </form>
        </motion.div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-navy-800" size={32} /></div>
      ) : surat.length === 0 ? (
        <div className="bg-ivory-50 border-2 border-dashed border-ivory-300 rounded-2xl p-8 text-center">
          <FileText size={40} className="text-navy-300 mx-auto mb-3" />
          <p className="font-bold text-navy-900">Belum Ada Pengajuan</p>
          <p className="text-sm text-navy-400 mt-1">
            {masterSurat.length === 0 ? "Admin belum menyiapkan template surat." : "Anda belum pernah mengajukan surat pengantar."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {surat.map((s) => (
            <div key={s.id} className="bg-white border border-ivory-300 rounded-2xl shadow-sm p-5 flex flex-col md:flex-row justify-between gap-4 md:items-center">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  {getStatusBadge(s.status)}
                </div>
                <h3 className="font-bold text-navy-900 text-lg">{s.jenis_surat}</h3>
                <p className="text-sm text-navy-600 mt-1">Keperluan: {s.keperluan}</p>
              </div>
              <div className="text-left md:text-right shrink-0 border-t border-ivory-100 md:border-t-0 pt-3 md:pt-0">
                <p className="text-[10px] font-bold text-navy-400">Diajukan pada:</p>
                <p className="text-xs font-bold text-navy-900 mt-0.5">{new Date(s.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}