import React, { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import UserRoleIndicator from './UserRoleIndicator';
import NavigationBreadcrumb from './NavigationBreadcrumb';
import AlertNotificationBadge from './AlertNotificationBadge';
import QuickActionPanel from './QuickActionPanel';
import Icon from 'components/AppIcon';
import { useAuth } from '../../context/AuthContext';

export default function AppLayout({ children, userRole = 'admin', userName = 'Jean Dupont', userSite = 'Site Kamoto' }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Si pas d'utilisateur connecté, rediriger vers login
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const sidebarWidth = sidebarCollapsed ? 64 : 240;

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-background)' }}>
      {/* Sidebar */}
      <div className="flex flex-col h-full">
        <aside
          className={[
            'fixed top-0 left-0 h-full z-nav flex flex-col transition-all duration-[250ms] ease-out',
            'bg-sidebar',
            sidebarCollapsed ? 'w-16' : 'w-[240px]',
            mobileMenuOpen ? 'translate-x-0' : '-translate-x-full',
            'lg:translate-x-0',
          ]?.join(' ')}
          style={{ background: 'var(--color-sidebar)' }}
        >
          {/* Sidebar inner - logo + nav + user */}
          <Sidebar
            isCollapsed={sidebarCollapsed}
            isOpen={mobileMenuOpen}
            onToggleCollapse={() => setSidebarCollapsed(prev => !prev)}
            onClose={() => setMobileMenuOpen(false)}
            userRole={user?.role || userRole}
          />

          {/* Quick actions */}
          <QuickActionPanel
            userRole={user?.role || userRole}
            isCollapsed={sidebarCollapsed}
            onClose={() => setMobileMenuOpen(false)}
          />

          {/* User role indicator */}
          <UserRoleIndicator
            userRole={user?.role || userRole}
            userName={user?.full_name || userName}
            userSite={user?.department || userSite}
            isCollapsed={sidebarCollapsed}
          />
        </aside>
      </div>
      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-[99] lg:hidden"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}
      {/* Mobile menu button */}
      <button
        onClick={() => setMobileMenuOpen(prev => !prev)}
        className="lg:hidden fixed top-4 left-4 z-[150] flex items-center justify-center w-10 h-10 rounded-lg shadow-md transition-all duration-[250ms] ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)' }}
        aria-label={mobileMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
        aria-expanded={mobileMenuOpen}
      >
        <Icon
          name={mobileMenuOpen ? 'X' : 'Menu'}
          size={20}
          color="var(--color-foreground)"
        />
      </button>
      {/* Main content */}
      <main
        className="transition-all duration-[250ms] ease-out min-h-screen"
        style={{
          marginLeft: `${sidebarWidth}px`,
          paddingTop: 0,
        }}
      >
        {/* Top bar */}
        <header
          className="sticky top-0 z-[90] flex items-center justify-between px-6 border-b"
          style={{
            background: 'var(--color-card)',
            borderColor: 'var(--color-border)',
            height: '64px',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          {/* Left: breadcrumb (desktop) / spacer (mobile) */}
          <div className="flex items-center">
            <div className="hidden lg:block">
              <NavigationBreadcrumb />
            </div>
            {/* Mobile spacer for hamburger */}
            <div className="lg:hidden w-12" />
          </div>

          {/* Right: alerts + user info */}
          <div className="flex items-center gap-2">
            <AlertNotificationBadge />
            <div
              className="hidden sm:flex items-center gap-2 pl-3 border-l"
              style={{ borderColor: 'var(--color-border)' }}
            >
              <div
                className="flex items-center justify-center w-8 h-8 rounded-lg text-xs font-semibold"
                style={{
                  background: 'rgba(44,85,48,0.12)',
                  color: 'var(--color-primary)',
                  fontFamily: 'var(--font-caption)',
                  fontWeight: 600,
                }}
              >
                {user?.full_name?.split(' ')?.map(n => n?.[0])?.join('')?.toUpperCase()?.slice(0, 2) || userName?.split(' ')?.map(n => n?.[0])?.join('')?.toUpperCase()?.slice(0, 2)}
              </div>
              <div className="hidden md:block">
                <p
                  className="text-xs font-medium leading-tight"
                  style={{ color: 'var(--color-foreground)', fontFamily: 'var(--font-caption)' }}
                >
                  {user?.full_name || userName}
                </p>
                <p
                  className="text-xs leading-tight"
                  style={{ color: 'var(--color-muted-foreground)', fontFamily: 'var(--font-caption)' }}
                >
                  {user?.department || userSite}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="p-1 rounded hover:bg-gray-100 transition-colors"
                title="Déconnexion"
              >
                <Icon name="LogOut" size={16} color="var(--color-muted-foreground)" />
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="p-6 lg:p-8">
          {/* Mobile breadcrumb */}
          <div className="lg:hidden mb-4">
            <NavigationBreadcrumb />
          </div>
          {children}
          <Toaster
            position="top-right"
            reverseOrder={false}
            gutter={8}
            toastOptions={{
              className: 'border bg-card text-card-foreground shadow-lg p-4 rounded-xl',
              style: {
                maxWidth: '420px',
              },
              success: {
                iconTheme: {
                  primary: '#10b981',
                  secondary: 'white',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: 'white',
                },
              },
            }}
          />
        </div>
      </main>
      {/* Mobile quick actions FAB */}
      <div className="lg:hidden">
        <QuickActionPanel userRole={user?.role || userRole} isCollapsed={false} />
      </div>
    </div>
  );
}