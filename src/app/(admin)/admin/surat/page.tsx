'use client';

import { useEffect, useState, useRef } from 'react';
import { FileText, Settings, Loader2, CheckCircle2, XCircle, Clock, Printer, Plus, X, Edit2, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getSemuaLayananAdmin, tambahMasterSurat, updateMasterSurat, hapusMasterSurat, updateStatusLayanan } from '@/app/actions/layanan';

const DEFAULT_HTML_TEMPLATE = `<div style="text-align: center; border-bottom: 3px solid black; padding-bottom: 10px; margin-bottom: 20px;">
  <h2 style="margin: 0; font-size: 20px; font-weight: bold; text-transform: uppercase;">RUKUN TETANGGA 07 RUKUN WARGA 06</h2>
  <p style="margin: 0; font-size: 14px;">Griya Permata Meri, Kel. Meri, Kec. Kranggan, Kota Mojokerto</p>
</div>
<h3 style="text-align: center; text-decoration: underline; margin-bottom: 20px; font-size: 18px;">[JENIS_SURAT]</h3>
<p style="text-indent: 30px; margin-bottom: 15px;">Yang bertanda tangan di bawah ini Ketua RT 07 RW 06 Kelurahan Meri menerangkan dengan sesungguhnya bahwa:</p>
<table style="width: 100%; margin-bottom: 20px; margin-left: 20px; font-size: 14px;">
  <tr><td style="width: 180px; padding: 4px 0;">Nama Lengkap</td><td>: <strong>[NAMA]</strong></td></tr>
  <tr><td style="padding: 4px 0;">NIK</td><td>: [NIK]</td></tr>
  <tr><td style="padding: 4px 0;">Jenis Kelamin</td><td>: [JENIS_KELAMIN]</td></tr>
  <tr><td style="padding: 4px 0;">Tempat, Tanggal Lahir</td><td>: [TTL]</td></tr>
  <tr><td style="padding: 4px 0;">Pekerjaan</td><td>: [PEKERJAAN]</td></tr>
  <tr><td style="padding: 4px 0;">Agama</td><td>: [AGAMA]</td></tr>
  <tr><td style="padding: 4px 0;">Alamat / Blok</td><td>: Blok [BLOK]</td></tr>
</table>
<p style="text-indent: 30px; margin-bottom: 15px;">Orang tersebut di atas adalah benar-benar warga yang berdomisili di RT 07 RW 06 Griya Permata Meri. Surat pengantar ini dibuat untuk keperluan:</p>
<div style="font-weight: bold; border: 1px solid #000; padding: 15px; margin-bottom: 20px; text-align: center;">
  [KEPERLUAN]
</div>
<p style="margin-bottom: 5px;">Keterangan Tambahan:</p>
<p style="margin-bottom: 30px; padding-left: 20px;">[KETERANGAN_ADMIN]</p>
<p style="text-indent: 30px; margin-bottom: 30px;">Demikian surat pengantar ini dibuat agar dapat dipergunakan sebagaimana mestinya.</p>
<div style="width: 300px; margin-left: auto; text-align: center; font-size: 14px;">
  <p style="margin-bottom: 5px;">Mojokerto, [TANGGAL_HARI_INI]</p>
  <p style="margin-bottom: 70px;">Ketua RT 07 RW 06</p>
  <p style="font-weight: bold; text-decoration: underline;">BAYU AGUS NURRUDIN</p>
</div>`;

