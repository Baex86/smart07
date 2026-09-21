'use server';

import { cookies } from 'next/headers';
import { supabase } from '@/lib/supabaseClient';

async function verifySession() {
  const cookieStore = await cookies();
  const uid = cookieStore.get('smart_system_uid')?.value;
  if (!uid) throw new Error('Sesi tidak valid. Silakan login kembali.');
  return uid;
}

export async function getKeuanganData() {
  try {
    await verifySession();
    
    const [kasRes, katRes, antreanRes, masterRes, riwayatRes] = await Promise.all([
      supabase.from('arus_kas').select('*, kategori_kas(nama)').order('tanggal', { ascending: false }).order('created_at', { ascending: false }),
      supabase.from('kategori_kas').select('*'),
      supabase.from('iuran_kas').select('*, buku_induk(nama_lengkap, nomor_rumah)').eq('status', 'menunggu_konfirmasi').order('created_at', { ascending: true }),
      supabase.from('master_iuran').select('*').order('created_at', { ascending: false }),
      supabase.from('iuran_kas').select('*, buku_induk(nama_lengkap, nomor_rumah)').order('tahun', { ascending: false }).order('bulan', { ascending: false })
    ]);

    return {
       success: true,
       arusKas: kasRes.data || [],
       kategoriList: katRes.data || [],
       antreanIuran: antreanRes.data || [],
       masterIuran: masterRes.data || [],
       riwayatIuran: riwayatRes.data || []
     };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export async function catatArusKasManual(payload: {
  tanggal: string;
  keterangan: string;
  tipe: string;
  nominal: number;
  kategori_id: string;
}) {
  try {
    await verifySession();
    if (!payload.keterangan || !payload.tipe || payload.nominal <= 0 || !payload.kategori_id) {
      throw new Error('Semua data wajib diisi dengan format yang benar.');
    }
    const { error } = await supabase.from('arus_kas').insert([payload]);
    if (error) throw error;
    return { success: true, message: 'Transaksi berhasil dicatat.' };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export async function prosesVerifikasiIuran(iuranId: string, action: 'terima' | 'tolak') {
  try {
    await verifySession();

    const { data: iuran } = await supabase.from('iuran_kas').select('*, buku_induk(nama_lengkap, nomor_rumah)').eq('id', iuranId).single();
    if (!iuran) throw new Error('Data tagihan tidak ditemukan.');

    if (action === 'tolak') {
      const { error } = await supabase.from('iuran_kas').update({ status: 'belum_lunas' }).eq('id', iuranId);
      if (error) throw error;
      return { success: true, message: 'Pembayaran ditolak. Dikembalikan ke tagihan warga.' };
    }

    const { error: errUpdate } = await supabase.from('iuran_kas').update({ status: 'lunas' }).eq('id', iuranId);
    if (errUpdate) throw errUpdate;

    const { data: kategori } = await supabase.from('kategori_kas').select('id').eq('tipe', 'masuk').ilike('nama', '%iuran%').limit(1).single();

    const { error: errKas } = await supabase.from('arus_kas').insert([{
      tanggal: new Date().toISOString().split('T')[0],
      keterangan: `Pembayaran ${iuran.nama_iuran} - Blok ${iuran.buku_induk?.nomor_rumah} (${iuran.buku_induk?.nama_lengkap})`,
      tipe: 'masuk',
      nominal: iuran.nominal,
      kategori_id: kategori ? kategori.id : null
    }]);

    if (errKas) throw errKas;
    return { success: true, message: 'Iuran disetujui & otomatis masuk ke Buku Besar.' };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

// --- FUNGSI BARU: MANAJEMEN MASTER & GENERATE TAGIHAN ---

export async function tambahMasterIuran(payload: { nama: string; tipe: string; nominal_default: number; tgl_terbit_default: number; tgl_jatuh_tempo_default: number }) {
  try {
    await verifySession();
    const { error } = await supabase.from('master_iuran').insert([payload]);
    if (error) throw error;
    return { success: true, message: 'Master Iuran berhasil ditambahkan.' };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export async function generateTagihanMassal(masterId: string) {
  try {
    await verifySession();
    
    const { data: master } = await supabase.from('master_iuran').select('*').eq('id', masterId).single();
    if (!master) throw new Error('Master iuran tidak ditemukan.');

    const { data: wargaAktif } = await supabase
      .from('buku_induk')
      .select('id')
      .is('kepala_keluarga_id', null)
      .eq('is_completed', true);

    if (!wargaAktif || wargaAktif.length === 0) throw new Error('Belum ada KK warga yang aktif.');

    const bulanIni = new Date().getMonth() + 1;
    const tahunIni = new Date().getFullYear();

    const { data: cekDobel } = await supabase
      .from('iuran_kas')
      .select('id')
      .eq('master_iuran_id', masterId)
      .eq('bulan', bulanIni)
      .eq('tahun', tahunIni)
      .limit(1);

    if (cekDobel && cekDobel.length > 0) {
      throw new Error(`Tagihan ${master.nama} untuk bulan ${bulanIni}/${tahunIni} sudah pernah diterbitkan.`);
    }

    // Hitung tanggal jatuh tempo otomatis dari settingan Master
    const tglJatuhTempo = master.tgl_jatuh_tempo_default || 10;
    const batasWaktuString = new Date(tahunIni, bulanIni - 1, tglJatuhTempo + 1).toISOString().split('T')[0];

    const payloadMassal = wargaAktif.map(warga => ({
      buku_induk_id: warga.id,
      master_iuran_id: master.id,
      nama_iuran: master.nama,
      bulan: bulanIni,
      tahun: tahunIni,
      nominal: master.nominal_default,
      batas_waktu: batasWaktuString,
      status: 'belum_lunas'
    }));

    const { error: errInsert } = await supabase.from('iuran_kas').insert(payloadMassal);
    if (errInsert) throw errInsert;

    return { success: true, message: `Berhasil menerbitkan tagihan ke ${wargaAktif.length} KK warga.` };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}