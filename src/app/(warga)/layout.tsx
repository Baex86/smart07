import SidebarWarga from '@/components/navigation/SidebarWarga';
import BottomNavWarga from '@/components/navigation/BottomNavWarga';

export default function WargaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-paper">
      {/* Sidebar untuk Desktop (Tersembunyi di Mobile & Tablet) */}
      <SidebarWarga />

      {/* Konten Utama */}
      {/* 
        lg:pl-64 -> Menggeser konten ke kanan sebesar lebar sidebar di layar besar
        pb-24 -> Ruang kosong di bawah agar konten tidak tertutup Bottom Nav di HP
        lg:pb-0 -> Menghilangkan padding bawah di PC karena tidak ada Bottom Nav
      */}
      <main className="lg:pl-64 pb-24 lg:pb-0 min-h-screen">
        <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
          {children}
        </div>
      </main>

      {/* Bottom Nav untuk Mobile & Tablet (Tersembunyi di Desktop) */}
      <BottomNavWarga />
    </div>
  );
}