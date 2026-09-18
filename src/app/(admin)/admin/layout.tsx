import SidebarAdmin from '../../../components/navigation/SidebarAdmin';
import MobileNavAdmin from '../../../components/navigation/MobileNavAdmin';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-ivory-200">
      {/* Sidebar khusus PC */}
      <SidebarAdmin />
      
      {/* Header & Bottom Nav khusus HP */}
      <MobileNavAdmin />

      {/* Konten Utama Admin */}
      <main className="md:pl-64 pt-16 md:pt-0 pb-20 md:pb-0 min-h-screen transition-all duration-300 ease-in-out">
        <div className="max-w-6xl mx-auto w-full p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}