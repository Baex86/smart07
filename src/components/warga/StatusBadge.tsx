'use client';

type Status = 'menunggu' | 'diproses' | 'selesai' | 'ditolak' | 'lunas' | 'belum_lunas' | string;

const CONFIG: Record<string, { label: string; cls: string }> = {
  menunggu: { label: 'Menunggu', cls: 'bg-navy-100 text-navy-700' },
  diproses: { label: 'Diproses', cls: 'bg-accent-100 text-accent-600' },
  selesai: { label: 'Selesai', cls: 'bg-emerald-50 text-emerald-700' },
  ditolak: { label: 'Ditolak', cls: 'bg-red-50 text-red-600' },
  lunas: { label: 'Lunas', cls: 'bg-emerald-50 text-emerald-700' },
  belum_lunas: { label: 'Belum Lunas', cls: 'bg-red-50 text-red-600' },
};

export default function StatusBadge({ status }: { status: Status }) {
  const cfg = CONFIG[status] ?? { label: status, cls: 'bg-navy-100 text-navy-700' };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${cfg.cls}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {cfg.label}
    </span>
  );
}