export default function SuratAdminPage() {
  const [activeSubTab, setActiveSubTab] = useState<'antrean' | 'master'>('antrean');
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [data, setData] = useState({ surat: [] as any[], masterSurat: [] as any[] });

  // State Cetak Surat
  const [selectedSurat, setSelectedSurat] = useState<any>(null);
  const [keteranganAdmin, setKeteranganAdmin] = useState('');
  const [htmlSiapCetak, setHtmlSiapCetak] = useState('');

  // State Master Surat (Editor)
  const [isMasterModalOpen, setIsMasterModalOpen] = useState(false);
  const [masterForm, setMasterForm] = useState({ id: '', jenis_surat: '', konten_html: DEFAULT_HTML_TEMPLATE });
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setIsLoading(true);
    const res = await getSemuaLayananAdmin();
    if (res.success) {
      setData({ surat: res.dataSurat || [], masterSurat: res.dataMasterSurat || [] });
    }
    setIsLoading(false);
  };

  const handleUpdateStatus = async (table: string, id: string, status: string) => {
    setIsProcessing(id);
    const res = await updateStatusLayanan(table, id, status);
    if (res.success) await fetchData();
    setIsProcessing(null);
  };

  const bukaModalCetak = (suratItem: any) => {
    setSelectedSurat(suratItem);
    setKeteranganAdmin('');
  };

  const eksekusiCetakPDF = async () => {
    const template = data.masterSurat.find(m => m.jenis_surat === selectedSurat.jenis_surat);
    if (!template) return alert('Master Template tidak ditemukan! Buat templatenya dulu di tab Master.');

    const warga = selectedSurat.buku_induk;
    const tglLahir = warga.tanggal_lahir ? new Date(warga.tanggal_lahir).toLocaleDateString('id-ID') : '-';
    const ttl = `${warga.tempat_lahir || '-'}, ${tglLahir}`;
    const tglHariIni = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

    let renderedHtml = template.konten_html
      .replace(/\[JENIS_SURAT\]/g, selectedSurat.jenis_surat.toUpperCase())
      .replace(/\[NAMA\]/g, warga.nama_lengkap || '-')
      .replace(/\[NIK\]/g, warga.nik || '-')
      .replace(/\[JENIS_KELAMIN\]/g, warga.jenis_kelamin || '-')
      .replace(/\[TTL\]/g, ttl)
      .replace(/\[PEKERJAAN\]/g, warga.pekerjaan || '-')
      .replace(/\[AGAMA\]/g, warga.agama || '-')
      .replace(/\[BLOK\]/g, warga.nomor_rumah || '-')
      .replace(/\[KEPERLUAN\]/g, selectedSurat.keperluan || '-')
      .replace(/\[KETERANGAN_ADMIN\]/g, keteranganAdmin || '-')
      .replace(/\[TANGGAL_HARI_INI\]/g, tglHariIni);

    setHtmlSiapCetak(renderedHtml);
    await updateStatusLayanan('surat_pengantar', selectedSurat.id, 'selesai');
    await fetchData();
    setSelectedSurat(null);

    // Kasih jeda render state PDF sebelum manggil trigger print OS
    setTimeout(() => {
      window.print();
      setHtmlSiapCetak('');
    }, 500);
  };

  // --- LOGIKA EDITOR WYSIWYG & CRUD MASTER SURAT ---
  const jalankanFormat = (command: string) => {
    document.execCommand(command, false, undefined);
    editorRef.current?.focus();
  };

  const sisipkanVariabel = (variabel: string) => {
    document.execCommand('insertText', false, variabel);
    editorRef.current?.focus();
  };

  const openFormMaster = (m?: any) => {
    if (m) {
      setMasterForm({ id: m.id, jenis_surat: m.jenis_surat, konten_html: m.konten_html });
    } else {
      setMasterForm({ id: '', jenis_surat: '', konten_html: DEFAULT_HTML_TEMPLATE });
    }
    setIsMasterModalOpen(true);
  };

  const handleSimpanMaster = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing('master');
    
    const payload = { jenis_surat: masterForm.jenis_surat, konten_html: masterForm.konten_html };
    const res = masterForm.id 
      ? await updateMasterSurat(masterForm.id, payload)
      : await tambahMasterSurat(payload);

    if (res.success) {
      setMasterForm({ id: '', jenis_surat: '', konten_html: DEFAULT_HTML_TEMPLATE });
      setIsMasterModalOpen(false);
      await fetchData();
    } else {
      alert('Gagal menyimpan template surat.');
    }
    setIsProcessing(null);
  };

  const hapusMaster = async (id: string, nama: string) => {
    if (!confirm(`Hapus template ${nama}?`)) return;
    setIsProcessing(id);
    const res = await hapusMasterSurat(id);
    if (res.success) await fetchData();
    setIsProcessing(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'menunggu': return <span className="flex items-center gap-1.5 px-3 py-1 bg-orange-100 text-orange-700 rounded-md text-[10px] font-extrabold uppercase tracking-wider"><Clock size={12} /> Menunggu</span>;
      case 'diproses': return <span className="flex items-center gap-1.5 px-3 py-1 bg-blue-100 text-blue-700 rounded-md text-[10px] font-extrabold uppercase tracking-wider"><Loader2 size={12} className="animate-spin" /> Diproses</span>;
      case 'selesai': return <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-md text-[10px] font-extrabold uppercase tracking-wider"><CheckCircle2 size={12} /> Selesai</span>;
      case 'ditolak': return <span className="flex items-center gap-1.5 px-3 py-1 bg-red-100 text-red-700 rounded-md text-[10px] font-extrabold uppercase tracking-wider"><XCircle size={12} /> Ditolak</span>;
      default: return null;
    }
  };

  return (
    <>
      {/* CSS KHUSUS BUAT ISOLASI AREA PRINT */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * { visibility: hidden !important; }
          #area-kertas-print, #area-kertas-print * { visibility: visible !important; }
          #area-kertas-print { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 20px; }
        }
      `}} />

      <div className="print:hidden p-6 md:p-8 w-full max-w-5xl mx-auto flex flex-col gap-6 pb-24">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-extrabold text-navy-900 tracking-tight">Manajemen Surat</h1>
            <p className="text-navy-500 mt-1 text-sm font-medium">Command Center cetak PDF dan studio template surat.</p>
          </div>
          {activeSubTab === 'master' && (
            <button onClick={() => openFormMaster()} className="px-4 py-2.5 bg-navy-900 text-white font-bold rounded-xl hover:bg-navy-800 transition shadow-md flex items-center gap-2 text-sm">
              <Plus size={16} /> Buat Master Baru
            </button>
          )}
        </div>

        <div className="flex gap-2 border-b border-ivory-300 pb-px">
          <button onClick={() => setActiveSubTab('antrean')} className={`flex items-center gap-2 px-5 py-3 rounded-t-xl font-bold text-sm transition-all border-b-2 ${activeSubTab === 'antrean' ? 'border-navy-900 text-navy-900' : 'border-transparent text-slate-500'}`}>
            <FileText size={16} /> Antrean Pengajuan ({data.surat.filter(s => s.status === 'menunggu').length})
          </button>
          <button onClick={() => setActiveSubTab('master')} className={`flex items-center gap-2 px-5 py-3 rounded-t-xl font-bold text-sm transition-all border-b-2 ${activeSubTab === 'master' ? 'border-navy-900 text-navy-900' : 'border-transparent text-slate-500'}`}>
            <Settings size={16} /> Master Template HTML
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-navy-900" size={40} /></div>
        ) : activeSubTab === 'antrean' ? (
          data.surat.length === 0 ? (
            <div className="py-20 text-center bg-white rounded-2xl border border-ivory-200"><FileText size={40} className="mx-auto text-slate-300 mb-3"/><p className="font-bold text-slate-400">Tidak ada pengajuan surat.</p></div>
          ) : (
            <div className="space-y-4">
              {data.surat.map(item => (
                <div key={item.id} className="bg-white p-5 rounded-2xl border border-ivory-300 shadow-sm flex flex-col md:flex-row gap-5 items-start md:items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">{getStatusBadge(item.status)} <span className="text-[10px] font-bold text-slate-400">Blok {item.buku_induk?.nomor_rumah}</span></div>
                    <h3 className="font-bold text-navy-900 text-lg">{item.jenis_surat} <span className="text-sm font-medium text-slate-500">dari {item.buku_induk?.nama_lengkap}</span></h3>
                    <p className="text-sm text-slate-600 mt-1">Keperluan: <span className="font-semibold text-navy-900">{item.keperluan}</span></p>
                  </div>
                  <div className="flex gap-2 w-full md:w-auto mt-2 md:mt-0">
                    {item.status === 'menunggu' && (
                      <>
                        <button onClick={() => handleUpdateStatus('surat_pengantar', item.id, 'ditolak')} disabled={isProcessing === item.id} className="px-4 py-2 bg-white border border-red-200 text-red-600 text-sm font-bold rounded-xl hover:bg-red-50 transition">Tolak</button>
                        <button onClick={() => bukaModalCetak(item)} className="px-4 py-2 bg-navy-900 text-white text-sm font-bold rounded-xl hover:bg-navy-800 transition flex items-center gap-2 shadow-md"><Printer size={16}/> Proses & Cetak</button>
                      </>
                    )}
                    {item.status === 'selesai' && (
                      <button onClick={() => bukaModalCetak(item)} className="px-4 py-2 bg-emerald-50 text-emerald-600 border border-emerald-200 text-sm font-bold rounded-xl hover:bg-emerald-100 transition flex items-center gap-2"><Printer size={16}/> Cetak Ulang</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.masterSurat.length === 0 ? (
              <div className="col-span-full py-16 text-center border-2 border-dashed border-ivory-300 rounded-2xl"><p className="font-bold text-slate-400">Belum ada Master Surat.</p></div>
            ) : (
              data.masterSurat.map(m => (
                <div key={m.id} className="bg-white border border-ivory-300 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <span className="p-2 bg-purple-100 text-purple-600 rounded-lg"><Settings size={18} /></span>
                      <span className={`w-2 h-2 rounded-full ${m.is_active ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    </div>
                    <h3 className="font-bold text-navy-900 text-lg leading-snug mb-4">{m.jenis_surat}</h3>
                  </div>
                  <div className="flex gap-2 pt-4 border-t border-ivory-100">
                    <button onClick={() => openFormMaster(m)} className="flex-1 py-2 bg-ivory-100 text-navy-600 text-sm font-bold rounded-xl hover:bg-ivory-200 transition flex items-center justify-center gap-2">
                      <Edit2 size={14} /> Edit
                    </button>
                    <button onClick={() => hapusMaster(m.id, m.jenis_surat)} disabled={isProcessing === m.id} className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition">
                      {isProcessing === m.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Modal Cetak Surat */}
        <AnimatePresence>
          {selectedSurat && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedSurat(null)} className="fixed inset-0 bg-navy-900/60 backdrop-blur-sm z-50" />
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-3xl shadow-2xl z-50 flex flex-col overflow-hidden">
                <div className="px-6 py-5 border-b border-ivory-200 flex justify-between items-center bg-ivory-50">
                  <h3 className="font-extrabold text-navy-900 flex items-center gap-2"><Printer size={18} className="text-emerald-600"/> Generate Surat PDF</h3>
                  <button onClick={() => setSelectedSurat(null)} className="p-1.5 bg-white rounded-full text-navy-400 border border-ivory-200"><X size={18} /></button>
                </div>
                <div className="p-6">
                  <div className="mb-4 space-y-1">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pemohon</p>
                    <p className="font-bold text-navy-900 text-lg">{selectedSurat.buku_induk?.nama_lengkap}</p>
                    <p className="text-sm font-medium text-slate-600">Keperluan: {selectedSurat.keperluan}</p>
                  </div>
                  <div className="mb-6">
                    <label className="block text-xs font-bold text-navy-500 uppercase tracking-wider mb-1.5">Keterangan Tambahan Admin (Opsional)</label>
                    <textarea rows={3} value={keteranganAdmin} onChange={e => setKeteranganAdmin(e.target.value)} placeholder="Misal: Surat ini hanya berlaku 14 hari..." className="w-full px-4 py-3 bg-ivory-50 border border-ivory-300 rounded-xl outline-none text-navy-900 font-medium text-sm" />
                  </div>
                  <button onClick={eksekusiCetakPDF} className="w-full py-3.5 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition flex justify-center gap-2 shadow-md">
                    <Printer size={18} /> Rilis Surat & Buka Jendela Cetak PDF
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Modal Studio Editor Template Surat (WYSIWYG) */}
        <AnimatePresence>
          {isMasterModalOpen && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsMasterModalOpen(false)} className="fixed inset-0 bg-navy-900/60 backdrop-blur-sm z-50" />
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl bg-white rounded-3xl shadow-2xl z-50 flex flex-col max-h-[95vh] overflow-hidden">
                <div className="px-6 py-5 border-b border-ivory-200 flex justify-between items-center bg-ivory-50 shrink-0">
                  <h3 className="font-extrabold text-navy-900 flex items-center gap-2"><Settings size={18} className="text-purple-600"/> Studio Editor Template</h3>
                  <button onClick={() => setIsMasterModalOpen(false)} className="p-1.5 bg-white rounded-full text-navy-400 border border-ivory-200"><X size={18} /></button>
                </div>
                <div className="p-6 overflow-y-auto flex-1 bg-slate-50">
                  <form onSubmit={handleSimpanMaster} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-navy-500 uppercase tracking-wider mb-1.5">Judul Jenis Surat</label>
                      <input type="text" required placeholder="Cth: Surat Pengantar SKCK" value={masterForm.jenis_surat} onChange={e => setMasterForm({...masterForm, jenis_surat: e.target.value})} className="w-full px-4 py-3 bg-white border border-ivory-300 rounded-xl outline-none text-navy-900 font-bold" />
                    </div>
                    
                    {/* CUSTOM WYSIWYG EDITOR */}
                    <div>
                      <label className="block text-xs font-bold text-navy-500 uppercase tracking-wider mb-1.5">Kanvas Template</label>
                      <div className="bg-white border border-ivory-300 rounded-xl shadow-sm overflow-hidden">
                        
                        {/* Toolbar Editor */}
                        <div className="flex flex-wrap gap-2 p-2 bg-slate-100 border-b border-ivory-300">
                          <button type="button" onClick={() => jalankanFormat('bold')} className="px-2 py-1 bg-white border border-slate-200 rounded font-bold hover:bg-slate-50 shadow-sm text-sm">B</button>
                          <button type="button" onClick={() => jalankanFormat('italic')} className="px-2 py-1 bg-white border border-slate-200 rounded italic hover:bg-slate-50 shadow-sm text-sm">I</button>
                          <button type="button" onClick={() => jalankanFormat('underline')} className="px-2 py-1 bg-white border border-slate-200 rounded underline hover:bg-slate-50 shadow-sm text-sm">U</button>
                          <div className="w-px h-6 bg-slate-300 mx-1 mt-1"></div>
                          <button type="button" onClick={() => jalankanFormat('justifyLeft')} className="px-2 py-1 bg-white border border-slate-200 rounded hover:bg-slate-50 shadow-sm text-sm">Kiri</button>
                          <button type="button" onClick={() => jalankanFormat('justifyCenter')} className="px-2 py-1 bg-white border border-slate-200 rounded hover:bg-slate-50 shadow-sm text-sm">Tengah</button>
                          <button type="button" onClick={() => jalankanFormat('justifyRight')} className="px-2 py-1 bg-white border border-slate-200 rounded hover:bg-slate-50 shadow-sm text-sm">Kanan</button>
                          <div className="w-px h-6 bg-slate-300 mx-1 mt-1"></div>
                          
                          {/* Dropdown Variabel Cerdas */}
                          <select 
                            onChange={(e) => { if(e.target.value) { sisipkanVariabel(e.target.value); e.target.value=''; } }} 
                            className="px-3 py-1 bg-white border border-blue-200 text-blue-700 font-bold rounded outline-none shadow-sm text-xs cursor-pointer"
                          >
                            <option value="">+ Sisipkan Data Warga</option>
                            <option value="[JENIS_SURAT]">Judul Surat</option>
                            <option value="[NAMA]">Nama Lengkap</option>
                            <option value="[NIK]">NIK</option>
                            <option value="[TTL]">Tempat, Tgl Lahir</option>
                            <option value="[JENIS_KELAMIN]">Jenis Kelamin</option>
                            <option value="[AGAMA]">Agama</option>
                            <option value="[PEKERJAAN]">Pekerjaan</option>
                            <option value="[BLOK]">Nomor Blok Rumah</option>
                            <option value="[KEPERLUAN]">Keperluan Pemohon</option>
                            <option value="[KETERANGAN_ADMIN]">Keterangan Admin</option>
                            <option value="[TANGGAL_HARI_INI]">Tanggal Surat (Otomatis)</option>
                          </select>
                        </div>

                        {/* Area Ketik (Editable Div) */}
                        <div 
                          ref={editorRef}
                          contentEditable
                          className="w-full min-h-[350px] max-h-[50vh] overflow-y-auto p-8 outline-none text-sm leading-relaxed"
                          dangerouslySetInnerHTML={{ __html: masterForm.konten_html }}
                          onBlur={(e) => setMasterForm({...masterForm, konten_html: e.currentTarget.innerHTML})}
                        />
                      </div>
                    </div>

                    <div className="pt-2 sticky bottom-0 bg-slate-50 pb-2">
                      <button type="submit" disabled={isProcessing === 'master'} className="w-full py-3.5 bg-navy-900 text-white font-bold rounded-xl hover:bg-navy-800 transition flex justify-center gap-2 shadow-md">
                        {isProcessing === 'master' ? <Loader2 size={18} className="animate-spin" /> : 'Simpan Master Template'}
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* RENDER HTML FINAL UNTUK DI PRINT OS (DIBUNGKUS ID ISOLASI) */}
      {htmlSiapCetak && (
        <div id="area-kertas-print" className="hidden print:block bg-white text-black">
          <div dangerouslySetInnerHTML={{ __html: htmlSiapCetak }} />
        </div>
      )}
    </>
  );
}