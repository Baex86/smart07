'use server';

import { cookies } from 'next/headers';
import { supabase } from '@/lib/supabaseClient';

async function verifySession() {
  const cookieStore = await cookies();
  const uid = cookieStore.get('smart_system_uid')?.value;
  if (!uid) throw new Error('Sesi tidak valid. Harap login kembali.');
  return uid;
}

export async function buatTiket(tipe: 'aduan' | 'usulan', payload: { judul: string; deskripsi: string }) {
  try {
    const uid = await verifySession();
    const prefix = tipe === 'aduan' ? 'ADN' : 'USL';
    const date = new Date();
    const yyyymm = `${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    const random = Math.floor(1000 + Math.random() * 9000);
    const kode_tiket = `${prefix}-${yyyymm}-${random}`;

    const table = tipe === 'aduan' ? 'aduan_warga' : 'usulan_warga';
    const { error } = await supabase.from(table).insert([{
      buku_induk_id: uid, kode_tiket: kode_tiket, judul: payload.judul, deskripsi: payload.deskripsi, status: 'open'
    }]);

    if (error) throw error;
    return { success: true, message: `Tiket ${kode_tiket} berhasil dibuat.` };
  } catch (error: any) { return { success: false, message: error.message }; }
}

export async function getTiketWarga(tipe: 'aduan' | 'usulan') {
  try {
    const uid = await verifySession();
    const table = tipe === 'aduan' ? 'aduan_warga' : 'usulan_warga';
    const { data, error } = await supabase.from(table).select('*').eq('buku_induk_id', uid).order('created_at', { ascending: false });
    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (error: any) { return { success: false, message: error.message }; }
}

export async function getMasterSuratAktif() {
  try {
    await verifySession();
    const { data, error } = await supabase.from('master_surat').select('id, jenis_surat, konten_html').eq('is_active', true);
    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (error: any) { return { success: false, message: error.message }; }
}

export async function ajukanSurat(payload: {
  master_surat_id: string;
  keperluan: string;
  jenis_barang?: string;
  waktu_kehilangan?: string;
  lokasi_kehilangan?: string;
}) {
  try {
    const uid = await verifySession();
    const { error } = await supabase.from('surat_pengantar').insert([{
      buku_induk_id: uid,
      jenis_surat: payload.master_surat_id,
      keperluan: payload.keperluan,
      jenis_barang: payload.jenis_barang || null,
      waktu_kehilangan: payload.waktu_kehilangan || null,
      lokasi_kehilangan: payload.lokasi_kehilangan || null,
      status: 'menunggu'
    }]);
    if (error) throw error;
    return { success: true, message: 'Pengajuan berhasil dikirim.' };
  } catch (error: any) { return { success: false, message: error.message }; }
}

export async function getSuratWarga() {
  try {
    const uid = await verifySession();
    const { data, error } = await supabase
      .from('surat_pengantar')
      .select('*, buku_induk(*)')
      .eq('buku_induk_id', uid)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (error: any) { return { success: false, message: error.message }; }
}

export async function finalisasiSurat(id: string, keterangan: string) {
  try {
    await verifySession();
    const { error } = await supabase
      .from('surat_pengantar')
      .update({ status: 'selesai', keterangan_admin: keterangan })
      .eq('id', id);
    if (error) throw error;
    return { success: true, message: 'Surat berhasil difinalisasi.' };
  } catch (error: any) { return { success: false, message: error.message }; }
}

export async function getSemuaLayananAdmin() {
  try {
    await verifySession();
    const [suratRes, aduanRes, usulanRes, masterRes, akunRes, draftRes, resetRes] = await Promise.all([
      supabase.from('surat_pengantar').select('*, buku_induk(*)').order('created_at', { ascending: false }),
      supabase.from('aduan_warga').select('*, buku_induk(nama_lengkap, nomor_rumah)').order('created_at', { ascending: false }),
      supabase.from('usulan_warga').select('*, buku_induk(nama_lengkap, nomor_rumah)').order('created_at', { ascending: false }),
      supabase.from('master_surat').select('*').order('created_at', { ascending: false }),
      supabase.from('buku_induk').select('*, users(role, is_approved)').order('created_at', { ascending: false }),
      supabase.from('draft_perubahan_data').select('*, buku_induk(nama_lengkap, nomor_rumah)').eq('status', 'menunggu').order('created_at', { ascending: false }),
      supabase.from('tiket_reset_password').select('*, buku_induk(nama_lengkap, nomor_rumah, no_wa)').eq('status', 'menunggu').order('created_at', { ascending: false })
    ]);

    const dataAkun = (akunRes.data || []).filter(w => w.users && w.users.is_approved === false);

    return {
      success: true,
      dataSurat: suratRes.data || [],
      dataAduan: aduanRes.data || [],
      dataUsulan: usulanRes.data || [],
      dataMasterSurat: masterRes.data || [],
      dataAkun: dataAkun,
      dataDraft: draftRes.data || [],
      dataResetSandi: resetRes.data || []
    };
  } catch (error: any) { return { success: false, message: error.message }; }
}

export async function tanggapiTiket(tipe: 'aduan' | 'usulan', id: string, tanggapan: string) {
  try {
    await verifySession();
    const table = tipe === 'aduan' ? 'aduan_warga' : 'usulan_warga';
    const { error } = await supabase.from(table).update({ tanggapan_admin: tanggapan, status: 'resolved' }).eq('id', id);
    if (error) throw error;
    return { success: true };
  } catch (error: any) { return { success: false, message: error.message }; }
}

export async function updateStatusLayanan(table: string, id: string, status: string) {
  try {
    await verifySession();
    const { error } = await supabase.from(table).update({ status }).eq('id', id);
    if (error) throw error;
    return { success: true };
  } catch (error: any) { return { success: false, message: error.message }; }
}

export async function tambahMasterSurat(payload: { jenis_surat: string; konten_html: string }) {
  try {
    await verifySession();
    const { error } = await supabase.from('master_surat').insert([payload]);
    if (error) throw error;
    return { success: true };
  } catch (error: any) { return { success: false, message: error.message }; }
}

export async function updateMasterSurat(id: string, payload: { jenis_surat: string; konten_html: string }) {
  try {
    await verifySession();
    const { error } = await supabase.from('master_surat').update(payload).eq('id', id);
    if (error) throw error;
    return { success: true };
  } catch (error: any) { return { success: false, message: error.message }; }
}

export async function hapusMasterSurat(id: string) {
  try {
    await verifySession();
    const { error } = await supabase.from('master_surat').delete().eq('id', id);
    if (error) throw error;
    return { success: true };
  } catch (error: any) { return { success: false, message: error.message }; }
}

// --- FUNGSI ADMIN APPROVE RESET PASSWORD ---
export async function approveTiketReset(tiketId: string) {
  try {
    await verifySession();
    const expiredAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // Berlaku 24 Jam
    
    const { data, error } = await supabase
      .from('tiket_reset_password')
      .update({ status: 'disetujui', expired_at: expiredAt })
      .eq('id', tiketId)
      .select('token, buku_induk(nama_lengkap, no_wa)')
      .single();

    if (error || !data) throw new Error('Gagal menyetujui tiket reset sandi.');
    
    // FIX TYPESCRIPT: Handle data relasi jika terbaca sebagai array oleh TS
    const buku = Array.isArray(data.buku_induk) ? data.buku_induk[0] : data.buku_induk;
    
    return { 
      success: true, 
      token: data.token, 
      no_wa: buku?.no_wa, 
      nama: buku?.nama_lengkap 
    };
  } catch (error: any) { 
    return { success: false, message: error.message }; 
  }
}

export async function tolakTiketReset(tiketId: string) {
  try {
    await verifySession();
    const { error } = await supabase.from('tiket_reset_password').update({ status: 'selesai' }).eq('id', tiketId);
    if (error) throw new Error('Gagal menolak tiket.');
    return { success: true };
  } catch (error: any) { 
    return { success: false, message: error.message }; 
  }
}

// --- FUNGSI BARU: HITUNG TOTAL ANTREAN NOTIFIKASI NAVBAR ---
export async function getPendingLayananCount() {
  try {
    const [surat, aduan, usulan, akun, draft, reset] = await Promise.all([
      supabase.from('surat_pengantar').select('id', { count: 'exact', head: true }).eq('status', 'menunggu'),
      supabase.from('aduan_warga').select('id', { count: 'exact', head: true }).eq('status', 'open'),
      supabase.from('usulan_warga').select('id', { count: 'exact', head: true }).eq('status', 'review'),
      supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'warga').eq('is_approved', false),
      supabase.from('draft_perubahan_data').select('id', { count: 'exact', head: true }).eq('status', 'menunggu'),
      supabase.from('tiket_reset_password').select('id', { count: 'exact', head: true }).eq('status', 'menunggu')
    ]);

    const total = (surat.count || 0) + (aduan.count || 0) + (usulan.count || 0) + (akun.count || 0) + (draft.count || 0) + (reset.count || 0);
    return total;
  } catch (error) {
    return 0;
  }
}

export async function prosesPerubahanData(draftId: string, action: 'setujui' | 'tolak') {
  try {
    await verifySession();

    const { data: draft, error: errDraft } = await supabase
      .from('draft_perubahan_data')
      .select('*')
      .eq('id', draftId)
      .single();

    if (errDraft || !draft) throw new Error('Pengajuan tidak ditemukan.');
    if (draft.status !== 'menunggu') throw new Error('Pengajuan sudah diproses sebelumnya.');

    const dataBaru = typeof draft.data_baru === 'string' ? JSON.parse(draft.data_baru) : draft.data_baru;

    if (action === 'setujui') {
      const { error: errUpdate } = await supabase
        .from('buku_induk')
        .update(dataBaru)
        .eq('id', draft.buku_induk_id);
      if (errUpdate) throw new Error('Gagal memperbarui data warga: ' + errUpdate.message);

      if (dataBaru.no_wa) {
        const { data: bi } = await supabase
          .from('buku_induk')
          .select('user_id')
          .eq('id', draft.buku_induk_id)
          .single();
        if (bi?.user_id) {
          await supabase.from('users').update({ no_wa: dataBaru.no_wa }).eq('id', bi.user_id);
        }
      }
    }

    const newStatus = action === 'setujui' ? 'disetujui' : 'ditolak';
    const { error: errStatus } = await supabase
      .from('draft_perubahan_data')
      .update({ status: newStatus })
      .eq('id', draftId);
    if (errStatus) throw new Error('Gagal mengubah status pengajuan: ' + errStatus.message);

    await supabase.from('log_perubahan_data').insert([{
      draft_id: draftId,
      buku_induk_id: draft.buku_induk_id,
      aksi: newStatus,
      data_lama: draft.data_lama ?? null,
      data_baru: draft.data_baru ?? null
    }]);

    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}