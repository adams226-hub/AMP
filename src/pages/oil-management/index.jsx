import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
// Graphiques désactivés ici (déjà sur tableau de bord)
import AppLayout from "../../components/navigation/AppLayout";
import Icon from "../../components/AppIcon";
import Button from "../../components/ui/Button";
import { miningService } from "../../config/supabase";
import { useAuth } from "../../context/AuthContext";
import toast from "../../utils/toast";
import { default as hotToast } from "react-hot-toast";

const OIL_TYPES = [
  { value: 'huile_moteur',      label: 'Huile moteur 15W40' },
  { value: 'huile_hydraulique', label: 'Huile hydraulique' },
  { value: 'huile_transmission',label: 'Huile de transmission' },
  { value: 'huile_engrenage',   label: 'Huile engrenage' },
  { value: 'graisse',           label: 'Graisse' },
];

const EMPTY_FORM = {
  date: new Date().toISOString().split('T')[0],
  equipment_id: '',
  type: 'entry',
  quantity: '',
  supplier: '',
  operator_name: '',
  notes: '',
};

export default function OilManagement() {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [equipment, setEquipment]       = useState([]);
  const [loading, setLoading]           = useState(true);
  const [saving, setSaving]             = useState(false);
  const [showModal, setShowModal]       = useState(false);
  const [filterEq, setFilterEq]         = useState('all');
  const [filterType, setFilterType]     = useState('all');
  const [form, setForm]                 = useState(EMPTY_FORM);
  const [error, setError]               = useState(null);
  const { user } = useAuth();
  const userRole = user?.role;

  const loadOilData = async () => {
    setLoading(true);
    try {
      const { data, error } = await miningService.getOilTransactions();
      if (error) {
        toast.error(`Erreur chargement huile: ${error.message}`);
      } else {
        // Map data for UI
        const mappedData = data?.map(item => ({
          ...item,
          date: item.transaction_date,
          equipment: item.equipment?.name || item.equipment_id,
          operator: item.operator_name || 'N/A',
          site: item.site?.name || 'N/A',
          type: item.transaction_type,
        })) || [];
        setTransactions(mappedData);
      }
    } catch (error) {
      toast.error('Erreur de chargement des données huile');
    } finally {
      setLoading(false);
    }
  };

  const loadEquipment = async () => {
    try {
      const { data, error } = await miningService.getEquipment(userRole);
      if (error) throw error;
      setEquipment(data || []);
    } catch (error) {
      console.error('Erreur de chargement des équipements:', error);
      setEquipment([]);
    }
  };

  useEffect(() => {
    loadOilData();
    loadEquipment();
  }, []);

  const consumptionByEq = equipment
    .map(eq => {
      const exits = transactions.filter(t => t.equipment_id === eq.id && t.type === 'exit');
      const totalOut = exits.reduce((s, t) => s + +t.quantity, 0);
      return { ...eq, totalOut };
    })
    .filter(eq => eq.totalOut > 0);

  const filtered = transactions.filter(t => {
    if (filterEq !== 'all' && t.equipment_id !== filterEq) return false;
    if (filterType !== 'all' && t.type !== filterType) return false;
    return true;
  });

  const totalIn  = transactions.filter(t => t.type === 'entry').reduce((s, t) => s + +t.quantity, 0);
  const totalOut = transactions.filter(t => t.type === 'exit').reduce((s, t) => s + +t.quantity, 0);
  const stock    = Math.max(0, totalIn - totalOut);

  async function handleSave() {
    if (!form.date || !form.quantity || +form.quantity <= 0) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }
    if (form.type === 'exit') {
      if (!form.equipment_id) {
        toast.error('Veuillez sélectionner un équipement pour la sortie');
        return;
      }
      if (+form.quantity > stock) {
        toast.error(`Stock insuffisant. Disponible : ${stock.toFixed(1)} L`);
        return;
      }
    }

    const loadingId = hotToast.loading('Enregistrement...', { position: 'top-right' });
    setSaving(true);
    try {
      const payload = {
        ...form,
        equipment_id: form.type === 'entry' ? null : form.equipment_id,
      };
      const { error } = await miningService.addOilTransaction(payload);
      toast.dismiss(loadingId);
      if (error) {
        toast.error(`Erreur: ${error.message}`);
      } else {
        toast.success(`Transaction enregistrée: ${form.quantity}L`);
        setShowModal(false);
        setForm(EMPTY_FORM);
        loadOilData();
      }
    } catch (err) {
      toast.dismiss(loadingId);
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  }

  const eqName   = id => equipment.find(e => e.id === id)?.name || '—';

  // ── Rendu ──────────────────────────────────────────────────

  if (loading) {
    return (
      <AppLayout userRole={user?.role} userName={user?.full_name} userSite="African Mining Partenair SA">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor: 'var(--color-primary)' }} />
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout userRole={user?.role} userName={user?.full_name} userSite="African Mining Partenair SA">
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <Icon name="AlertCircle" size={40} color="var(--color-error)" />
          <p className="text-lg font-semibold" style={{ color: 'var(--color-error)' }}>{error}</p>
          <Button variant="outline" iconName="RefreshCw" iconPosition="left" onClick={loadOilData}>Réessayer</Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout userRole={user?.role} userName={user?.full_name} userSite="African Mining Partenair SA">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>Gestion de Stock Huile</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-muted-foreground)' }}>Suivi des entrées et sorties d'huile par équipement</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="default" iconName="Plus" iconPosition="left" onClick={() => setShowModal(true)}>
            Nouvelle Transaction
          </Button>
          <Button variant="outline" iconName="RefreshCw" iconPosition="left" onClick={loadOilData}>Actualiser</Button>
          <Button variant="outline" iconName="ArrowLeft" iconPosition="left" onClick={() => navigate('/')}>Retour</Button>
        </div>
      </div>

      {/* ── Avertissement si aucun équipement (sorties uniquement) ── */}
      {equipment.length === 0 && (
        <div className="mb-6 p-4 rounded-xl border flex items-center gap-4"
          style={{ background: 'rgba(245,158,11,0.08)', borderColor: 'var(--color-warning)' }}>
          <Icon name="AlertTriangle" size={24} color="var(--color-warning)" />
          <div className="flex-1">
            <p className="font-semibold" style={{ color: 'var(--color-warning)' }}>Aucun équipement configuré</p>
            <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
              Les entrées de stock sont toujours possibles. Ajoutez des équipements pour enregistrer des sorties d'huile.
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
          { label: 'Total Entrées',      value: `${totalIn.toFixed(1)} L`,  icon: 'TrendingUp',   color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
          { label: 'Total Sorties',      value: `${totalOut.toFixed(1)} L`, icon: 'TrendingDown', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
          { label: 'Stock Global',       value: `${stock.toFixed(1)} L`,    icon: 'Package',      color: '#3182CE', bg: 'rgba(49,130,206,0.12)' },
          { label: 'Équipements consommateurs', value: consumptionByEq.length, icon: 'Wrench', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
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
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b text-sm" style={{ borderColor: 'var(--color-border)', color: 'var(--color-muted-foreground)' }}>
                  <th className="text-left p-4">Équipement</th>
                  <th className="text-left p-4">Type</th>
                  <th className="text-left p-4">Consommé</th>
                </tr>
              </thead>
              <tbody>
                {consumptionByEq.map(eq => (
                  <tr key={eq.id} className="border-b" style={{ borderColor: 'var(--color-border)' }}>
                    <td className="p-4 font-medium" style={{ color: 'var(--color-foreground)' }}>{eq.name}</td>
                    <td className="p-4 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>{eq.type || '—'}</td>
                    <td className="p-4 font-bold" style={{ color: 'var(--color-error)' }}>{eq.totalOut.toFixed(1)} L</td>
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
            <select value={filterEq} onChange={e => setFilterEq(e.target.value)} className="p-2 rounded border text-sm"
              style={{ borderColor: 'var(--color-border)', background: 'var(--color-background)', color: 'var(--color-foreground)' }}>
              <option value="all">Tous les équipements</option>
              {equipment.map(eq => <option key={eq.id} value={eq.id}>{eq.name}</option>)}
            </select>
            <select value={filterType} onChange={e => setFilterType(e.target.value)} className="p-2 rounded border text-sm"
              style={{ borderColor: 'var(--color-border)', background: 'var(--color-background)', color: 'var(--color-foreground)' }}>
              <option value="all">Entrées & Sorties</option>
              <option value="entry">Entrées</option>
              <option value="exit">Sorties</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b text-sm" style={{ borderColor: 'var(--color-border)', color: 'var(--color-muted-foreground)' }}>
                <th className="text-left p-4">Date</th>
                <th className="text-left p-4">Équipement</th>
                <th className="text-left p-4">Type</th>
                <th className="text-left p-4">Quantité</th>
                <th className="text-left p-4">Opérateur</th>
                <th className="text-left p-4">Notes</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center" style={{ color: 'var(--color-muted-foreground)' }}>
                    Aucune transaction enregistrée
                  </td>
                </tr>
              ) : filtered.map(tx => (
                <tr key={tx.id} className="border-b" style={{ borderColor: 'var(--color-border)' }}>
                  <td className="p-4 text-sm" style={{ color: 'var(--color-foreground)' }}>{tx.date || tx.transaction_date}</td>
                  <td className="p-4 font-medium" style={{ color: 'var(--color-foreground)' }}>{tx.equipment?.name || eqName(tx.equipment_id)}</td>
                  <td className="p-4">
                    <span className="px-2 py-1 rounded-full text-xs font-medium" style={{
                      background: tx.type === 'entry' ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
                      color:      tx.type === 'entry' ? 'var(--color-success)'  : 'var(--color-error)',
                    }}>
                      {tx.type === 'entry' ? 'Entrée' : 'Sortie'}
                    </span>
                  </td>
                  <td className="p-4 font-bold" style={{ color: tx.type === 'entry' ? 'var(--color-success)' : 'var(--color-error)' }}>
                    {tx.type === 'entry' ? '+' : '-'}{(+tx.quantity).toFixed(1)} L
                  </td>
                  <td className="p-4 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>{tx.operator_name || '—'}</td>
                  <td className="p-4 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>{tx.notes || '—'}</td>
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
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-foreground)' }}>Nouvelle Transaction Huile</h3>
            <div className="space-y-4">

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-foreground)' }}>Date *</label>
                  <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                    className="w-full p-2 rounded border"
                    style={{ borderColor: 'var(--color-border)', background: 'var(--color-background)', color: 'var(--color-foreground)' }} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-foreground)' }}>Type *</label>
                  <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                    className="w-full p-2 rounded border"
                    style={{ borderColor: 'var(--color-border)', background: 'var(--color-background)', color: 'var(--color-foreground)' }}>
                    <option value="entry">Entrée</option>
                    <option value="exit">Sortie</option>
                  </select>
                </div>
              </div>

              {form.type === 'exit' && (
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-foreground)' }}>Équipement *</label>
                  <select value={form.equipment_id} onChange={e => setForm(f => ({ ...f, equipment_id: e.target.value }))}
                    className="w-full p-2 rounded border"
                    style={{ borderColor: 'var(--color-border)', background: 'var(--color-background)', color: 'var(--color-foreground)' }}>
                    <option value="">Sélectionner un équipement</option>
                    {equipment.map(eq => (
                      <option key={eq.id} value={eq.id}>{eq.name}</option>
                    ))}
                  </select>
                  <p className="text-xs mt-1" style={{ color: 'var(--color-muted-foreground)' }}>
                    Stock disponible : <strong style={{ color: 'var(--color-success)' }}>{stock.toFixed(1)} L</strong>
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-foreground)' }}>Quantité (L) *</label>
                <input type="number" step="0.1" min="0" value={form.quantity}
                  onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}
                  className="w-full p-2 rounded border" placeholder="0.0"
                  style={{ borderColor: 'var(--color-border)', background: 'var(--color-background)', color: 'var(--color-foreground)' }} />
              </div>

              {form.type === 'entry' && (
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-foreground)' }}>Fournisseur</label>
                  <input type="text" value={form.supplier} onChange={e => setForm(f => ({ ...f, supplier: e.target.value }))}
                    className="w-full p-2 rounded border" placeholder="Ex : Total Energies"
                    style={{ borderColor: 'var(--color-border)', background: 'var(--color-background)', color: 'var(--color-foreground)' }} />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-foreground)' }}>Opérateur</label>
                <input type="text" value={form.operator_name} onChange={e => setForm(f => ({ ...f, operator_name: e.target.value }))}
                  className="w-full p-2 rounded border" placeholder="Nom de l'opérateur"
                  style={{ borderColor: 'var(--color-border)', background: 'var(--color-background)', color: 'var(--color-foreground)' }} />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-foreground)' }}>Notes</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  className="w-full p-2 rounded border" rows="2" placeholder="Notes optionnelles..."
                  style={{ borderColor: 'var(--color-border)', background: 'var(--color-background)', color: 'var(--color-foreground)' }} />
              </div>
            </div>

            <div className="flex gap-3 mt-6 justify-end">
              <Button variant="outline" onClick={() => { setShowModal(false); setForm(EMPTY_FORM); }}>Annuler</Button>
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
