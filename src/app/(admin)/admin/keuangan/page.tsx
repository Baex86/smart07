'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../../../../lib/supabaseclient';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function KeuanganPage() {
  const [arusKas, setArusKas] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchKas = async () => {
      const { data, error } = await supabase
        .from('arus_kas')
        .select('*')
        .order('tanggal', { ascending: false });
      
      if (!error && data) setArusKas(data);
      setIsLoading(false);
    };
    fetchKas();
  }, []);

  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-navy-900 tracking-tight">Arus Kas</h1>
        <p className="text-navy-500 mt-1 text-sm">Pencatatan uang masuk dan keluar.</p>
      </div>
      
      <div className="bg-ivory-50 border border-ivory-300 rounded-2xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center items-center h-32">
            <Loader2 className="animate-spin text-navy-800" size={32} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-ivory-100 text-navy-600 border-b border-ivory-300">
                <tr>
                  <th className="p-4 font-bold">Tanggal</th>
                  <th className="p-4 font-bold">Keterangan</th>
                  <th className="p-4 font-bold">Tipe</th>
                  <th className="p-4 font-bold">Nominal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ivory-200">
                {arusKas.map((kas) => (
                  <tr key={kas.id} className="hover:bg-ivory-100 transition-colors">
                    <td className="p-4 text-navy-900">{new Date(kas.tanggal).toLocaleDateString('id-ID')}</td>
                    <td className="p-4 text-navy-600">{kas.keterangan}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${kas.tipe === 'masuk' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'}`}>
                        {kas.tipe}
                      </span>
                    </td>
                    <td className="p-4 font-medium text-navy-900">{formatRupiah(kas.nominal)}</td>
                  </tr>
                ))}
                {arusKas.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-4 text-center text-navy-400">Belum ada transaksi kas.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  );
}