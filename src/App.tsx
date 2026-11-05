import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { Sidebar } from './components/layout/Sidebar.tsx';
import { Navbar } from './components/layout/Navbar.tsx';
import { LandingPage } from './pages/LandingPage.tsx';
import { DashboardPage } from './pages/DashboardPage.tsx';
import { ProductsPage } from './pages/ProductsPage.tsx';
import { InventoryPage } from './pages/InventoryPage.tsx';
import { WarehousesPage } from './pages/WarehousesPage.tsx';
import { SuppliersPage } from './pages/SuppliersPage.tsx';
import { PurchaseOrdersPage } from './pages/PurchaseOrdersPage.tsx';
import { SalesPage } from './pages/SalesPage.tsx';
import { AiInsightsPage } from './pages/AiInsightsPage.tsx';
import { ReportsPage } from './pages/ReportsPage.tsx';
import { NotificationsPage } from './pages/NotificationsPage.tsx';
import { SettingsPage } from './pages/SettingsPage.tsx';
import { NotificationItem } from './types/index.ts';
import { api } from './services/api.ts';
import { RefreshCw } from 'lucide-react';

function AppContent() {
  const { user, isLoading } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [pendingPoCount, setPendingPoCount] = useState<number>(0);
  const [preFillPOItem, setPreFillPOItem] = useState<any | null>(null);

  const fetchGlobalAlerts = async () => {
    if (!user) return;
    try {
      const [notifRes, poRes] = await Promise.all([
        api.notifications.getAll(),
        api.purchaseOrders.getAll({ status: 'Pending Approval' }),
      ]);

      if (notifRes.success) setNotifications(notifRes.notifications);
      if (poRes.success) setPendingPoCount(poRes.count || 0);
    } catch (e) {
      console.warn('Failed to fetch global alerts:', e);
    }
  };

  useEffect(() => {
    if (user) {
      fetchGlobalAlerts();
    }
  }, [user, currentTab]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
        <RefreshCw className="w-10 h-10 animate-spin text-blue-500 mb-4" />
        <h3 className="text-lg font-bold">SupplySense Platform</h3>
        <p className="text-xs text-slate-400 mt-1">Connecting to inventory intelligence database...</p>
      </div>
    );
  }

  if (!user) {
    return <LandingPage />;
  }

  const handleNavigateToPOWithItem = (item: any) => {
    setPreFillPOItem(item);
    setCurrentTab('purchase-orders');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onTabChange={tab => {
          setPreFillPOItem(null);
          setCurrentTab(tab);
        }}
        unreadCount={notifications.filter(n => !n.isRead).length}
        pendingPoCount={pendingPoCount}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Sticky Top Navbar */}
        <Navbar
          currentTab={currentTab}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          onNavigate={tab => {
            setPreFillPOItem(null);
            setCurrentTab(tab);
          }}
          notifications={notifications}
          onNotificationRead={fetchGlobalAlerts}
        />

        {/* Dynamic Page Views */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto w-full">
          {currentTab === 'dashboard' && <DashboardPage onNavigate={setCurrentTab} />}
          {currentTab === 'products' && <ProductsPage />}
          {currentTab === 'inventory' && <InventoryPage />}
          {currentTab === 'warehouses' && <WarehousesPage />}
          {currentTab === 'suppliers' && <SuppliersPage />}
          {currentTab === 'purchase-orders' && (
            <PurchaseOrdersPage initialPreFill={preFillPOItem} />
          )}
          {currentTab === 'sales' && <SalesPage />}
          {currentTab === 'ai-insights' && (
            <AiInsightsPage onNavigateToPOWithItem={handleNavigateToPOWithItem} />
          )}
          {currentTab === 'reports' && <ReportsPage />}
          {currentTab === 'notifications' && (
            <NotificationsPage onNavigate={setCurrentTab} onRefreshNavbar={fetchGlobalAlerts} />
          )}
          {currentTab === 'settings' && <SettingsPage />}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
