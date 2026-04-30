import { createClient } from '@supabase/supabase-js';

// Clé publique anon — sécurité gérée par Row Level Security (RLS) côté Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://yxflncpuevwkvnhlavpy.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4ZmxuY3B1ZXZ3a3ZuaGxhdnB5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1OTU3NDYsImV4cCI6MjA5MDE3MTc0Nn0.3j5ykIU-3lJ4tfEzXMfoXr1zeiDDTYt0l2mdcVYx3_M';
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Client admin (service_role) — uniquement pour les opérations admin
const supabaseAdmin = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, { auth: { autoRefreshToken: false, persistSession: false } })
  : null;

const findUserByEmail = async (email) => {
  if (!supabaseAdmin || !email) return null;

  try {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ query: email, limit: 100 });
    if (error) return null;
    return data?.users?.find((user) => user.email?.toLowerCase() === email.toLowerCase()) || null;
  } catch (err) {
    const { data } = await supabaseAdmin.auth.admin.listUsers();
    return data?.users?.find((user) => user.email?.toLowerCase() === email.toLowerCase()) || null;
  }
};

// ============================================================
// MINING SERVICE - Toutes les opérations base de données
// Les contrôles d'accès sont gérés par les RLS Supabase.
// ============================================================

export const miningService = {

  // ============================================================
  // PROFILES / UTILISATEURS
  // ============================================================

  async getUsers() {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    return { data, error };
  },

  async getUserById(id) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    return { data, error };
  },

  // Crée un compte auth Supabase + profil associé
  async createUser(email, password, profile) {
    const meta = {
      full_name:  profile.full_name,
      role:       profile.role,
      username:   profile.username,
      department: profile.department || null,
      phone:      profile.phone      || null,
    };

    // Construit le payload profil — exclut phone si la colonne n'existe pas encore
    const buildProfile = (id, withPhone = true) => {
      const p = {
        id,
        username:   profile.username,
        full_name:  profile.full_name,
        role:       profile.role,
        department: profile.department || null,
        is_active:  true,
      };
      if (withPhone && profile.phone) p.phone = profile.phone;
      return p;
    };

    // Upsert avec fallback si la colonne phone est absente
    const upsertProfile = async (client, id) => {
      const { data, error } = await client.from('profiles').upsert([buildProfile(id, true)]).select().maybeSingle();
      if (error && error.message?.includes('phone')) {
        // Colonne phone pas encore créée : réessayer sans phone
        const { data: d2, error: e2 } = await client.from('profiles').upsert([buildProfile(id, false)]).select().maybeSingle();
        return { data: d2, error: e2 };
      }
      return { data, error };
    };

    // Voie 1 : API admin (service_role key disponible)
    if (supabaseAdmin) {
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email, password, email_confirm: true, user_metadata: meta,
      });

      if (authError) {
        const isDuplicate = authError.message?.includes('already been registered') || authError.message?.includes('duplicate');
        if (isDuplicate) {
          const existingUser = await findUserByEmail(email);
          if (existingUser) {
            const { data, error } = await upsertProfile(supabaseAdmin, existingUser.id);
            if (error) return { data: null, error };
            return { data: data || { id: existingUser.id }, error: null };
          }
        }
        return { data: null, error: authError };
      }

      const { data, error } = await upsertProfile(supabaseAdmin, authData.user.id);
      return { data: data || { id: authData.user.id }, error };
    }

    // Voie 2 : signUp standard (les metadata sont lues par le trigger handle_new_user)
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email, password, options: { data: meta },
    });
    if (authError) {
      const isDuplicate = authError.message?.includes('already been registered') || authError.message?.includes('already registered') || authError.message?.includes('duplicate');
      return { data: null, error: { message: isDuplicate ? 'Cette adresse e-mail est déjà utilisée.' : authError.message } };
    }
    if (!authData?.user) return { data: null, error: { message: 'Création du compte échouée' } };

    const { data, error } = await upsertProfile(supabase, authData.user.id);
    // Si RLS bloque, le trigger a déjà créé le profil → succès
    return { data: data || { id: authData.user.id }, error: error?.code === '42501' ? null : error };
  },

  // Met à jour le profil d'un utilisateur
  async updateUser(userId, updates) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .maybeSingle();
    // Fallback si phone n'existe pas encore : réessayer sans phone
    if (error && error.message?.includes('phone')) {
      const { phone: _, ...updatesWithoutPhone } = updates;
      const { data: d2, error: e2 } = await supabase
        .from('profiles')
        .update(updatesWithoutPhone)
        .eq('id', userId)
        .select()
        .maybeSingle();
      return { data: d2, error: e2 };
    }
    return { data, error };
  },

  // Supprime définitivement un utilisateur (auth + profil)
  async deleteUser(userId) {
    const client = supabaseAdmin || supabase;
    // Supprimer de auth.users (cascade sur profiles)
    const { error: authError } = await client.auth.admin.deleteUser(userId);
    if (authError) return { error: authError };
    // Supprimer aussi de public.users si présent (legacy table)
    await supabase.from('profiles').delete().eq('id', userId);
    return { error: null };
  },

  async getUserStats() {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, is_active, role');

    if (error) return { data: null, error };

    return {
      data: {
        total_users: data.length,
        active_users: data.filter(u => u.is_active).length,
        inactive_users: data.filter(u => !u.is_active).length,
        admin_users: data.filter(u => u.role === 'admin').length,
        updated_at: new Date().toISOString()
      },
      error: null
    };
  },

  // ============================================================
  // ÉQUIPEMENTS
  // ============================================================

  async getEquipment() {
    const { data, error } = await supabase
      .from('equipment')
      .select('*')
      .order('created_at', { ascending: false });
    return { data, error };
  },

  async createEquipment(equipment) {
    const { data, error } = await supabase
      .from('equipment')
      .insert([equipment])
      .select()
      .maybeSingle();
    return { data, error };
  },

  async updateEquipment(id, updates) {
    const { data, error } = await supabase
      .from('equipment')
      .update(updates)
      .eq('id', id)
      .select()
      .maybeSingle();
    return { data, error };
  },

  async deleteEquipment(id) {
    const { error } = await supabase
      .from('equipment')
      .delete()
      .eq('id', id);
    return { error };
  },

  async getMaintenance(equipmentId = null) {
    let query = supabase
      .from('maintenance')
      .select('*')
      .order('start_date', { ascending: false });

    if (equipmentId) {
      query = query.eq('equipment_id', equipmentId);
    }

    const { data, error } = await query;
    return { data, error };
  },

  async addMaintenance(maintenance) {
    const { data, error } = await supabase
      .from('maintenance')
      .insert([maintenance])
      .select()
      .maybeSingle();
    return { data, error };
  },

  async getOperationLogs(equipmentId = null) {
    let query = supabase
      .from('equipment_operation_logs')
      .select('*, equipment:equipment_id (name, type)')
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });
    if (equipmentId) query = query.eq('equipment_id', equipmentId);
    const { data, error } = await query;
    return { data, error };
  },

  async addOperationLog(log) {
    const { data, error } = await supabase
      .from('equipment_operation_logs')
      .insert([log])
      .select()
      .maybeSingle();
    return { data, error };
  },

  // ============================================================
  // PRODUCTION
  // ============================================================

  async getProductionData(startDate = null, endDate = null) {
    let query = supabase
      .from('production')
      .select(`
        *,
        production_details (
          dimension,
          quantity
        )
      `)
      .order('date', { ascending: false });

    if (startDate && endDate) {
      query = query.gte('date', startDate).lte('date', endDate);
    }

    query = query.limit(1000);
    const { data, error } = await query;
    return { data, error };
  },

  async addProductionData(production) {
    const { data: { user } } = await supabase.auth.getUser();

    const { data: productionResult, error: productionError } = await supabase
      .from('production')
      .insert([{
        date: production.date,
        site: production.site,
        shift: production.shift,
        operator: production.operator,
        notes: production.notes,
        total: production.total,
        created_by: user?.id || null
      }])
      .select()
      .maybeSingle();

    if (productionError) return { data: null, error: productionError };

    const details = production.dimensions
      .filter(d => parseFloat(d.quantity) > 0)
      .map(d => ({
        production_id: productionResult.id,
        dimension: d.dimension,
        quantity: parseFloat(d.quantity)
      }));

    if (details.length > 0) {
      const { error: detailsError } = await supabase
        .from('production_details')
        .insert(details);
      if (detailsError) return { data: null, error: detailsError };
    }

    return { data: productionResult, error: null };
  },

  // Sorties de production (livraisons / ventes)
  async getProductionExits() {
    const { data, error } = await supabase
      .from('production_exits')
      .select(`
        *,
        production_exit_details (
          dimension,
          quantity
        )
      `)
      .order('date', { ascending: false });
    return { data, error };
  },

  async addProductionExit(exit) {
    const { data: { user } } = await supabase.auth.getUser();

    const { data: exitResult, error: exitError } = await supabase
      .from('production_exits')
      .insert([{
        date: exit.date,
        destination: exit.destination,
        exit_type: exit.exit_type,
        client_name: exit.client_name,
        notes: exit.notes,
        total: exit.total,
        created_by: user?.id || null
      }])
      .select()
      .maybeSingle();

    if (exitError) return { data: null, error: exitError };

    const details = exit.dimensions
      .filter(d => parseFloat(d.quantity) > 0)
      .map(d => ({
        exit_id: exitResult.id,
        dimension: d.dimension,
        quantity: parseFloat(d.quantity)
      }));

    if (details.length > 0) {
      const { error: detailsError } = await supabase
        .from('production_exit_details')
        .insert(details);
      if (detailsError) return { data: null, error: detailsError };
    }

    return { data: exitResult, error: null };
  },

  // ============================================================
  // TRANSACTIONS FINANCIÈRES (Comptabilité)
  // ============================================================

  async getFinancialTransactions(startDate = null, endDate = null) {
    let query = supabase
      .from('financial_transactions')
      .select('*')
      .order('transaction_date', { ascending: false });

    if (startDate && endDate) {
      query = query.gte('transaction_date', startDate).lte('transaction_date', endDate);
    }

    query = query.limit(1000);
    const { data, error } = await query;
    return { data, error };
  },

  async addFinancialTransaction(transaction) {
    const { data, error } = await supabase
      .from('financial_transactions')
      .insert([{
        transaction_date: transaction.date,
        type: transaction.type,
        category: transaction.category,
        description: transaction.description,
        amount: parseFloat(transaction.amount),
        reference: transaction.reference || null,
        client_supplier: transaction.client_supplier || null,
        payment_method: transaction.payment_method || null,
        payment_status: transaction.status || 'pending',
        notes: transaction.notes || null,
      }])
      .select()
      .maybeSingle();
    return { data, error };
  },

  async updateFinancialTransaction(id, updates) {
    const { error } = await supabase
      .from('financial_transactions')
      .update(updates)
      .eq('id', id);
    return { error };
  },

  async deleteFinancialTransaction(id) {
    const { error } = await supabase
      .from('financial_transactions')
      .delete()
      .eq('id', id);
    return { error };
  },

  // ============================================================
  // CARBURANT
  // ============================================================

  async getFuelTransactions(startDate = null, endDate = null) {
    let query = supabase
      .from('fuel_transactions')
      .select(`
        *,
        equipment:equipment_id (name, type)
      `)
      .order('transaction_date', { ascending: false });

    if (startDate && endDate) {
      query = query.gte('transaction_date', startDate).lte('transaction_date', endDate);
    }

    query = query.limit(1000);
    const { data, error } = await query;
    return { data, error };
  },

  async addFuelTransaction(entry) {
    const isEntry = entry.type === 'entry';
    const { error } = await supabase
      .from('fuel_transactions')
      .insert([{
        transaction_date: entry.date,
        transaction_type: entry.type,
        equipment_id:     isEntry ? null : (entry.equipment_id || null),
        fuel_type:        entry.fuel_type || 'gasoil',
        quantity:         parseFloat(entry.quantity),
        cost_per_liter:   isEntry && entry.cost_per_liter ? parseFloat(entry.cost_per_liter) : null,
        supplier:         entry.supplier || null,
        notes:            entry.notes || null,
        operator_name:    entry.operator_name || null,
      }]);
    return { error };
  },

  async updateFuelTransaction(id, entry) {
    const isEntry = entry.type === 'entry';
    const { error } = await supabase
      .from('fuel_transactions')
      .update({
        transaction_date: entry.date,
        transaction_type: entry.type,
        equipment_id:     isEntry ? null : (entry.equipment_id || null),
        fuel_type:        entry.fuel_type || 'gasoil',
        quantity:         parseFloat(entry.quantity),
        cost_per_liter:   isEntry && entry.cost_per_liter ? parseFloat(entry.cost_per_liter) : null,
        supplier:         entry.supplier || null,
        notes:            entry.notes || null,
        operator_name:    entry.operator_name || null,
      })
      .eq('id', id);
    return { error };
  },

  async deleteFuelTransaction(id) {
    const { error } = await supabase
      .from('fuel_transactions')
      .delete()
      .eq('id', id);
    return { error };
  },

  async getEquipmentFuelSummary() {
    const { data, error } = await supabase
      .from('fuel_transactions')
      .select(`
        equipment_id,
        equipment:equipment_id (name),
        quantity,
        transaction_date
      `)
      .order('transaction_date', { ascending: false });
    return { data, error };
  },

  // ============================================================
  // GESTION DU STOCK
  // ============================================================

  async getStockEntries() {
    // Requête 1 : les entrées
    const { data: entries, error } = await supabase
      .from('stock_entries')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) return { data: null, error };
    if (!entries || entries.length === 0) return { data: [], error: null };

    // Requête 2 : les détails — colonne FK réelle = entry_id
    const ids = entries.map(e => e.id);
    const { data: details } = await supabase
      .from('stock_entry_details')
      .select('entry_id, dimension, quantity')
      .in('entry_id', ids);

    const detailsByEntry = {};
    (details || []).forEach(d => {
      if (!detailsByEntry[d.entry_id]) detailsByEntry[d.entry_id] = [];
      detailsByEntry[d.entry_id].push({ dimension: d.dimension, quantity: d.quantity });
    });

    return {
      data: entries.map(e => ({ ...e, stock_entry_details: detailsByEntry[e.id] || [] })),
      error: null,
    };
  },

  async getStockExits() {
    // Requête 1 : les sorties (ORDER BY date — colonne réelle dans add_stock_tables.sql)
    const { data: exits, error } = await supabase
      .from('stock_exits')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) return { data: null, error };
    if (!exits || exits.length === 0) return { data: [], error: null };

    // Requête 2 : les détails — colonne FK réelle = exit_id (confirmé screenshot Supabase)
    const ids = exits.map(e => e.id);
    const { data: details } = await supabase
      .from('stock_exit_details')
      .select('exit_id, dimension, quantity')
      .in('exit_id', ids);

    // Assemblage
    const detailsByExit = {};
    (details || []).forEach(d => {
      if (!detailsByExit[d.exit_id]) detailsByExit[d.exit_id] = [];
      detailsByExit[d.exit_id].push({ dimension: d.dimension, quantity: d.quantity });
    });

    return {
      data: exits.map(e => ({ ...e, stock_exit_details: detailsByExit[e.id] || [] })),
      error: null,
    };
  },

  async addStockEntry(entry) {
    const { data: { user } } = await supabase.auth.getUser();
    const { dimensions, ...entryData } = entry;

    const { data: entryResult, error: entryError } = await supabase
      .from('stock_entries')
      .insert([{
        date: entryData.date || entryData.entry_date,
        source: entryData.source,
        created_by: user?.id || null,
      }])
      .select()
      .maybeSingle();

    if (entryError) return { data: null, error: entryError };

    const details = dimensions
      .filter(d => parseFloat(d.quantity) > 0)
      .map(d => ({
        entry_id: entryResult.id,      // ✅ colonne réelle (même migration = add_stock_tables.sql)
        dimension: d.size || d.dimension,
        quantity: parseFloat(d.quantity),
      }));

    if (details.length > 0) {
      const { error: detailsError } = await supabase
        .from('stock_entry_details')
        .insert(details);
      if (detailsError) return { data: null, error: detailsError };
    }

    return { data: entryResult, error: null };
  },

  async addStockExit(exit) {
    const { data: { user } } = await supabase.auth.getUser();
    const { dimensions, ...exitData } = exit;

    // Colonnes minimales compatibles avec add_stock_tables.sql (date, destination, exit_type, created_by)
    const { data: exitResult, error: exitError } = await supabase
      .from('stock_exits')
      .insert([{
        date: exitData.date || exitData.exit_date,
        destination: exitData.destination,
        exit_type: exitData.exit_type || 'sale',
        created_by: user?.id || null,
      }])
      .select()
      .maybeSingle();

    if (exitError) return { data: null, error: exitError };

    const details = dimensions
      .filter(d => parseFloat(d.quantity) > 0)
      .map(d => ({
        exit_id: exitResult.id,        // ✅ colonne réelle confirmée
        dimension: d.size || d.dimension,
        quantity: parseFloat(d.quantity),
      }));

    if (details.length > 0) {
      const { error: detailsError } = await supabase
        .from('stock_exit_details')
        .insert(details);
      if (detailsError) return { data: null, error: detailsError };
    }

    return { data: exitResult, error: null };
  },

  async getStockSummary() {
    // Entrées = production enregistrée + entrées manuelles de stock
    // Sorties = sorties depuis la page production + sorties depuis la page stock
    const [prodDetailsResult, stockEntriesResult, prodExitsResult, stockExitsResult] = await Promise.all([
      supabase.from('production_details').select('dimension, quantity'),
      supabase.from('stock_entry_details').select('dimension, quantity'),
      supabase.from('production_exit_details').select('dimension, quantity'),
      supabase.from('stock_exit_details').select('dimension, quantity')
    ]);

    const DIMENSIONS = [
      'Nombre de voyages alimentés', 'Nombre de trous forés', '0/4', '0/5', '0/6',
      '5/15', '8/15', '15/25', '4/6', '10/14', '6/10', '0/31,5'
    ];

    // Alias pour compatibilité avec les anciennes données
    const DIMENSION_ALIASES = {
      'Nombre de voyages alimentés': ['Nombre de voyages alimentés', 'Nombre de voyage alimenter', 'Minerai'],
      'Nombre de trous forés': ['Nombre de trous forés', 'Nombre de trous fore', 'Forage'],
    };

    const allEntries = [
      ...(prodDetailsResult.data || []),
      ...(stockEntriesResult.data || [])
    ];
    const allExits = [
      ...(prodExitsResult.data || []),
      ...(stockExitsResult.data || [])
    ];

    const matchesDimension = (row, dim) => {
      const aliases = DIMENSION_ALIASES[dim];
      if (aliases) return aliases.includes(row.dimension);
      return row.dimension === dim;
    };

    const stockSummary = DIMENSIONS.map(dim => {
      const totalEntries = allEntries
        .filter(e => matchesDimension(e, dim))
        .reduce((sum, e) => sum + parseFloat(e.quantity || 0), 0);
      const totalExits = allExits
        .filter(e => matchesDimension(e, dim))
        .reduce((sum, e) => sum + parseFloat(e.quantity || 0), 0);
      return {
        dimension: dim,
        entries: totalEntries,
        exits: totalExits,
        available: Math.max(0, totalEntries - totalExits)
      };
    });

    return { data: stockSummary, error: null };
  },

  // ============================================================
  // DASHBOARD EXÉCUTIF
  // ============================================================

  async getDashboardStats() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const today = now.toISOString().split('T')[0];

    // Start of current week (Monday)
    const dayOfWeek = now.getDay(); // 0=Sun
    const diffToMon = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() + diffToMon);
    const weekStartStr = weekStart.toISOString().split('T')[0];

    // 6 months ago (for profitability chart)
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const sixMonthsAgoStr = sixMonthsAgo.toISOString().split('T')[0];

    const [
      productionMonthResult,
      productionWeekResult,
      equipmentResult,
      fuelMonthResult,
      fuelByEqResult,
      oilByEqResult,
      financialMonthResult,
      financialSixMonthResult,
      sitesResult,
      prodDetailsResult,
      consumableResult,
    ] = await Promise.all([
      supabase.from('production').select('id, total, date').gte('date', startOfMonth),
      supabase.from('production').select('id, total, date').gte('date', weekStartStr).lte('date', today),
      supabase.from('equipment').select('id, status, name, serial_number'),
      supabase.from('fuel_transactions').select('quantity, cost_per_liter, total_cost, transaction_type').gte('transaction_date', startOfMonth),
      supabase.from('fuel_transactions').select('equipment_id, quantity, total_cost, equipment:equipment_id(name, serial_number)').eq('transaction_type', 'exit').not('equipment_id', 'is', null).gte('transaction_date', weekStartStr).lte('transaction_date', today),
      supabase.from('oil_transactions').select('equipment_id, quantity, transaction_type, equipment:equipment_id(name, serial_number)').eq('transaction_type', 'exit').not('equipment_id', 'is', null).gte('transaction_date', weekStartStr).lte('transaction_date', today),
      supabase.from('financial_transactions').select('amount, type, category').gte('transaction_date', startOfMonth),
      supabase.from('financial_transactions').select('amount, type, transaction_date').gte('transaction_date', sixMonthsAgoStr),
      supabase.from('sites').select('id, name, location, is_active').order('name'),
      supabase.from('production_details').select('dimension, quantity, production_id'),
      supabase.from('consumable_movements').select('movement_type, quantity'),
    ]);

    const productionsMonth = productionMonthResult.data || [];
    const productionsWeek = productionWeekResult.data || [];
    const equipment = equipmentResult.data || [];
    const fuelMonth = fuelMonthResult.data || [];
    const fuelByEq = fuelByEqResult.data || [];
    const oilByEq = oilByEqResult.data || [];
    const financialMonth = financialMonthResult.data || [];
    const financialSixMonth = financialSixMonthResult.data || [];
    const sites = sitesResult.data || [];
    const detailRows = prodDetailsResult.data || [];
    const consumableRows = consumableResult.data || [];

    // ── Stock consommable disponible ──────────────────────────
    const totalConsumableEntries = consumableRows.filter(c => c.movement_type === 'entry').reduce((s, c) => s + parseFloat(c.quantity || 0), 0);
    const totalConsumableExits   = consumableRows.filter(c => c.movement_type === 'exit').reduce((s, c)  => s + parseFloat(c.quantity || 0), 0);
    const totalConsumableStock   = Math.max(0, totalConsumableEntries - totalConsumableExits);

    // ── KPI aggregates ────────────────────────────────────────
    const totalProductionMonth = productionsMonth.reduce((s, p) => s + parseFloat(p.total || 0), 0);
    const todayStr = today;
    const todayProduction = productionsMonth.filter(p => p.date === todayStr).reduce((s, p) => s + parseFloat(p.total || 0), 0);
    const activeEquipment = equipment.filter(e => e.status === 'active').length;
    const totalRevenue = financialMonth.filter(f => f.type === 'income').reduce((s, f) => s + parseFloat(f.amount), 0);
    const totalExpenses = financialMonth.filter(f => f.type === 'expense').reduce((s, f) => s + parseFloat(f.amount), 0);
    const netProfit = totalRevenue - totalExpenses;
    const profitability = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
    const costPerTon = totalProductionMonth > 0 ? totalExpenses / totalProductionMonth : 0;

    // Voyages alimentés : uniquement les saisies d'aujourd'hui
    const todayProductionIds = new Set(productionsMonth.filter(p => p.date === todayStr).map(p => p.id));
    const todayDetailRows = detailRows.filter(d => todayProductionIds.has(d.production_id));

    const totalVoyagesAlimentes = todayDetailRows
      .filter(d => ['Nombre de voyages alimentés', 'Nombre de voyage alimenter', 'Minerai'].includes(d.dimension))
      .reduce((s, d) => s + parseFloat(d.quantity || 0), 0);

    // Trous forés : cumul de toutes les saisies (historique complet)
    const totalTrousFores = detailRows
      .filter(d => ['Nombre de trous forés', 'Nombre de trous fore', 'Forage'].includes(d.dimension))
      .reduce((s, d) => s + parseFloat(d.quantity || 0), 0);

    const totalVoyagesTrous = totalVoyagesAlimentes + totalTrousFores;

    // ── Fuel by equipment (chart) — sorties semaine courante ──
    const fuelByEqMap = {};
    fuelByEq.forEach(f => {
      const label = f.equipment?.name || f.equipment?.serial_number;
      if (!label) return;
      if (!fuelByEqMap[label]) fuelByEqMap[label] = { engin: label, consommation: 0, cout: 0 };
      fuelByEqMap[label].consommation += parseFloat(f.quantity || 0);
      fuelByEqMap[label].cout += parseFloat(f.total_cost || 0);
    });
    const fuelChartData = Object.values(fuelByEqMap).sort((a, b) => b.consommation - a.consommation);

    // ── Oil by equipment (chart) — sorties semaine courante ──
    const oilByEqMap = {};
    oilByEq.forEach(o => {
      const label = o.equipment?.name || o.equipment?.serial_number;
      if (!label) return;
      if (!oilByEqMap[label]) oilByEqMap[label] = { engin: label, consommation: 0 };
      oilByEqMap[label].consommation += parseFloat(o.quantity || 0);
    });
    const oilChartData = Object.values(oilByEqMap).sort((a, b) => b.consommation - a.consommation);

    // ── Monthly profitability (6 months) ─────────────────────
    const monthMap = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('fr-FR', { month: 'short' });
      monthMap[key] = { mois: label.charAt(0).toUpperCase() + label.slice(1), revenus: 0, depenses: 0, benefice: 0 };
    }
    financialSixMonth.forEach(t => {
      const key = t.transaction_date.substring(0, 7);
      if (!monthMap[key]) return;
      if (t.type === 'income') monthMap[key].revenus += parseFloat(t.amount);
      else monthMap[key].depenses += parseFloat(t.amount);
    });
    Object.values(monthMap).forEach(m => { m.benefice = m.revenus - m.depenses; });
    const monthlyProfitData = Object.values(monthMap);

    // ── Production by day (current week) ─────────────────────
    const DAY_LABELS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    const weekDayMap = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      const key = d.toISOString().split('T')[0];
      weekDayMap[key] = { jour: DAY_LABELS[d.getDay()], production: 0, objectif: 1000 };
    }
    productionsWeek.forEach(p => {
      if (weekDayMap[p.date]) weekDayMap[p.date].production += parseFloat(p.total || 0);
    });
    const productionWeekData = Object.values(weekDayMap);

    // ── Production by week (current month) ───────────────────
    const weeklyMap = {};
    productionsMonth.forEach(p => {
      const d = new Date(p.date);
      const weekNum = Math.ceil(d.getDate() / 7);
      const key = `S${weekNum}`;
      if (!weeklyMap[key]) weeklyMap[key] = { jour: key, production: 0, objectif: 10500 };
      weeklyMap[key].production += parseFloat(p.total || 0);
    });
    const productionMonthData = Object.values(weeklyMap).sort((a, b) => a.jour.localeCompare(b.jour));

    // ── Expenses by category (donut chart) ───────────────────
    const expenseByCatMap = {};
    financialMonth.filter(f => f.type === 'expense').forEach(f => {
      const cat = f.category || 'Autre';
      expenseByCatMap[cat] = (expenseByCatMap[cat] || 0) + parseFloat(f.amount || 0);
    });
    const expensesByCategoryData = Object.entries(expenseByCatMap)
      .map(([name, value]) => ({ name, value: Math.round(value) }))
      .sort((a, b) => b.value - a.value);

    // ── Sites status ─────────────────────────────────────────
    const sitesData = sites.map(s => ({
      id: s.id,
      name: s.name,
      location: s.location,
      status: s.is_active ? 'Opérationnel' : 'Arrêté',
      is_active: s.is_active,
    }));

    return {
      data: {
        // KPIs
        total_production: todayProduction,
        total_production_month: totalProductionMonth,
        equipment_count: equipment.length,
        active_equipment: activeEquipment,
        equipment_availability: equipment.length > 0 ? (activeEquipment / equipment.length) * 100 : 0,
        total_revenue: totalRevenue,
        total_expenses: totalExpenses,
        net_profit: netProfit,
        profitability,
        cost_per_ton: costPerTon,
        total_voyages_alimentes: totalVoyagesAlimentes,
        total_trous_fores: totalTrousFores,
        total_voyages_trous: totalVoyagesTrous,
        total_consumable_stock: totalConsumableStock,
        // Charts
        fuel_chart_data: fuelChartData,
        oil_chart_data: oilChartData,
        week_start: weekStartStr,
        week_end: today,
        monthly_profit_data: monthlyProfitData,
        production_week_data: productionWeekData,
        production_month_data: productionMonthData,
        expenses_by_category: expensesByCategoryData,
        // Tables
        sites: sitesData,
      },
      error: null
    };
  },

  // ============================================================
  // OBJECTIFS
  // ============================================================

  async getObjectives(site = 'all') {
    const { data, error } = await supabase
      .from('objectives')
      .select('*')
      .eq('active', true)
      .or(`site.eq.${site},site.eq.all`);
    return { data, error };
  },

  async upsertObjective(objective) {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('objectives')
      .upsert([{ ...objective, created_by: user?.id }], {
        onConflict: 'dimension,site,period_type'
      })
      .select()
      .maybeSingle();
    return { data, error };
  },

  // ============================================================
  // RAPPORTS
  // ============================================================

  async getReports() {
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false });
    return { data, error };
  },

  async createReport(report) {
    const { data, error } = await supabase
      .from('reports')
      .insert([{ ...report }])
      .select()
      .maybeSingle();
    return { data, error };
  },

  async deleteReport(id) {
    const { error } = await supabase.from('reports').delete().eq('id', id);
    return { error };
  },

  _applyDateRange(query, startDate = null, endDate = null, column = 'transaction_date') {
    if (!query) return query;
    if (startDate && endDate) return query.gte(column, startDate).lte(column, endDate);
    if (startDate) return query.gte(column, startDate);
    if (endDate) return query.lte(column, endDate);
    return query;
  },

  async getFuelChartData(startDate = null, endDate = null) {
    let q = supabase
      .from('fuel_transactions')
      .select('quantity, transaction_date, equipment:equipment_id(name)')
      .eq('transaction_type', 'exit')
      .not('equipment_id', 'is', null);
    q = this._applyDateRange(q, startDate, endDate, 'transaction_date');
    const { data, error } = await q;
    if (error) return { data: [], error };
    const map = {};
    (data || []).forEach(f => {
      const name = f.equipment?.name;
      if (!name) return;
      map[name] = (map[name] || 0) + parseFloat(f.quantity || 0);
    });
    const sorted = Object.entries(map)
      .map(([engin, consommation]) => ({ engin, consommation: Math.round(consommation) }))
      .sort((a, b) => b.consommation - a.consommation);
    return { data: sorted, error: null };
  },

  async getOilChartData(startDate = null, endDate = null) {
    let q = supabase
      .from('oil_transactions')
      .select('quantity, transaction_date, equipment:equipment_id(name)')
      .eq('transaction_type', 'exit')
      .not('equipment_id', 'is', null);
    q = this._applyDateRange(q, startDate, endDate, 'transaction_date');
    const { data, error } = await q;
    if (error) return { data: [], error };
    const map = {};
    (data || []).forEach(o => {
      const name = o.equipment?.name;
      if (!name) return;
      map[name] = (map[name] || 0) + parseFloat(o.quantity || 0);
    });
    const sorted = Object.entries(map)
      .map(([engin, consommation]) => ({ engin, consommation: Math.round(consommation) }))
      .sort((a, b) => b.consommation - a.consommation);
    return { data: sorted, error: null };
  },

  // ============================================================
  // GESTION DE L'HUILE
  // ============================================================

  async getOilTransactions() {
    const { data, error } = await supabase
      .from('oil_transactions')
      .select(`
        *,
        equipment:equipment_id (id, name, type)
      `)
      .order('transaction_date', { ascending: false })
      .limit(200);
    // Normalise les noms de colonnes pour le front-end
    const normalized = (data || []).map(t => ({
      ...t,
      date: t.transaction_date,
      type: t.transaction_type,
    }));
    return { data: normalized, error };
  },

  async addOilTransaction(transaction) {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('oil_transactions')
      .insert([{
        transaction_date: transaction.date,
        equipment_id: transaction.equipment_id || null,
        transaction_type: transaction.type,
        quantity: parseFloat(transaction.quantity),
        oil_type: transaction.oil_type,
        supplier: transaction.supplier || null,
        operator_name: transaction.operator_name || null,
        notes: transaction.notes || null,
        operator_id: user?.id || null,
      }])
      .select('id, transaction_date, transaction_type, quantity, equipment_id')
      .maybeSingle();
    if (data) {
      data.date = data.transaction_date;
      data.type = data.transaction_type;
    }
    return { data, error };
  },

  async deleteOilTransaction(id) {
    const { error } = await supabase
      .from('oil_transactions')
      .delete()
      .eq('id', id);
    return { error };
  },

  async getCostEvolutionData() {
    const now = new Date();
    const sixAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('financial_transactions')
      .select('amount, type, transaction_date')
      .gte('transaction_date', sixAgo);
    if (error) return { data: [], error };
    const months = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('fr-FR', { month: 'short' });
      months[key] = { mois: label.charAt(0).toUpperCase() + label.slice(1), c: 0, m: 0 };
    }
    (data || []).forEach(t => {
      const key = t.transaction_date.substring(0, 7);
      if (!months[key]) return;
      if (t.type === 'expense') months[key].c += parseFloat(t.amount);
      else months[key].m += parseFloat(t.amount);
    });
    return { data: Object.values(months), error: null };
  },

  // ============================================================
  // PLANIFICATION DES MAINTENANCES PRÉVENTIVES
  // ============================================================

  async getMaintenanceSchedules() {
    const { data, error } = await supabase
      .from('maintenance_schedules')
      .select('*, equipment:equipment_id(id, name, type)')
      .order('next_due_date', { ascending: true });
    return { data, error };
  },

  async addMaintenanceSchedule(entry) {
    const payload = {
      equipment_id:             entry.equipment_id,
      task_name:                entry.task_name,
      description:              entry.description || null,
      frequency_days:           parseInt(entry.frequency_days),
      frequency_hours:          entry.frequency_hours ? parseFloat(entry.frequency_hours) : null,
      last_done_date:           entry.last_done_date || null,
      priority:                 entry.priority || 'medium',
      status:                   'active',
      estimated_cost:           entry.estimated_cost ? parseFloat(entry.estimated_cost) : null,
      estimated_duration_hours: entry.estimated_duration_hours ? parseFloat(entry.estimated_duration_hours) : null,
    };
    // next_due_date calculé par le trigger SQL
    const { data, error } = await supabase.from('maintenance_schedules').insert([payload]).select().maybeSingle();
    return { data, error };
  },

  async updateMaintenanceSchedule(id, entry) {
    const payload = {
      equipment_id:             entry.equipment_id,
      task_name:                entry.task_name,
      description:              entry.description || null,
      frequency_days:           parseInt(entry.frequency_days),
      frequency_hours:          entry.frequency_hours ? parseFloat(entry.frequency_hours) : null,
      last_done_date:           entry.last_done_date || null,
      priority:                 entry.priority || 'medium',
      status:                   entry.status || 'active',
      estimated_cost:           entry.estimated_cost ? parseFloat(entry.estimated_cost) : null,
      estimated_duration_hours: entry.estimated_duration_hours ? parseFloat(entry.estimated_duration_hours) : null,
    };
    const { data, error } = await supabase.from('maintenance_schedules').update(payload).eq('id', id).select().maybeSingle();
    return { data, error };
  },

  async deleteMaintenanceSchedule(id) {
    const { error } = await supabase.from('maintenance_schedules').delete().eq('id', id);
    return { error };
  },

  // Marquer une maintenance comme effectuée → met à jour last_done_date + crée historique
  async markMaintenanceDone(scheduleId, entry) {
    // 1. Créer l'entrée dans l'historique
    const { data: hist, error: histError } = await supabase
      .from('maintenance_history')
      .insert([{
        equipment_id:   entry.equipment_id,
        schedule_id:    scheduleId,
        task_name:      entry.task_name,
        performed_date: entry.performed_date || new Date().toISOString().split('T')[0],
        performed_by:   entry.performed_by || null,
        cost:           entry.cost ? parseFloat(entry.cost) : null,
        duration_hours: entry.duration_hours ? parseFloat(entry.duration_hours) : null,
        notes:          entry.notes || null,
        status:         'completed',
      }])
      .select().maybeSingle();
    if (histError) return { error: histError };

    // 2. Mettre à jour last_done_date (le trigger recalcule next_due_date)
    const { error: schedError } = await supabase
      .from('maintenance_schedules')
      .update({ last_done_date: entry.performed_date || new Date().toISOString().split('T')[0] })
      .eq('id', scheduleId);
    return { data: hist, error: schedError };
  },

  async getMaintenanceHistory() {
    const { data, error } = await supabase
      .from('maintenance_history')
      .select('*, equipment:equipment_id(id, name, type), schedule:schedule_id(task_name, frequency_days)')
      .order('performed_date', { ascending: false })
      .limit(500);
    return { data, error };
  },

  // Alertes : maintenances en retard ou à venir dans 7 jours
  async getMaintenanceAlerts() {
    const today = new Date().toISOString().split('T')[0];
    const in7 = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('maintenance_schedules')
      .select('*, equipment:equipment_id(id, name, type)')
      .eq('status', 'active')
      .or(`next_due_date.lte.${in7},next_due_date.is.null`);
    return { data: (data || []).map(s => ({
      ...s,
      isOverdue: s.next_due_date && s.next_due_date < today,
      isDueSoon: s.next_due_date && s.next_due_date >= today && s.next_due_date <= in7,
      daysUntilDue: s.next_due_date
        ? Math.ceil((new Date(s.next_due_date) - new Date(today)) / 86400000)
        : null,
    })), error };
  },

  // ============================================================
  // MAGASIN — PIÈCES DE RECHANGE
  // ============================================================

  async getSpareParts() {
    const { data, error } = await supabase
      .from('spare_parts')
      .select('*, stock:spare_parts_stock(quantity, safety_stock, location)')
      .order('name');
    return { data: (data || []).map(p => ({
      ...p,
      quantity:     p.stock?.quantity ?? 0,
      safety_stock: p.stock?.safety_stock ?? 0,
      location:     p.stock?.location ?? '',
      isCritical:   (p.stock?.quantity ?? 0) <= (p.stock?.safety_stock ?? 0),
    })), error };
  },

  async addSparePart(entry) {
    const { data: part, error } = await supabase
      .from('spare_parts')
      .insert([{
        reference:       entry.reference,
        name:            entry.name,
        category:        entry.category || null,
        unit:            entry.unit || 'unité',
        description:     entry.description || null,
        supplier:        entry.supplier || null,
        unit_price:      entry.unit_price ? parseFloat(entry.unit_price) : null,
        compatible_with: entry.compatible_with || [],
      }])
      .select().maybeSingle();
    if (error) return { error };
    // Créer la ligne stock
    await supabase.from('spare_parts_stock').insert([{
      spare_part_id: part.id,
      quantity:      0,
      safety_stock:  entry.safety_stock ? parseFloat(entry.safety_stock) : 0,
      location:      entry.location || null,
    }]);
    return { data: part, error: null };
  },

  async updateSparePart(id, entry) {
    const { error } = await supabase.from('spare_parts').update({
      reference:       entry.reference,
      name:            entry.name,
      category:        entry.category || null,
      unit:            entry.unit || 'unité',
      description:     entry.description || null,
      supplier:        entry.supplier || null,
      unit_price:      entry.unit_price ? parseFloat(entry.unit_price) : null,
    }).eq('id', id);
    // Mettre à jour le stock de sécurité
    await supabase.from('spare_parts_stock').update({
      safety_stock: entry.safety_stock ? parseFloat(entry.safety_stock) : 0,
      location:     entry.location || null,
    }).eq('spare_part_id', id);
    return { error };
  },

  async deleteSparePart(id) {
    const { error } = await supabase.from('spare_parts').delete().eq('id', id);
    return { error };
  },

  async getSparePartsMovements() {
    const { data, error } = await supabase
      .from('spare_parts_movements')
      .select('*, part:spare_part_id(name, reference, unit), equipment:equipment_id(name)')
      .order('movement_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(500);
    return { data, error };
  },

  async addSparePartMovement(entry) {
    const { error } = await supabase.from('spare_parts_movements').insert([{
      spare_part_id:  entry.spare_part_id,
      movement_type:  entry.movement_type,
      quantity:       parseFloat(entry.quantity),
      movement_date:  entry.movement_date || new Date().toISOString().split('T')[0],
      reason:         entry.reason || null,
      equipment_id:   entry.equipment_id || null,
      unit_price:     entry.unit_price ? parseFloat(entry.unit_price) : null,
      supplier:       entry.supplier || null,
      notes:          entry.notes || null,
    }]);
    return { error };
  },

  // ============================================================
  // STOCK CONSOMMABLES
  // ============================================================

  async getConsumableMovements() {
    const { data, error } = await supabase
      .from('consumable_movements')
      .select('*')
      .order('movement_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(1000);
    return { data, error };
  },

  async addConsumableMovement(entry) {
    const { data, error } = await supabase
      .from('consumable_movements')
      .insert([{
        movement_date: entry.movement_date || new Date().toISOString().split('T')[0],
        movement_type: entry.movement_type,
        category:      entry.category,
        quantity:      parseFloat(entry.quantity),
        unit:          entry.unit || 'tonne',
        notes:         entry.notes || null,
        operator_name: entry.operator_name || null,
      }])
      .select().maybeSingle();
    return { data, error };
  },

  // Stock net par catégorie : SUM(entries) - SUM(exits)
  async getConsumableStock() {
    const { data, error } = await supabase
      .from('consumable_movements')
      .select('movement_type, category, quantity, unit');
    if (error) return { data: [], error };

    const byCategory = {};
    (data || []).forEach(m => {
      if (!byCategory[m.category]) {
        byCategory[m.category] = { category: m.category, unit: m.unit || 'tonne', entries: 0, exits: 0 };
      }
      if (m.movement_type === 'entry') byCategory[m.category].entries += parseFloat(m.quantity || 0);
      if (m.movement_type === 'exit')  byCategory[m.category].exits  += parseFloat(m.quantity || 0);
    });

    const result = Object.values(byCategory).map(c => ({
      ...c,
      available: Math.max(0, c.entries - c.exits),
    }));

    return { data: result, error: null };
  },

  // Pièces en dessous du stock de sécurité
  async getCriticalStockAlerts() {
    const { data, error } = await supabase
      .from('spare_parts_stock')
      .select('*, part:spare_part_id(name, reference, category, unit)')
      .filter('quantity', 'lte', supabase.raw('safety_stock'));
    // Fallback JS si la requête SQL échoue
    if (error) {
      const { data: all } = await supabase
        .from('spare_parts_stock')
        .select('*, part:spare_part_id(name, reference, category, unit)');
      return { data: (all || []).filter(s => s.quantity <= s.safety_stock), error: null };
    }
    return { data, error };
  },
};
