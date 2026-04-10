import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "../../components/navigation/AppLayout";
import Icon from "../../components/AppIcon";
import Button from "../../components/ui/Button";
import { miningService } from "../../config/supabase";
import { useAuth } from "../../context/AuthContext";
import toast from "../../utils/toast";
import { default as hotToast } from "react-hot-toast";

const FUEL_TYPES = [
  { value: 'gasoil',  label: 'Gasoil' },
  { value: 'essence', label: 'Essence' },
 
];

const EMPTY_FORM = {
  date:           new Date().toISOString().split('T')[0],
  equipment_id:   '',
  type:           'entry',
  fuel_type:      'gasoil',
  quantity:       '',
  cost_per_liter: '',
  supplier:       '',
  operator_name:  '',
  notes:          '',
};

const inputStyle = {
  borderColor: 'var(--color-border)',
  background:  'var(--color-input)',
  color:       'var(--color-foreground)',
};

export default function FuelManagement() {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [equipment, setEquipment]       = useState([]);
  const [loading, setLoading]           = useState(true);
  const [saving, setSaving]             = useState(false);
  const [showModal, setShowModal]       = useState(false);
  const [editItem, setEditItem]         = useState(null);
  const [filterType, setFilterType]     = useState('all');
  const [filterEq, setFilterEq]         = useState('all');
  const [form, setForm]                 = useState(EMPTY_FORM);
  const { user } = useAuth();

  /* ── Chargement ── */
  const loadData = async () => {
    setLoading(true);
    try {
      const [fuelRes, eqRes] = await Promise.all([
        miningService.getFuelTransactions(),
        miningService.getEquipment(user?.role),
      ]);
      if (fuelRes.error) toast.error(`Erreur: ${fuelRes.error.message}`);
      else {
        setTransactions((fuelRes.data || []).map(t => ({
          ...t,
          date: t.transaction_date,
          type: t.transaction_type || 'exit',
        })));
      }
      setEquipment(eqRes.data || []);
    } catch {
      toast.error('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  /* ── Calculs globaux ── */
  const totalIn  = transactions.filter(t => t.type === 'entry').reduce((s, t) => s + +t.quantity, 0);
  const totalOut = transactions.filter(t => t.type === 'exit').reduce((s, t) => s + +t.quantity, 0);
  const stock    = Math.max(0, totalIn - totalOut);

  const consumptionByEq = equipment
    .map(eq => {
      const exits   = transactions.filter(t => t.equipment_id === eq.id && t.type === 'exit');
      const totalOut = exits.reduce((s, t) => s + +t.quantity, 0);
      const totalCost = exits.reduce((s, t) => s + +(t.total_cost || 0), 0);
      return { ...eq, totalOut, totalCost };
    })
    .filter(eq => eq.totalOut > 0)
    .sort((a, b) => b.totalOut - a.totalOut);

  const eqName = id => equipment.find(e => e.id === id)?.name || '—';

  const filtered = transactions.filter(t => {
    if (filterType !== 'all' && t.type !== filterType) return false;
    if (filterEq !== 'all' && t.equipment_id !== filterEq) return false;
    return true;
  });

  /* ── Ouverture modal ── */
  const openNew = () => {
    setForm(EMPTY_FORM);
    setEditItem(null);
    setShowModal(true);
  };

  const openEdit = item => {
    setForm({
      date:           item.date || '',
      equipment_id:   item.equipment_id || '',
      type:           item.type || 'exit',
      fuel_type:      item.fuel_type || 'gasoil',
      quantity:       item.quantity || '',
      cost_per_liter: item.cost_per_liter || '',
      supplier:       item.supplier || '',
      operator_name:  item.operator_name || '',
      notes:          item.notes || '',
    });
    setEditItem(item);
    setShowModal(true);
  };

  /* ── Sauvegarde ── */
  const handleSave = async () => {
    if (!form.date || !form.quantity || +form.quantity <= 0) {
      toast.error('Date et quantité obligatoires');
      return;
    }
    if (form.type === 'exit') {
      if (!form.equipment_id) {
        toast.error('Sélectionnez un équipement pour la sortie');
        return;
      }
      if (+form.quantity > stock) {
        toast.error(`Stock insuffisant. Disponible : ${stock.toFixed(1)} L`);
        return;
      }
    }
    if (form.type === 'entry' && (!form.cost_per_liter || +form.cost_per_liter <= 0)) {
      toast.error('Le prix par litre est obligatoire pour une entrée');
      return;
    }

    const loadId = hotToast.loading('Enregistrement...', { position: 'top-right' });
    setSaving(true);
    try {
      const { error } = editItem
        ? await miningService.updateFuelTransaction(editItem.id, form)
        : await miningService.addFuelTransaction(form);
      toast.dismiss(loadId);
      if (error) { toast.error(`Erreur: ${error.message}`); return; }
      toast.success(editItem ? 'Transaction mise à jour' : `Transaction enregistrée: ${form.quantity} L`);
      setShowModal(false);
      setForm(EMPTY_FORM);
      setEditItem(null);
      loadData();
    } catch {
      toast.dismiss(loadId);
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  /* ── Suppression ── */
  const handleDelete = async item => {
    if (!window.confirm(`Supprimer la transaction du ${item.date} (${item.quantity} L) ?`)) return;
    const loadId = hotToast.loading('Suppression...', { position: 'top-right' });
    try {
      const { error } = await miningService.deleteFuelTransaction(item.id);
      toast.dismiss(loadId);
      if (error) { toast.error(`Erreur: ${error.message}`); return; }
      toast.success('Transaction supprimée');
      loadData();
    } catch {
      toast.dismiss(loadId);
      toast.error('Erreur lors de la suppression');
    }
  };

  /* ── Chargement ── */
  if (loading) return (
    <AppLayout userRole={user?.role} userName={user?.full_name} userSite="African Mining Partenair SARL">
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor: 'var(--color-primary)' }} />
      </div>
    </AppLayout>
  );

  return (
    <AppLayout userRole={user?.role} userName={user?.full_name} userSite="African Mining Partenair SARL">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>Gestion de Stock Carburant</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-muted-foreground)' }}>Suivi des entrées et sorties de carburant par équipement</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="default" iconName="Plus" iconPosition="left" onClick={openNew}>
            Nouvelle Transaction
          </Button>
          <Button variant="outline" iconName="RefreshCw" iconPosition="left" onClick={loadData}>Actualiser</Button>
          <Button variant="outline" iconName="ArrowLeft" iconPosition="left" onClick={() => navigate('/')}>Retour</Button>
        </div>
      </div>

      {/* ── Avertissement ── */}
      {equipment.length === 0 && (
        <div className="mb-6 p-4 rounded-xl border flex items-center gap-4"
          style={{ background: 'rgba(245,158,11,0.08)', borderColor: 'var(--color-warning)' }}>
          <Icon name="AlertTriangle" size={24} color="var(--color-warning)" />
          <div className="flex-1">
            <p className="font-semibold" style={{ color: 'var(--color-warning)' }}>Aucun équipement configuré</p>
            <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
              Les entrées de stock sont toujours possibles. Ajoutez des équipements pour enregistrer des sorties.
            </p>
          </div>
          <Button variant="outline" iconName="Wrench" iconPosition="left" onClick={() => navigate('/equipment-management')}>
            Équipements
          </Button>
        </div>
      )}

      {/* ── KPIs ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Entrées',          value: `${totalIn.toFixed(1)} L`,  icon: 'TrendingUp',   color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
          { label: 'Total Sorties',          value: `${totalOut.toFixed(1)} L`, icon: 'TrendingDown', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
          { label: 'Stock Global',           value: `${stock.toFixed(1)} L`,    icon: 'Package',      color: '#3182CE', bg: 'rgba(49,130,206,0.12)' },
          { label: 'Équipements consommateurs', value: consumptionByEq.length,  icon: 'Wrench',       color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
        ].map((k, i) => (
          <div key={i} className="p-4 rounded-xl border" style={{ background: 'var(--color-card)' }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: k.bg }}>
                <Icon name={k.icon} size={20} color={k.color} />
              </div>
              <div>
                <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>{k.label}</p>
                <p className="text-lg font-bold" style={{ color: 'var(--color-foreground)' }}>{k.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Consommation par équipement ── */}
      {consumptionByEq.length > 0 && (
        <div className="rounded-xl border mb-6" style={{ background: 'var(--color-card)' }}>
          <div className="p-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
            <h2 className="text-lg font-semibold" style={{ color: 'var(--color-foreground)' }}>Consommation par Équipement</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px]">
              <thead>
                <tr className="border-b text-sm" style={{ borderColor: 'var(--color-border)', color: 'var(--color-muted-foreground)' }}>
                  <th className="text-left p-4">Équipement</th>
                  <th className="text-left p-4">Type</th>
                  <th className="text-left p-4">Consommé</th>
                  <th className="text-left p-4">Coût total</th>
                </tr>
              </thead>
              <tbody>
                {consumptionByEq.map(eq => (
                  <tr key={eq.id} className="border-b" style={{ borderColor: 'var(--color-border)' }}>
                    <td className="p-4 font-medium" style={{ color: 'var(--color-foreground)' }}>{eq.name}</td>
                    <td className="p-4 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>{eq.type || '—'}</td>
                    <td className="p-4 font-bold" style={{ color: 'var(--color-error)' }}>{eq.totalOut.toFixed(1)} L</td>
                    <td className="p-4 font-medium" style={{ color: 'var(--color-foreground)' }}>
                      {eq.totalCost > 0 ? `${eq.totalCost.toLocaleString('fr-FR')} FCFA` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Historique ── */}
      <div className="rounded-xl border" style={{ background: 'var(--color-card)' }}>
        <div className="p-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3" style={{ borderColor: 'var(--color-border)' }}>
          <h2 className="text-lg font-semibold" style={{ color: 'var(--color-foreground)' }}>Historique des Transactions</h2>
          <div className="flex gap-2">
            <select value={filterType} onChange={e => setFilterType(e.target.value)} className="p-2 rounded border text-sm"
              style={{ borderColor: 'var(--color-border)', background: 'var(--color-background)', color: 'var(--color-foreground)' }}>
              <option value="all">Entrées &amp; Sorties</option>
              <option value="entry">Entrées</option>
              <option value="exit">Sorties</option>
            </select>
            <select value={filterEq} onChange={e => setFilterEq(e.target.value)} className="p-2 rounded border text-sm"
              style={{ borderColor: 'var(--color-border)', background: 'var(--color-background)', color: 'var(--color-foreground)' }}>
              <option value="all">Tous les équipements</option>
              {equipment.map(eq => <option key={eq.id} value={eq.id}>{eq.name}</option>)}
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[650px]">
            <thead>
              <tr className="border-b text-sm" style={{ borderColor: 'var(--color-border)', color: 'var(--color-muted-foreground)' }}>
                <th className="text-left p-4">Date</th>
                <th className="text-left p-4">Type</th>
                <th className="text-left p-4">Équipement</th>
                <th className="text-left p-4">Carburant</th>
                <th className="text-left p-4">Quantité</th>
                <th className="text-left p-4">Prix/L</th>
                <th className="text-left p-4">Coût total</th>
                <th className="text-left p-4">Opérateur</th>
                <th className="text-left p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center" style={{ color: 'var(--color-muted-foreground)' }}>
                    Aucune transaction enregistrée
                  </td>
                </tr>
              ) : filtered.map(tx => (
                <tr key={tx.id} className="border-b" style={{ borderColor: 'var(--color-border)' }}>
                  <td className="p-4 text-sm" style={{ color: 'var(--color-foreground)' }}>{tx.date}</td>
                  <td className="p-4">
                    <span className="px-2 py-1 rounded-full text-xs font-medium" style={{
                      background: tx.type === 'entry' ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
                      color:      tx.type === 'entry' ? 'var(--color-success)'  : 'var(--color-error)',
                    }}>
                      {tx.type === 'entry' ? 'Entrée' : 'Sortie'}
                    </span>
                  </td>
                  <td className="p-4 font-medium" style={{ color: 'var(--color-foreground)' }}>
                    {tx.equipment?.name || eqName(tx.equipment_id)}
                  </td>
                  <td className="p-4 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>{tx.fuel_type}</td>
                  <td className="p-4 font-bold" style={{ color: tx.type === 'entry' ? 'var(--color-success)' : 'var(--color-error)' }}>
                    {tx.type === 'entry' ? '+' : '-'}{(+tx.quantity).toFixed(1)} L
                  </td>
                  <td className="p-4 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
                    {tx.cost_per_liter ? `${(+tx.cost_per_liter).toLocaleString('fr-FR')} FCFA` : '—'}
                  </td>
                  <td className="p-4 text-sm" style={{ color: 'var(--color-foreground)' }}>
                    {tx.total_cost ? `${(+tx.total_cost).toLocaleString('fr-FR')} FCFA` : '—'}
                  </td>
                  <td className="p-4 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>{tx.operator_name || '—'}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(tx)} className="p-1.5 rounded hover:bg-gray-100" title="Modifier">
                        <Icon name="Edit" size={15} color="var(--color-primary)" />
                      </button>
                      <button onClick={() => handleDelete(tx)} className="p-1.5 rounded hover:bg-gray-100" title="Supprimer">
                        <Icon name="Trash2" size={15} color="var(--color-error)" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Modal ── */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" style={{ background: 'var(--color-card)' }}>
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-foreground)' }}>
              {editItem ? 'Modifier la Transaction' : 'Nouvelle Transaction Carburant'}
            </h3>

            <div className="space-y-4">
              {/* Date + Type */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-foreground)' }}>Date *</label>
                  <input type="date" value={form.date}
                    onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                    className="w-full p-2 rounded border" style={inputStyle} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-foreground)' }}>Type *</label>
                  <select value={form.type}
                    onChange={e => setForm(f => ({ ...f, type: e.target.value, equipment_id: '' }))}
                    className="w-full p-2 rounded border" style={inputStyle}>
                    <option value="entry">Entrée (stock reçu)</option>
                    <option value="exit">Sortie (consommation)</option>
                  </select>
                </div>
              </div>

              {/* Type de carburant */}
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-foreground)' }}>Type de carburant *</label>
                <select value={form.fuel_type}
                  onChange={e => setForm(f => ({ ...f, fuel_type: e.target.value }))}
                  className="w-full p-2 rounded border" style={inputStyle}>
                  {FUEL_TYPES.map(ft => <option key={ft.value} value={ft.value}>{ft.label}</option>)}
                </select>
              </div>

              {/* Équipement — seulement pour les sorties */}
              {form.type === 'exit' && (
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-foreground)' }}>Équipement *</label>
                  <select value={form.equipment_id}
                    onChange={e => setForm(f => ({ ...f, equipment_id: e.target.value }))}
                    className="w-full p-2 rounded border" style={inputStyle}>
                    <option value="">Sélectionner un équipement</option>
                    {equipment.map(eq => <option key={eq.id} value={eq.id}>{eq.name}</option>)}
                  </select>
                  <p className="text-xs mt-1" style={{ color: 'var(--color-muted-foreground)' }}>
                    Stock disponible : <strong style={{ color: 'var(--color-success)' }}>{stock.toFixed(1)} L</strong>
                  </p>
                </div>
              )}

              {/* Quantité */}
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-foreground)' }}>Quantité (L) *</label>
                <input type="number" step="0.1" min="0" value={form.quantity} placeholder="0.0"
                  onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}
                  className="w-full p-2 rounded border" style={inputStyle} />
              </div>

              {/* Prix/L — seulement pour les entrées */}
              {form.type === 'entry' && (
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-foreground)' }}>Prix par litre (FCFA) *</label>
                  <input type="number" step="0.01" min="0" value={form.cost_per_liter} placeholder="0.00"
                    onChange={e => setForm(f => ({ ...f, cost_per_liter: e.target.value }))}
                    className="w-full p-2 rounded border" style={inputStyle} />
                  {form.quantity && form.cost_per_liter && +form.quantity > 0 && +form.cost_per_liter > 0 && (
                    <p className="text-xs mt-1 font-semibold" style={{ color: 'var(--color-success)' }}>
                      Total : {(+form.quantity * +form.cost_per_liter).toLocaleString('fr-FR')} FCFA
                    </p>
                  )}
                </div>
              )}

              {/* Fournisseur — seulement pour les entrées */}
              {form.type === 'entry' && (
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-foreground)' }}>Fournisseur</label>
                  <input type="text" value={form.supplier} placeholder="Ex : Total Energies"
                    onChange={e => setForm(f => ({ ...f, supplier: e.target.value }))}
                    className="w-full p-2 rounded border" style={inputStyle} />
                </div>
              )}

              {/* Opérateur */}
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-foreground)' }}>Opérateur</label>
                <input type="text" value={form.operator_name} placeholder="Nom de l'opérateur"
                  onChange={e => setForm(f => ({ ...f, operator_name: e.target.value }))}
                  className="w-full p-2 rounded border" style={inputStyle} />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-foreground)' }}>Notes</label>
                <textarea value={form.notes} rows="2" placeholder="Notes optionnelles..."
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  className="w-full p-2 rounded border" style={inputStyle} />
              </div>
            </div>

            <div className="flex gap-3 mt-6 justify-end">
              <Button variant="outline" onClick={() => { setShowModal(false); setForm(EMPTY_FORM); setEditItem(null); }}>
                Annuler
              </Button>
              <Button variant="default" onClick={handleSave} disabled={saving}>
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
            </div>
          </div>
        </div>
      )}

    </AppLayout>
  );
}
