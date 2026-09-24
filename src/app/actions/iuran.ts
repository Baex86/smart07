'use server';

import { cookies } from 'next/headers';
import { supabase } from '@/lib/supabaseClient';

async function verifySession() {
  const cookieStore = await cookies();
  const uid = cookieStore.get('smart_system_uid')?.value;
  if (!uid) throw new Error('Sesi tidak valid. Harap login kembali.');
  return uid;
}

export async function getIuranWarga() {
  try {
    const uid = await verifySession();
    
    const { data, error } = await supabase
      .from('iuran_kas')
      .select('*')
      .eq('buku_induk_id', uid)
      .order('tahun', { ascending: false })
      .order('bulan', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export async function konfirmasiPembayaran(iuranId: string) {
  try {
    const uid = await verifySession();
    
    const { error } = await supabase
      .from('iuran_kas')
      .update({ status: 'menunggu_konfirmasi' })
      .eq('id', iuranId)
      .eq('buku_induk_id', uid);

    if (error) throw error;
    return { success: true, message: 'Konfirmasi berhasil dikirim.' };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export async function getRingkasanKasRT() {
  try {
    await verifySession();
    const { data, error } = await supabase.from('arus_kas').select('tipe, nominal, tanggal');
    
    if (error) throw error;
    
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let totalMasukBulanIni = 0;
    let totalKeluarBulanIni = 0;
    let totalMasukAll = 0;
    let totalKeluarAll = 0;

    data.forEach(k => {
      const nominal = Number(k.nominal);
      const tgl = new Date(k.tanggal);
      if (k.tipe === 'masuk') {
        totalMasukAll += nominal;
        if (tgl.getMonth() === currentMonth && tgl.getFullYear() === currentYear) {
          totalMasukBulanIni += nominal;
        }
      } else if (k.tipe === 'keluar') {
        totalKeluarAll += nominal;
        if (tgl.getMonth() === currentMonth && tgl.getFullYear() === currentYear) {
          totalKeluarBulanIni += nominal;
        }
      }
    });

    const saldo = totalMasukAll - totalKeluarAll;

    return { 
      success: true, 
      totalMasuk: totalMasukBulanIni, 
      totalKeluar: totalKeluarBulanIni, 
      saldo 
    };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

// --- TAMBAHAN BARU UNTUK TRANSPARANSI ---

export async function getSaldoBadanUsaha() {
  try {
    await verifySession();
    const { data, error } = await supabase.from('kas_badan_usaha').select('tipe, nominal, tanggal');
    
    if (error) throw error;
    
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let totalMasukBulanIni = 0;
    let totalKeluarBulanIni = 0;
    let totalMasukAll = 0;
    let totalKeluarAll = 0;

    data.forEach(k => {
      const nominal = Number(k.nominal);
      const tgl = new Date(k.tanggal);
      if (k.tipe === 'masuk') {
        totalMasukAll += nominal;
        if (tgl.getMonth() === currentMonth && tgl.getFullYear() === currentYear) totalMasukBulanIni += nominal;
      } else if (k.tipe === 'keluar') {
        totalKeluarAll += nominal;
        if (tgl.getMonth() === currentMonth && tgl.getFullYear() === currentYear) totalKeluarBulanIni += nominal;
      }
    });

    return { 
      success: true, 
      totalMasuk: totalMasukBulanIni, 
      totalKeluar: totalKeluarBulanIni, 
      saldo: totalMasukAll - totalKeluarAll 
    };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export async function getTransparansiKeuangan() {
  try {
    await verifySession();
    // Tarik max 500 transaksi terakhir agar memori HP warga tidak terbebani
    const [kasRes, usahaRes] = await Promise.all([
      supabase.from('arus_kas').select('*, kategori_kas(nama)').order('tanggal', { ascending: false }).limit(500),
      supabase.from('kas_badan_usaha').select('*').order('tanggal', { ascending: false }).limit(500)
    ]);

    return {
      success: true,
      kasRT: kasRes.data || [],
      kasUsaha: usahaRes.data || []
    };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}