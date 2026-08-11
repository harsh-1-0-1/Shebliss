import { Outlet, useLocation, Navigate } from 'react-router-dom';
import AnnouncementBar from './AnnouncementBar';
import Navbar from './Navbar';
import Footer from './Footer';
import BottomNav from './BottomNav';
import CartDrawer from '@/components/cart/CartDrawer';
import AuthModal from '@/components/auth/AuthModal';
import { useAuthStore } from '@/store/authStore';
import MaintenancePage from '@/pages/MaintenancePage';

export default function Layout() {
  const location = useLocation();
  const isAdminPath = location.pathname.startsWith('/admin');
  const { user, isMaintenance, isMaintenanceLoading } = useAuthStore();

  if (isMaintenanceLoading) {
    return null; // Loading state gate to prevent storefront flash
  }

  if (isMaintenance) {
    if (user?.is_admin) {
      if (!isAdminPath) {
        return <Navigate to="/admin" replace />;
      }
    } else {
      // Non-admins (logged out or normal customers) only see the Maintenance page.
      // We still render the AuthModal so the login trigger works.
      return (
        <div className="flex flex-col min-h-screen" style={{ backgroundColor: '#F9F8F6' }}>
          <MaintenancePage />
          <AuthModal />
        </div>
      );
    }
  }

  return (
    <div className="flex flex-col min-h-screen overflow-x-clip" style={{ backgroundColor: '#F9F8F6' }}>
      {!isAdminPath && <AnnouncementBar />}
      <Navbar />
      <main className="flex-1 pb-16 md:pb-0">
        <Outlet />
      </main>
      {!isAdminPath && <Footer />}
      {!isAdminPath && <BottomNav />}
      {!isAdminPath && <CartDrawer />}
      <AuthModal />
    </div>
  );
}
