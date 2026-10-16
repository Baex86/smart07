'use client';

import { jsPDF } from 'jspdf';

type SuratData = {
  jenis_surat: string;
  keperluan: string;
  created_at: string;
  buku_induk?: {
    nama_lengkap?: string;
    nomor_rumah?: string;
    [key: string]: any;
  } | null;
};

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|h[1-6])>/gi, '\n')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function formatTanggal(iso: string): string {
  const d = new Date(iso);
  const bulan = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ];
  return `${d.getDate()} ${bulan[d.getMonth()]} ${d.getFullYear()}`;
}

/**
 * Generate & unduh surat pengantar sebagai PDF.
 * Me-render ulang dari template setiap kali (tanpa storage/kolom PDF).
 */
export async function generateSuratPDF(surat: SuratData) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageW = 210;
  const marginX = 20;
  const contentW = pageW - marginX * 2;
  let y = 20;

  const nama = surat.buku_induk?.nama_lengkap ?? '-';
  const rumah = surat.buku_induk?.nomor_rumah ?? '-';

  // --- Kop Surat ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(11, 18, 32);
  doc.text('RUKUN TETANGGA 07 / RUKUN WARGA 06', pageW / 2, y, { align: 'center' });
  y += 6;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Griya Permata Meri, Mojokerto', pageW / 2, y, { align: 'center' });
  y += 5;
  doc.setFontSize(9);
  doc.setTextColor(100, 110, 120);
  doc.text('Sekretariat: Perumahan Griya Permata Meri', pageW / 2, y, { align: 'center' });
  y += 8;

  // Garis kop (tebal + tipis)
  doc.setDrawColor(11, 18, 32);
  doc.setLineWidth(0.8);
  doc.line(marginX, y, pageW - marginX, y);
  y += 1.5;
  doc.setLineWidth(0.3);
  doc.line(marginX, y, pageW - marginX, y);
  y += 12;

  // --- Judul Surat ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(11, 18, 32);
  doc.text('SURAT PENGANTAR', pageW / 2, y, { align: 'center' });
  y += 7;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 110, 120);
  doc.text(`Nomor: 07/RW06/${surat.jenis_surat.toUpperCase()}/${new Date(surat.created_at).getFullYear()}`, pageW / 2, y, { align: 'center' });
  y += 14;

  // --- Isi Surat ---
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(30, 36, 50);
  const lines = doc.splitTextToSize(
    `Yang bertanda tangan di bawah ini, Ketua RT 07 RW 06 Griya Permata Meri, menerangkan bahwa:\n\nNama        : ${nama}\nAlamat      : ${surat.buku_induk?.alamat ?? `Rumah No. ${rumah}, Griya Permata Meri`}\n\nAdalah benar warga RT 07 RW 06 Griya Permata Meri, dan surat ini diterbitkan untuk keperluan: ${surat.keperluan}.`,
    contentW
  );
  doc.text(lines, marginX, y);
  y += lines.length * 5.5 + 8;

  doc.text(
    'Demikian surat pengantar ini dibuat untuk dipergunakan sebagaimana mestinya.',
    marginX,
    y
  );

  // --- Tanda tangan ---
  y = 220;
  doc.setFontSize(10);
  doc.text('Mojokerto, ' + formatTanggal(surat.created_at), pageW - marginX, y, { align: 'right' });
  y += 22;
  doc.text('Ketua RT 07 RW 06', pageW - marginX, y, { align: 'right' });

  const filename = `Surat-Pengantar-${surat.jenis_surat}-${nama.replace(/\s+/g, '-')}.pdf`;
  doc.save(filename);
}