import SidebarWarga from '@/components/navigation/SidebarWarga';
import BottomNavWarga from '@/components/navigation/BottomNavWarga';

export default function WargaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-ivory-200">
      {/* Sidebar untuk Desktop (Tersembunyi di Mobile) */}
      <SidebarWarga />

      {/* Konten Utama */}
      {/* 
        md:pl-64 -> Menggeser konten ke kanan sebesar lebar sidebar di PC
        pb-20 -> Memberi ruang kosong di bawah agar konten tidak tertutup Bottom Nav di HP
        md:pb-0 -> Menghilangkan padding bawah di PC karena tidak ada Bottom Nav
      */}
      <main className="md:pl-64 pb-20 md:pb-0 min-h-screen transition-all duration-300 ease-in-out">
        <div className="max-w-5xl mx-auto w-full p-4 md:p-8">
          {children}
        </div>
      </main>

      {/* Bottom Nav untuk Mobile (Tersembunyi di Desktop) */}
      <BottomNavWarga />
    </div>
  );
}