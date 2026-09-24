'use server';

import { cookies } from 'next/headers';
import { supabase } from '@/lib/supabaseClient';

async function verifySession() {
  const cookieStore = await cookies();
  const uid = cookieStore.get('smart_system_uid')?.value;
  if (!uid) throw new Error('Sesi tidak valid. Silakan login kembali.');
  return uid;
}

export async function getKasBadanUsaha() {
  try {
    await verifySession();
    const { data, error } = await supabase.from('kas_badan_usaha').select('*').order('tanggal', { ascending: false }).order('created_at', { ascending: false });
    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export async function catatKasBadanUsaha(payload: { tanggal: string; nama_usaha: string; keterangan: string; tipe: string; nominal: number; }) {
  try {
    await verifySession();
    if (!payload.nama_usaha || !payload.keterangan || payload.nominal <= 0) {
      throw new Error('Semua data wajib diisi dengan format yang benar.');
    }
    const { error } = await supabase.from('kas_badan_usaha').insert([payload]);
    if (error) throw error;
    return { success: true, message: 'Transaksi badan usaha berhasil dicatat.' };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export async function hapusKasBadanUsaha(id: string) {
  try {
    await verifySession();
    const { error } = await supabase.from('kas_badan_usaha').delete().eq('id', id);
    if (error) throw error;
    return { success: true, message: 'Transaksi berhasil dihapus.' };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}