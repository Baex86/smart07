'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../../../../lib/supabaseclient';
import { Loader2, ChevronDown, ChevronUp, MessageCircle, User, MapPin, CreditCard, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function WargaPage() {
  const [rawData, setRawData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  useEffect(() => {
    const fetchBukuInduk = async () => {
      try {
        const { data, error } = await supabase
          .from('buku_induk')
          .select(`*, users (is_approved)`)
          .order('created_at', { ascending: false });
        if (error) throw error;
        if (data) setRawData(data);
      } catch (err) {
        console.error('Gagal menarik data warga:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchBukuInduk();
  }, []);

  const { parents, childrenMap } = useMemo(() => {
    const p: any[] = [];
    const cMap: Record<string, any[]> = {};
    rawData.forEach((item) => {
      if (item.kepala_keluarga_id) {
        if (!cMap[item.kepala_keluarga_id]) cMap[item.kepala_keluarga_id] = [];
        cMap[item.kepala_keluarga_id].push(item);
      } else {
        p.push(item);
      }
    });
    return { parents: p, childrenMap: cMap };
  }, [rawData]);

  const toggleCard = (id: string) => {
    setExpandedCard(expandedCard === id ? null : id);
  };

  const generateWALink = (nama: string, phone: string) => {
    if (!phone) return '#';
    let cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('0')) cleaned = '62' + cleaned.substring(1);
    const text = `Halo ${nama}, kami dari Admin RT 07.`;
    return `https://wa.me/${cleaned}?text=${encodeURIComponent(text)}`;
  };

  const getSystemStatus = (item: any) => {
    if (item.users && !item.users.is_approved) return { text: 'Belum ACC', color: 'bg-red-100 text-red-700 border-red-200' };
    if (!item.is_completed) return { text: 'Data Incomplete', color: 'bg-orange-100 text-orange-700 border-orange-200' };
    if (!item.user_id) return { text: 'No Account', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' };
    return { text: 'Aktif', color: 'bg-green-100 text-green-700 border-green-200', icon: true };
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 pb-20 md:pb-0">
      <div>
        <h1 className="text-3xl font-extrabold text-navy-900 tracking-tight">Buku Induk</h1>
        <p className="text-navy-500 mt-1 text-sm">Direktori hierarki data warga.</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-40">
          <Loader2 className="animate-spin text-navy-800" size={32} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {parents.map((parent) => {
            const children = childrenMap[parent.id] || [];
            const isExpanded = expandedCard === parent.id;
            const status = getSystemStatus(parent);

            return (
              <div key={parent.id} className="bg-white border border-ivory-300 rounded-2xl shadow-sm overflow-hidden transition-all">
                {/* Header Card (Bisa diklik buat expand) */}
                <div 
                  onClick={() => toggleCard(parent.id)}
                  className="p-5 cursor-pointer hover:bg-ivory-50 transition-colors flex items-start justify-between"
                >
                  <div className="flex gap-4 items-center">
                    <div className="w-12 h-12 bg-navy-900 text-gold rounded-full flex items-center justify-center shrink-0">
                      <User size={24} />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-navy-900 text-lg leading-tight">{parent.nama_lengkap}</h3>
                      <p className="text-[10px] font-bold text-navy-400 uppercase tracking-wider mt-1">{parent.nomor_rumah || 'Blok -'}</p>
                    </div>
                  </div>
                  <div className="text-navy-300 mt-2 shrink-0">
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>
                </div>

                {/* Detail Expanded */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden border-t border-ivory-100 bg-ivory-50"
                    >
                      <div className="p-5 space-y-5">
                        {/* Status Label & WA */}
                        <div className="flex items-center justify-between">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold rounded border uppercase tracking-wider ${status.color}`}>
                            {status.icon ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                            {status.text}
                          </span>
                          {parent.no_wa && (
                            <a 
                              href={generateWALink(parent.nama_lengkap, parent.no_wa)}
                              target="_blank" rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-[#25D366] hover:bg-[#25D366]/10 p-1.5 rounded-lg transition-colors flex items-center gap-1.5 font-bold text-xs"
                            >
                              <MessageCircle size={16} /> Hubungi
                            </a>
                          )}
                        </div>

                        {/* Biodata Singkat */}
                        <div className="grid grid-cols-2 gap-4 text-sm bg-white p-4 rounded-xl border border-ivory-200">
                          <div>
                            <span className="block text-navy-400 text-xs font-semibold mb-1 flex items-center gap-1"><CreditCard size={12}/> NIK</span>
                            <span className="text-navy-900 font-medium">{parent.nik || '-'}</span>
                          </div>
                          <div>
                            <span className="block text-navy-400 text-xs font-semibold mb-1 flex items-center gap-1"><MapPin size={12}/> Domisili</span>
                            <span className="text-navy-900 font-medium">{parent.status_tinggal || '-'}</span>
                          </div>
                        </div>

                        {/* Accordion Anggota Keluarga */}
                        {children.length > 0 && (
                          <div className="mt-4">
                            <p className="text-xs font-extrabold text-navy-800 uppercase tracking-wider mb-2 px-1">Daftar Anggota Keluarga</p>
                            <div className="space-y-2">
                              {children.map(child => {
                                const childStatus = getSystemStatus(child);
                                return (
                                  <div key={child.id} className="bg-white border border-ivory-200 p-3 rounded-xl flex justify-between items-center">
                                    <div>
                                      <p className="font-bold text-navy-900 text-sm">{child.nama_lengkap}</p>
                                      <div className="flex items-center gap-2 mt-1">
                                        <p className="text-[10px] font-bold text-navy-400 uppercase tracking-wider">{child.status_hubungan}</p>
                                        <span className={`px-1.5 py-0.5 text-[8px] font-bold rounded border uppercase ${childStatus.color}`}>
                                          {childStatus.text}
                                        </span>
                                      </div>
                                    </div>
                                    {child.no_wa && (
                                      <a 
                                        href={generateWALink(child.nama_lengkap, child.no_wa)}
                                        target="_blank" rel="noopener noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        className="text-[#25D366] hover:bg-[#25D366]/10 p-1.5 rounded-lg transition-colors"
                                      >
                                        <MessageCircle size={16} />
                                      </a>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}