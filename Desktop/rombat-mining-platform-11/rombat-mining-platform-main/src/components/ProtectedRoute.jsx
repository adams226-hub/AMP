import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, isAuthenticated, loading, getDefaultRoute, hasAccess } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  // Si pas connecté, rediriger vers login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Si des rôles spécifiques sont requis
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Rediriger vers la page par défaut du rôle
    return <Navigate to={getDefaultRoute()} replace />;
  }

  // Vérification supplémentaire basée sur les permissions de chemin
  if (!hasAccess(location.pathname)) {
    return <Navigate to={getDefaultRoute()} replace />;
  }

  return children;
}
