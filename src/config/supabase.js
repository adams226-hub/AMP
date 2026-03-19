import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://mbpvkayzjrvtcelreffo.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1icHZrYXl6anJ2dGNlbHJlZmZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2NzYwMTksImV4cCI6MjA4OTI1MjAxOX0.fiYin6Y1Sa2ZHC8oilhNlo791BORoxVLq6aaDezSQG4';


export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// helper: vérifie qu'un rôle appartient à une liste autorisée
function ensureRoleAccess(userRole, allowedRoles) {
  if (!allowedRoles.includes(userRole)) {
    return { data: null, error: new Error('Accès refusé') };
  }
  return null;
}

// Services pour la plateforme de mining
export const miningService = {
  // Utilisateurs
  async getUsers(userRole) {
    const denied = ensureRoleAccess(userRole, ['admin']);
    if (denied) return denied;
    const { data, error } = await supabase
      .from('users')
      .select('*');
    return { data, error };
  },

  async createUser(userRole, user) {
    const denied = ensureRoleAccess(userRole, ['admin']);
    if (denied) return denied;
    const { data, error } = await supabase
      .from('users')
      .insert([user]);
    return { data, error };
  },

  // Équipements
  async getEquipment(userRole) {
    const { data, error } = await supabase
      .from('equipment')
      .select('*');
    return { data, error };
  },

  async createEquipment(userRole, equipment) {
    const denied = ensureRoleAccess(userRole, ['admin', 'equipement', 'chef_de_site']);
    if (denied) return denied;
    const { data, error } = await supabase
      .from('equipment')
      .insert([equipment]);
    return { data, error };
  },

  // Production
  async getProductionData(userRole) {
    const denied = ensureRoleAccess(userRole, ['admin', 'directeur', 'supervisor', 'operator']);
    if (denied) return denied;
    const { data, error } = await supabase
      .from('production')
      .select('*');
    return { data, error };
  },

  async addProductionData(userRole, production) {
    const denied = ensureRoleAccess(userRole, ['admin', 'directeur', 'supervisor', 'operator']);
    if (denied) return denied;
    const { data, error } = await supabase
      .from('production')
      .insert([production]);
    return { data, error };
  },

  // Dashboard
  async getDashboardStats(userRole) {
    const denied = ensureRoleAccess(userRole, ['admin', 'directeur']);
    if (denied) return denied;
    const { data, error } = await supabase
      .from('dashboard_stats')
      .select('*')
      .single();
    return { data, error };
  },

  // Fuel Management
  async getFuelTransactions(userRole) {
    const denied = ensureRoleAccess(userRole, ['admin', 'supervisor', 'operator']);
    if (denied) return denied;
    const { data, error } = await supabase
      .from('fuel_transactions')
      .select(`
        *,
        equipment:equipment_id (name),
        site:site_id (name)
      `)
      .order('transaction_date', { ascending: false })
      .limit(50);
    if (data) {
      data.forEach(async (item) => {
        if (item.operator_id) {
          const { data: userData } = await supabase
            .from('users')
            .select('full_name')
            .eq('id', item.operator_id)
            .single();
          item.operator = userData?.full_name || 'N/A';
        } else {
          item.operator = 'N/A';
        }
      });
    }
    return { data, error };
  },

  async addFuelTransaction(userRole, entry) {
    const denied = ensureRoleAccess(userRole, ['admin', 'supervisor', 'operator']);
    if (denied) return denied;
    const { date, ...rest } = entry;
    const entryData = {
      ...rest,
      transaction_date: date,
      user_id: (await supabase.auth.getUser()).data.user?.id || null,
      site_id: 1, // Default site ID - should come from context
      created_at: new Date().toISOString()
      // total_cost is automatically calculated by the database as quantity * cost_per_liter
    };
    const { data, error } = await supabase
      .from('fuel_transactions')
      .insert([entryData])
      .select();
    return { data, error };
  },

  async getEquipmentFuelSummary(userRole) {
    const denied = ensureRoleAccess(userRole, ['admin', 'supervisor']);
    if (denied) return denied;
    const { data, error } = await supabase
      .from('equipment_performance')
      .select('*')
      .order('total_fuel_consumed', { ascending: false })
      .limit(20);
    return { data, error };
  }
};

