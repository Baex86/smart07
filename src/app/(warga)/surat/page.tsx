'use client';

import { useEffect, useState } from 'react';
import { FileText, Loader2, Plus, Send, Download, X } from 'lucide-react';
import { ajukanSurat, getSuratWarga, getMasterSuratAktif } from '../../actions/layanan';
import { generateSuratPDF } from '@/lib/generateSuratPDF';
import PageHeader from '@/components/warga/PageHeader';
import StatusBadge from '@/components/warga/StatusBadge';
import EmptyState from '@/components/warga/EmptyState';

export default function SuratWargaPage() {
  const [surat, setSurat] = useState<any[]>([]);
  const [masterSurat, setMasterSurat] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ jenis_surat: '', keperluan: '', jenis_barang: '', waktu_kehilangan: '', lokasi_kehilangan: '' });
  const [showForm, setShowForm] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    const [resSurat, resMaster] = await Promise.all([getSuratWarga(), getMasterSuratAktif()]);
    if (resSurat.success && resSurat.data) setSurat(resSurat.data);
    if (resMaster.success && resMaster.data) {
      setMasterSurat(resMaster.data);
      if (resMaster.data.length > 0) setFormData(prev => ({ ...prev, jenis_surat: resMaster.data[0].id }));
    }
    setIsLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.jenis_surat) return alert('Pilih jenis surat terlebih dahulu.');
    setIsSubmitting(true);
    const res = await ajukanSurat({
      master_surat_id: formData.jenis_surat,
      keperluan: formData.keperluan,
      jenis_barang: formData.jenis_barang,
      waktu_kehilangan: formData.waktu_kehilangan,
      lokasi_kehilangan: formData.lokasi_kehilangan,
    });
    setIsSubmitting(false);
    if (res.success) {
      setFormData({ ...formData, keperluan: '', jenis_barang: '', waktu_kehilangan: '', lokasi_kehilangan: '' });
      setShowForm(false);
      fetchData();
    } else {
      alert(`Gagal: ${res.message}`);
    }
  };

  const handleDownload = async (s: any) => {
    setDownloadingId(s.id);
    try { await generateSuratPDF(s); } catch { alert('Gagal membuat PDF.'); } finally { setDownloadingId(null); }
  };

  const inputCls = 'w-full px-4 py-3 bg-paper border border-navy-200 rounded-lg text-navy-900 font-medium text-sm';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Surat Pengantar"
        description="Ajukan permohonan surat administrasi ke RT, lalu unduh hasilnya setelah disetujui."
        action={!showForm && masterSurat.length > 0 ? (
          <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-2 px-4 py-2.5 bg-navy-900 text-white font-semibold rounded-lg hover:bg-navy-800 transition text-sm">
            <Plus size={16} /> Ajukan Surat
          </button>
        ) : undefined}
      />

      {showForm && (
        <div className="bg-surface p-5 lg:p-6 rounded-xl border border-navy-100 shadow-card">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-display font-bold text-navy-900 flex items-center gap-2"><FileText size={18} className="text-accent-500" /> Form Pengajuan Surat</h3>
            <button onClick={() => setShowForm(false)} className="text-navy-400 hover:text-red-500 transition"><X size={18} /></button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-navy-500 uppercase tracking-wide mb-1.5">Pilih Jenis Surat</label>
              <select required value={formData.jenis_surat} onChange={e => setFormData({ ...formData, jenis_surat: e.target.value })} className={`${inputCls} appearance-none`}>
                {masterSurat.map(m => <option key={m.id} value={m.id}>{m.jenis_surat}</option>)}
              </select>
            </div>
            {formData.jenis_surat === 'f4570059-5125-4f0b-867b-4d1e4505e105' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-navy-500 uppercase tracking-wide mb-1.5">Jenis Barang / Dokumen yang Hilang</label>
                  <input type="text" required placeholder="cth: KTP / Buku Tabungan" value={formData.jenis_barang} onChange={e => setFormData({ ...formData, jenis_barang: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-navy-500 uppercase tracking-wide mb-1.5">Waktu Kehilangan</label>
                  <input type="date" required value={formData.waktu_kehilangan} onChange={e => setFormData({ ...formData, waktu_kehilangan: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-navy-500 uppercase tracking-wide mb-1.5">Lokasi Kehilangan</label>
                  <input type="text" required placeholder="cth: di sekitar rumah / pasar" value={formData.lokasi_kehilangan} onChange={e => setFormData({ ...formData, lokasi_kehilangan: e.target.value })} className={inputCls} />
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold text-navy-500 uppercase tracking-wide mb-1.5">Keperluan / Keterangan</label>
              <textarea required rows={3} placeholder="Jelaskan tujuan pembuatan surat..." value={formData.keperluan} onChange={e => setFormData({ ...formData, keperluan: e.target.value })} className={inputCls} />
            </div>
            <button type="submit" disabled={isSubmitting} className="w-full py-3 bg-navy-900 text-white font-semibold rounded-lg hover:bg-navy-800 transition flex justify-center items-center gap-2 disabled:opacity-60">
              {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />} Kirim Pengajuan
            </button>
          </form>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-navy-400" size={30} /></div>
      ) : surat.length === 0 ? (
        <EmptyState icon={<FileText size={24} />} title="Belum Ada Pengajuan" description={masterSurat.length === 0 ? 'Admin belum menyiapkan template surat.' : 'Anda belum pernah mengajukan surat pengantar.'} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {surat.map((s) => (
            <div key={s.id} className="bg-surface border border-navy-100 rounded-xl shadow-card p-5 flex flex-col gap-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="mb-2"><StatusBadge status={s.status} /></div>
                  <h3 className="font-display font-bold text-navy-900 text-lg leading-tight">{masterSurat.find(m => m.id === s.jenis_surat)?.jenis_surat || s.jenis_surat}</h3>
                  <p className="text-sm text-navy-500 mt-1 line-clamp-2">Keperluan: {s.keperluan}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[11px] font-medium text-navy-400">Diajukan</p>
                  <p className="text-xs font-semibold text-navy-800 mt-0.5">{new Date(s.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>
              </div>
              {s.status === 'selesai' && (
                <button onClick={() => handleDownload(s)} disabled={downloadingId === s.id} className="inline-flex items-center justify-center gap-2 w-full py-2.5 mt-auto bg-accent text-navy-900 font-semibold rounded-lg hover:bg-accent-500 transition text-sm disabled:opacity-60">
                  {downloadingId === s.id ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} Download PDF
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
