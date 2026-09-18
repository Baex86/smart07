'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseclient';
import { Loader2, User, Users, MapPin, CreditCard, Phone, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ProfilPage() {
  const [profil, setProfil] = useState<any>(null);
  const [keluarga, setKeluarga] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        // 1. Tarik profil yang login
        const { data: myData, error: errProfil } = await supabase
          .from('buku_induk')
          .select('*')
          .eq('user_id', session.user.id)
          .single();

        if (errProfil) throw errProfil;

        if (myData) {
          setProfil(myData);
          
          // 2. Logic rujukan hierarki keluarga
          const familyReferenceId = myData.kepala_keluarga_id ? myData.kepala_keluarga_id : myData.id;

          // 3. Tarik semua entitas keluarga yang terikat dengan ID tersebut
          const { data: familyData, error: errFamily } = await supabase
            .from('buku_induk')
            .select('*')
            .or(`id.eq.${familyReferenceId},kepala_keluarga_id.eq.${familyReferenceId}`)
            .order('created_at', { ascending: true });

          if (!errFamily && familyData) {
            // Hilangkan diri sendiri dari daftar keluarga
            const otherFamilyMembers = familyData.filter((member: any) => member.id !== myData.id);
            setKeluarga(otherFamilyMembers);
          }
        }
      } catch (error) {
        console.error('Gagal menarik profil:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader2 className="animate-spin text-navy-800" size={40} />
      </div>
    );
  }

  if (!profil) {
    return (
      <div className="p-6 text-center text-red-500 font-bold">
        Gagal memuat data profil.
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 pb-20 md:pb-0">
      <div>
        <h1 className="text-3xl font-extrabold text-navy-900 tracking-tight">Profil Warga</h1>
        <p className="text-navy-500 mt-1 text-sm font-medium">Informasi kependudukan Anda dan keluarga.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kolom Kiri: Profil Pribadi */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-ivory-300 rounded-2xl shadow-sm overflow-hidden">
            <div className="bg-navy-900 p-6 text-ivory-50 flex items-center gap-4">
              <div className="w-16 h-16 bg-gold rounded-full flex items-center justify-center text-navy-900 shadow-inner">
                <User size={32} />
              </div>
              <div>
                <h2 className="text-2xl font-extrabold tracking-tight leading-tight">{profil.nama_lengkap}</h2>
                <p className="text-navy-200 text-xs font-bold uppercase tracking-wider mt-1">{profil.status_hubungan || 'Warga'}</p>
              </div>
            </div>
            
            <div className="p-6 md:p-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="flex items-center gap-2 text-xs font-bold text-navy-400 uppercase tracking-wider mb-1"><CreditCard size={14}/> NIK</label>
                <p className="font-medium text-navy-900">{profil.nik || '-'}</p>
              </div>
              <div>
                <label className="flex items-center gap-2 text-xs font-bold text-navy-400 uppercase tracking-wider mb-1"><CreditCard size={14}/> Nomor KK</label>
                <p className="font-medium text-navy-900">{profil.no_kk || '-'}</p>
              </div>
              <div>
                <label className="flex items-center gap-2 text-xs font-bold text-navy-400 uppercase tracking-wider mb-1"><Phone size={14}/> WhatsApp</label>
                <p className="font-medium text-navy-900">{profil.no_wa || '-'}</p>
              </div>
              <div>
                <label className="flex items-center gap-2 text-xs font-bold text-navy-400 uppercase tracking-wider mb-1"><MapPin size={14}/> Nomor Rumah</label>
                <p className="font-medium text-navy-900 font-mono bg-ivory-100 px-2 py-0.5 rounded w-fit">{profil.nomor_rumah || '-'}</p>
              </div>
              <div>
                <label className="flex items-center gap-2 text-xs font-bold text-navy-400 uppercase tracking-wider mb-1"><Calendar size={14}/> TTL</label>
                <p className="font-medium text-navy-900">{profil.tempat_lahir || '-'}, {profil.tanggal_lahir ? new Date(profil.tanggal_lahir).toLocaleDateString('id-ID') : '-'}</p>
              </div>
              <div>
                <label className="flex items-center gap-2 text-xs font-bold text-navy-400 uppercase tracking-wider mb-1"><User size={14}/> Pekerjaan</label>
                <p className="font-medium text-navy-900">{profil.pekerjaan || '-'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Daftar Keluarga */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-ivory-300 rounded-2xl shadow-sm p-6 h-full">
            <h3 className="text-lg font-extrabold text-navy-900 flex items-center gap-2 mb-5">
              <Users className="text-gold" size={20} /> Anggota Keluarga
            </h3>
            
            {keluarga.length > 0 ? (
              <div className="space-y-4">
                {keluarga.map((k) => (
                  <div key={k.id} className="p-4 bg-ivory-50 border border-ivory-200 rounded-xl">
                    <p className="font-bold text-navy-900 text-sm leading-tight">{k.nama_lengkap}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[10px] font-extrabold text-navy-400 uppercase tracking-wider">{k.status_hubungan}</span>
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md uppercase tracking-wider border ${k.user_id ? 'bg-green-100 text-green-700 border-green-200' : 'bg-yellow-100 text-yellow-700 border-yellow-200'}`}>
                        {k.user_id ? 'Aktif' : 'Belum Login'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 bg-ivory-50 border border-dashed border-ivory-300 rounded-xl">
                <p className="text-sm font-medium text-navy-400">Tidak ada anggota keluarga lain yang terdaftar.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}