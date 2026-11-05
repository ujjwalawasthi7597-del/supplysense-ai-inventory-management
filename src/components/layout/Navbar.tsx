import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  Bell,
  Search,
  Sparkles,
  ArrowRightLeft,
  CheckCircle2,
  AlertTriangle,
  Package,
  Clock,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { NotificationItem } from '../../types/index.ts';
import { api } from '../../services/api.ts';

interface NavbarProps {
  currentTab: string;
  onOpenMobileSidebar: () => void;
  onNavigate: (tab: string) => void;
  notifications: NotificationItem[];
  onNotificationRead: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onOpenMobileSidebar,
  onNavigate,
  notifications,
  onNotificationRead,
}) => {
  const { user, quickLoginAs } = useAuth();
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await api.notifications.markAllRead();
      onNotificationRead();
    } catch (e) {
      console.error(e);
    }
  };

  const handleItemClick = async (notif: NotificationItem) => {
    if (!notif.isRead) {
      await api.notifications.markRead(notif._id);
      onNotificationRead();
    }
    setShowNotifMenu(false);
    if (notif.link) {
      const tab = notif.link.replace('/', '');
      onNavigate(tab);
    }
  };

  const formatTitle = (tab: string) => {
    switch (tab) {
      case 'dashboard':
        return 'Executive Dashboard';
      case 'products':
        return 'Product Catalog & SKUs';
      case 'inventory':
        return 'Inventory & Stock Movements';
      case 'warehouses':
        return 'Warehouse Facilities';
      case 'suppliers':
        return 'Supplier Directory';
      case 'purchase-orders':
        return 'Purchase Orders & Procurement';
      case 'sales':
        return 'Sales & Dispatch Orders';
      case 'ai-insights':
        return 'AI Supply Chain Intelligence';
      case 'reports':
        return 'Financial & Operational Reports';
      case 'notifications':
        return 'Notification Center';
      case 'settings':
        return 'System & Profile Settings';
      default:
        return 'Dashboard';
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 flex items-center justify-between">
      {/* Left: Mobile Toggle & Page Title */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>{formatTitle(currentTab)}</span>
            {currentTab === 'ai-insights' && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-gradient-to-r from-blue-500/10 to-indigo-500/10 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200">
                <Sparkles className="w-3 h-3 text-blue-600 animate-pulse" />
                Gemini 3.8 Flash
              </span>
            )}
          </h1>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Quick Role Switcher Pill */}
        <button
          type="button"
          onClick={() => quickLoginAs(user?.role === 'admin' ? 'staff' : 'admin')}
          className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200/80 border border-slate-200 transition-all shadow-2xs"
          title={`Currently logged in as ${user?.role}. Click to switch roles instantly for testing.`}
        >
          <ArrowRightLeft className="w-3.5 h-3.5 text-blue-600" />
          <span>Switch to {user?.role === 'admin' ? 'Staff' : 'Admin'}</span>
        </button>

        {/* Notifications Popover */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => setShowNotifMenu(!showNotifMenu)}
            className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifMenu && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-xs text-slate-800">Alerts & Notifications</span>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold bg-blue-100 text-blue-700 rounded-full">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllRead}
                    className="text-[11px] text-blue-600 font-medium hover:underline"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    No active notifications. All systems optimal.
                  </div>
                ) : (
                  notifications.slice(0, 6).map(n => (
                    <button
                      key={n._id}
                      type="button"
                      onClick={() => handleItemClick(n)}
                      className={`w-full text-left p-3.5 hover:bg-slate-50 transition-colors flex items-start gap-3 ${
                        !n.isRead ? 'bg-blue-50/40' : ''
                      }`}
                    >
                      <div className="p-2 rounded-lg bg-slate-100 text-slate-600 shrink-0 mt-0.5">
                        {n.type === 'out_of_stock' ? (
                          <AlertTriangle className="w-4 h-4 text-rose-600" />
                        ) : n.type === 'low_stock' ? (
                          <Package className="w-4 h-4 text-amber-600" />
                        ) : (
                          <Clock className="w-4 h-4 text-blue-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className={`text-xs font-semibold ${!n.isRead ? 'text-slate-900' : 'text-slate-700'} truncate`}>
                            {n.title}
                          </p>
                          {!n.isRead && <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">
                          {n.message}
                        </p>
                      </div>
                    </button>
                  ))
                )}
              </div>

              <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setShowNotifMenu(false);
                    onNavigate('notifications');
                  }}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                >
                  View All Notifications →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Pill */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center uppercase shadow-2xs">
            {user?.name ? user.name.charAt(0) : 'U'}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-bold text-slate-900 leading-tight truncate max-w-[120px]">{user?.name}</p>
            <p className="text-[10px] text-slate-500 capitalize">{user?.role}</p>
          </div>
        </div>
      </div>
    </header>
  );
};
