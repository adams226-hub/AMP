import React from "react";
import { BrowserRouter, Routes as RouterRoutes, Route, Navigate } from "react-router-dom";
import ScrollToTop from './components/ScrollToTop';
import ErrorBoundary from './components/ErrorBoundary';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import NotFound from './pages/NotFound';
import Login from "./pages/login";
import ProductionManagement from "./pages/production-management";
import ProductionSimple from "./pages/production-management/production-simple";
import ProductionFinal from "./pages/production-management/production-final";
import ExecutiveDashboard from "./pages/executive-dashboard";
import UserAuthentication from "./pages/user-authentication";
import EquipmentManagement from "./pages/equipment-management";
import FuelManagement from "./pages/fuel-management";
import OilManagement from "./pages/oil-management";
import Accounting from "./pages/accounting";
import Reports from "./pages/reports";
import Administration from "./pages/administration";
import AdminComplete from "./pages/administration/admin-complete";
import AdminWorking from "./pages/administration/admin-working";
import StockManagement from "./pages/stock-management";
import DataExplorer from "./pages/data-explorer";
import MaintenancePlanner from "./pages/maintenance-planner";
import SpareParts from "./pages/spare-parts";

// ── Rôles et accès ────────────────────────────────────────────
// admin      → tout
// directeur  → tout sauf Administration
// supervisor → Équipement, Maintenance, Pièces de rechange
// comptable  → Comptabilité, Données
// chef_de_site → Production uniquement
// operator   → Carburant, Huile

function RoleBasedRedirect() {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500" />
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  switch (user.role) {
    case 'admin':
    case 'directeur':
      return <Navigate to="/executive-dashboard" replace />;
    case 'supervisor':
      return <Navigate to="/equipment-management" replace />;
    case 'comptable':
      return <Navigate to="/accounting" replace />;
    case 'chef_de_site':
      return <Navigate to="/production-management" replace />;
    case 'operator':
      return <Navigate to="/fuel-management" replace />;
    default:
      return <Navigate to="/executive-dashboard" replace />;
  }
}

function ProtectedRouteWrapper({ children, allowedRoles }) {
  return (
    <ProtectedRoute allowedRoles={allowedRoles}>
      {children}
    </ProtectedRoute>
  );
}

const AppRoutes = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500" />
      </div>
    );
  }

  return (
    <RouterRoutes>
      {/* Login — sans authentification */}
      <Route path="/login" element={
        isAuthenticated ? <Navigate to="/" replace /> : <Login />
      } />

      {/* Racine → redirection selon rôle */}
      <Route path="/" element={<RoleBasedRedirect />} />

      {/* Tableau de bord exécutif — admin, directeur */}
      <Route path="/executive-dashboard" element={
        <ProtectedRouteWrapper allowedRoles={['admin', 'directeur']}>
          <ExecutiveDashboard />
        </ProtectedRouteWrapper>
      } />

      {/* Production — admin, directeur, chef_de_site */}
      <Route path="/production-management" element={
        <ProtectedRouteWrapper allowedRoles={['admin', 'directeur', 'chef_de_site']}>
          <ProductionManagement />
        </ProtectedRouteWrapper>
      } />
      <Route path="/production-simple" element={
        <ProtectedRouteWrapper allowedRoles={['admin', 'directeur', 'chef_de_site']}>
          <ProductionSimple />
        </ProtectedRouteWrapper>
      } />
      <Route path="/production-final" element={
        <ProtectedRouteWrapper allowedRoles={['admin', 'directeur', 'chef_de_site']}>
          <ProductionFinal />
        </ProtectedRouteWrapper>
      } />

      {/* Gestion Utilisateurs — admin uniquement */}
      <Route path="/user-authentication" element={
        <ProtectedRouteWrapper allowedRoles={['admin']}>
          <UserAuthentication />
        </ProtectedRouteWrapper>
      } />

      {/* Équipement — admin, directeur, supervisor */}
      <Route path="/equipment-management" element={
        <ProtectedRouteWrapper allowedRoles={['admin', 'directeur', 'supervisor']}>
          <EquipmentManagement />
        </ProtectedRouteWrapper>
      } />

      {/* Carburant — admin, directeur, operator */}
      <Route path="/fuel-management" element={
        <ProtectedRouteWrapper allowedRoles={['admin', 'directeur', 'operator']}>
          <FuelManagement />
        </ProtectedRouteWrapper>
      } />

      {/* Huile — admin, directeur, operator */}
      <Route path="/oil-management" element={
        <ProtectedRouteWrapper allowedRoles={['admin', 'directeur', 'operator']}>
          <OilManagement />
        </ProtectedRouteWrapper>
      } />

      {/* Comptabilité — admin, directeur, comptable */}
      <Route path="/accounting" element={
        <ProtectedRouteWrapper allowedRoles={['admin', 'directeur', 'comptable']}>
          <Accounting />
        </ProtectedRouteWrapper>
      } />

      {/* Rapports — admin, directeur */}
      <Route path="/reports" element={
        <ProtectedRouteWrapper allowedRoles={['admin', 'directeur']}>
          <Reports />
        </ProtectedRouteWrapper>
      } />

      {/* Administration — admin uniquement */}
      <Route path="/administration" element={
        <ProtectedRouteWrapper allowedRoles={['admin']}>
          <Administration />
        </ProtectedRouteWrapper>
      } />
      <Route path="/admin-complete" element={
        <ProtectedRouteWrapper allowedRoles={['admin']}>
          <AdminComplete />
        </ProtectedRouteWrapper>
      } />
      <Route path="/admin-working" element={
        <ProtectedRouteWrapper allowedRoles={['admin']}>
          <AdminWorking />
        </ProtectedRouteWrapper>
      } />

      {/* Données — admin, directeur, comptable */}
      <Route path="/data-explorer" element={
        <ProtectedRouteWrapper allowedRoles={['admin', 'directeur', 'comptable']}>
          <DataExplorer />
        </ProtectedRouteWrapper>
      } />

      {/* Stock — admin, directeur */}
      <Route path="/stock-management" element={
        <ProtectedRouteWrapper allowedRoles={['admin', 'directeur']}>
          <StockManagement />
        </ProtectedRouteWrapper>
      } />

      {/* Maintenance — admin, directeur, supervisor */}
      <Route path="/maintenance-planner" element={
        <ProtectedRouteWrapper allowedRoles={['admin', 'directeur', 'supervisor']}>
          <MaintenancePlanner />
        </ProtectedRouteWrapper>
      } />

      {/* Pièces de rechange — admin, directeur, supervisor */}
      <Route path="/spare-parts" element={
        <ProtectedRouteWrapper allowedRoles={['admin', 'directeur', 'supervisor']}>
          <SpareParts />
        </ProtectedRouteWrapper>
      } />

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </RouterRoutes>
  );
};

const Routes = () => (
  <BrowserRouter>
    <ErrorBoundary>
      <ScrollToTop />
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </ErrorBoundary>
  </BrowserRouter>
);

export default Routes;
