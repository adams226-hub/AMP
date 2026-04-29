import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../config/supabase';

const AuthContext = createContext(null);

// ── Permissions par rôle ──────────────────────────────────────
// Une seule source de vérité, alignée avec Routes.jsx
// admin        → tout
// directeur    → tout sauf Administration
// supervisor   → Équipement, Maintenance, Pièces de rechange
// comptable    → Comptabilité, Données
// chef_de_site → Production uniquement
// operator     → Carburant, Huile

const ROLE_PERMISSIONS = {
  admin: [
    '/',
    '/executive-dashboard',
    '/production-management', '/production-simple', '/production-final',
    '/user-authentication',
    '/equipment-management',
    '/fuel-management',
    '/oil-management',
    '/accounting',
    '/reports',
    '/administration', '/admin-complete', '/admin-working',
    '/stock-management',
    '/data-explorer',
    '/maintenance-planner',
    '/spare-parts',
  ],
  directeur: [
    '/',
    '/executive-dashboard',
    '/production-management', '/production-simple', '/production-final',
    '/equipment-management',
    '/fuel-management',
    '/oil-management',
    '/accounting',
    '/reports',
    '/stock-management',
    '/data-explorer',
    '/maintenance-planner',
    '/spare-parts',
  ],
  supervisor: [
    '/',
    '/equipment-management',
    '/maintenance-planner',
    '/spare-parts',
  ],
  comptable: [
    '/',
    '/accounting',
    '/data-explorer',
  ],
  chef_de_site: [
    '/',
    '/production-management', '/production-simple', '/production-final',
  ],
  operator: [
    '/',
    '/fuel-management',
    '/oil-management',
  ],
};

// Route d'accueil selon le rôle (alignée avec RoleBasedRedirect dans Routes.jsx)
const DEFAULT_ROUTES = {
  admin:        '/executive-dashboard',
  directeur:    '/executive-dashboard',
  supervisor:   '/equipment-management',
  comptable:    '/accounting',
  chef_de_site: '/production-management',
  operator:     '/fuel-management',
};

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) loadUserProfile(session.user);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) loadUserProfile(session.user);
      else { setUser(null); setLoading(false); }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserProfile = async (authUser) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      if (error) throw error;

      setUser({
        id:         authUser.id,
        email:      authUser.email,
        username:   profile?.username  || authUser.email.split('@')[0],
        full_name:  profile?.full_name || authUser.email,
        role:       profile?.role      || 'operator',
        department: profile?.department || null,
        is_active:  profile?.is_active ?? true,
      });
    } catch (err) {
      console.error('Erreur chargement profil:', err);
      setUser({
        id:         authUser.id,
        email:      authUser.email,
        username:   authUser.user_metadata?.username  || authUser.email.split('@')[0],
        full_name:  authUser.user_metadata?.full_name || authUser.email,
        role:       authUser.user_metadata?.role      || 'operator',
        department: null,
        is_active:  true,
      });
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        if (error.message.includes('Invalid login credentials'))
          return { success: false, error: 'Email ou mot de passe incorrect' };
        if (error.message.includes('Email not confirmed'))
          return { success: false, error: 'Veuillez confirmer votre email avant de vous connecter' };
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err) {
      return { success: false, error: 'Erreur de connexion. Veuillez réessayer.' };
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  // Vérifie si le rôle courant peut accéder au chemin donné
  const hasAccess = (path) => {
    if (!user) return false;
    const allowed = ROLE_PERMISSIONS[user.role];
    if (!allowed) return false;
    // Vérification exacte ou par préfixe (ex: /production-management/xxx)
    return allowed.some(p => path === p || (p !== '/' && path.startsWith(p + '/')));
  };

  // Route par défaut selon le rôle
  const getDefaultRoute = () => {
    if (!user) return '/login';
    return DEFAULT_ROUTES[user.role] || '/executive-dashboard';
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      logout,
      hasAccess,
      getDefaultRoute,
      isAuthenticated: !!user,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth doit être utilisé dans un AuthProvider');
  return context;
}

export default AuthContext;
