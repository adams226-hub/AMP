import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "../../components/navigation/AppLayout";
import Icon from "../../components/AppIcon";
import Button from "../../components/ui/Button";
import { miningService } from "../../config/supabase";
import { useAuth } from "../../context/AuthContext";
import { toastSuccess, toastError } from "../../utils/toast";

const CATEGORIES = [
  'Filtre', 'Huile / Lubrifiant', 'Courroie / Chaîne', 'Frein',
  'Électrique', 'Hydraulique', 'Pneumatique', 'Moteur', 'Transmission',
  'Carrosserie', 'Autre',
];

const UNITS = ['unité', 'litre', 'kg', 'mètre', 'boîte', 'paire', 'rouleau'];

const EMPTY_PART = {
  reference: '', name: '', category: '', category_custom: '', unit: 'unité',
  description: '', supplier: '', unit_price: '',
  safety_stock: '', location: '',
};

const EMPTY_MOVE = {
  spare_part_id: '', movement_type: 'entry', quantity: '',
  movement_date: new Date().toISOString().split('T')[0],
  reason: '', equipment_id: '', unit_price: '', supplier: '', notes: '',
};

const inp = { borderColor:'var(--color-border)', background:'var(--color-input)', color:'var(--color-foreground)' };

export default function SpareParts() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [parts, setParts]         = useState([]);
  const [movements, setMovements] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [tab, setTab]             = useState('stock'); // stock | movements
  const [search, setSearch]       = useState('');
  const [filterCat, setFilterCat] = useState('all');
  const [filterAlert, setFilterAlert] = useState(false);
  const [showPartModal, setShowPartModal]   = useState(false);
  const [showMoveModal, setShowMoveModal]   = useState(false);
  const [editPart, setEditPart]   = useState(null);
  const [partForm, setPartForm]   = useState(EMPTY_PART);
  const [moveForm, setMoveForm]   = useState(EMPTY_MOVE);
  const [saving, setSaving]       = useState(false);

  const load = async () => {
    setLoading(true);
    const [partsRes, movRes, eqRes] = await Promise.all([
      miningService.getSpareParts(),
      miningService.getSparePartsMovements(),
      miningService.getEquipment(user?.role),
    ]);
    setParts(partsRes.data || []);
    setMovements(movRes.data || []);
    setEquipment(eqRes.data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  // KPIs
  const totalParts   = parts.length;
  const critical     = parts.filter(p => p.isCritical);
  const totalValue   = parts.reduce((s, p) => s + (p.quantity * (p.unit_price || 0)), 0);
  const totalMovMonth = movements.filter(m => m.movement_date >= new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]).length;

  // Filtrage
  const filtered = parts
    .filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.reference.toLowerCase().includes(search.toLowerCase()))
    .filter(p => filterCat === 'all' || p.category === filterCat)
    .filter(p => !filterAlert || p.isCritical);

  const openNewPart = () => { setPartForm(EMPTY_PART); setEditPart(null); setShowPartModal(true); };
  const openEditPart = p => {
    const isCustomCat = p.category && !CATEGORIES.includes(p.category);
    setPartForm({
      reference: p.reference, name: p.name,
      category: isCustomCat ? 'Autre' : (p.category || ''),
      category_custom: isCustomCat ? p.category : '',
      unit: p.unit || 'unité', description: p.description || '',
      supplier: p.supplier || '', unit_price: p.unit_price || '',
      safety_stock: p.safety_stock || '', location: p.location || '',
    });
    setEditPart(p); setShowPartModal(true);
  };

  const openNewMove = (partId = '') => {
    setMoveForm({ ...EMPTY_MOVE, spare_part_id: partId, movement_date: new Date().toISOString().split('T')[0] });
    setShowMoveModal(true);
  };

  const handleSavePart = async () => {
    if (!partForm.reference || !partForm.name) { toastError('Référence et nom obligatoires'); return; }
    const finalCategory = partForm.category === 'Autre' ? (partForm.category_custom || 'Autre') : partForm.category;
    const payload = { ...partForm, category: finalCategory };
    setSaving(true);
    const fn = editPart
      ? miningService.updateSparePart(editPart.id, payload)
      : miningService.addSparePart(payload);
    const { error } = await fn;
    setSaving(false);
    if (error) { toastError(`Erreur: ${error.message}`); return; }
    toastSuccess(editPart ? 'Pièce mise à jour' : 'Pièce ajoutée');
    setShowPartModal(false); load();
  };

  const handleDeletePart = async id => {
    if (!confirm('Supprimer cette pièce ?')) return;
    const { error } = await miningService.deleteSparePart(id);
    if (error) { toastError(`Erreur: ${error.message}`); return; }
    toastSuccess('Pièce supprimée'); load();
  };

  const handleSaveMove = async () => {
    if (!moveForm.spare_part_id || !moveForm.quantity || +moveForm.quantity <= 0) {
      toastError('Pièce et quantité obligatoires'); return;
    }
    // Vérifier stock suffisant pour les sorties
    if (moveForm.movement_type === 'exit') {
      const part = parts.find(p => p.id === moveForm.spare_part_id);
      if (part && +moveForm.quantity > part.quantity) {
        toastError(`Stock insuffisant. Disponible : ${part.quantity} ${part.unit}`); return;
      }
    }
    setSaving(true);
    const { error } = await miningService.addSparePartMovement(moveForm);
    setSaving(false);
    if (error) { toastError(`Erreur: ${error.message}`); return; }
    toastSuccess('Mouvement enregistré');
    setShowMoveModal(false); load();
  };

  if (loading) return (
    <AppLayout userRole={user?.role} userName={user?.full_name} userSite="African Mining Partenair SA">
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor:'var(--color-primary)' }} />
      </div>
    </AppLayout>
  );

  return (
    <AppLayout userRole={user?.role} userName={user?.full_name} userSite="African Mining Partenair SA">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color:'var(--color-foreground)' }}>Magasin — Pièces de Rechange</h1>
          <p className="text-sm mt-1" style={{ color:'var(--color-muted-foreground)' }}>Gestion du stock et des mouvements de pièces</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="default" iconName="Plus" iconPosition="left" onClick={openNewPart}>Nouvelle Pièce</Button>
          <Button variant="outline" iconName="ArrowUpDown" iconPosition="left" onClick={() => openNewMove()}>Mouvement Stock</Button>
          <Button variant="outline" iconName="RefreshCw" iconPosition="left" onClick={load}>Actualiser</Button>
          <Button variant="outline" iconName="ArrowLeft" iconPosition="left" onClick={() => navigate('/')}>Retour</Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label:'Total Pièces',     value: totalParts,                             icon:'Package',    color:'#3182CE', bg:'rgba(49,130,206,0.12)' },
          { label:'Stock Critique',   value: critical.length,                        icon:'AlertTriangle', color:'#ef4444', bg:'rgba(239,68,68,0.12)' },
          { label:'Valeur Stock',     value: `${totalValue.toLocaleString('fr-FR')} FCFA`, icon:'DollarSign', color:'#22c55e', bg:'rgba(34,197,94,0.12)' },
          { label:'Mouvements/Mois',  value: totalMovMonth,                          icon:'ArrowUpDown', color:'#f59e0b', bg:'rgba(245,158,11,0.12)' },
        ].map((k,i) => (
          <div key={i} className="p-4 rounded-xl border" style={{ background:'var(--color-card)' }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background:k.bg }}>
                <Icon name={k.icon} size={20} color={k.color} />
              </div>
              <div className="min-w-0">
                <p className="text-xs truncate" style={{ color:'var(--color-muted-foreground)' }}>{k.label}</p>
                <p className="text-lg font-bold truncate" style={{ color:k.color }}>{k.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Alerte stock critique */}
      {critical.length > 0 && (
        <div className="mb-6 p-4 rounded-xl border" style={{ background:'rgba(239,68,68,0.06)', borderColor:'#ef4444' }}>
          <div className="flex items-center gap-2 mb-2">
            <Icon name="AlertTriangle" size={18} color="#ef4444" />
            <span className="font-semibold text-sm" style={{ color:'#ef4444' }}>{critical.length} pièce{critical.length > 1 ? 's' : ''} en dessous du stock de sécurité</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {critical.slice(0, 6).map(p => (
              <div key={p.id} className="flex items-center justify-between text-xs p-2 rounded" style={{ background:'rgba(239,68,68,0.08)' }}>
                <span className="font-medium" style={{ color:'var(--color-foreground)' }}>{p.name}</span>
                <span style={{ color:'#ef4444' }}>{p.quantity} / min. {p.safety_stock} {p.unit}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {[{ id:'stock', label:'Stock Pièces', icon:'Package' }, { id:'movements', label:'Mouvements', icon:'ArrowUpDown' }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
            style={{
              background: tab === t.id ? 'var(--color-primary)' : 'var(--color-card)',
              color: tab === t.id ? '#fff' : 'var(--color-muted-foreground)',
              border: '1px solid var(--color-border)',
            }}>
            <Icon name={t.icon} size={15} color={tab === t.id ? '#fff' : 'var(--color-muted-foreground)'} />
            {t.label}
          </button>
        ))}
      </div>

      {/* ── TAB STOCK ── */}
      {tab === 'stock' && (
        <div className="rounded-xl border" style={{ background:'var(--color-card)' }}>
          {/* Filtres */}
          <div className="p-4 border-b flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between" style={{ borderColor:'var(--color-border)' }}>
            <h2 className="text-base font-semibold" style={{ color:'var(--color-foreground)' }}>Catalogue ({filtered.length})</h2>
            <div className="flex flex-wrap gap-2">
              <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..." className="p-2 rounded border text-sm w-44" style={inp} />
              <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className="p-2 rounded border text-sm" style={inp}>
                <option value="all">Toutes catégories</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <button onClick={() => setFilterAlert(v => !v)}
                className="px-3 py-2 rounded border text-sm flex items-center gap-1"
                style={{ background: filterAlert ? 'rgba(239,68,68,0.12)' : 'var(--color-background)', color: filterAlert ? '#ef4444' : 'var(--color-muted-foreground)', borderColor: filterAlert ? '#ef4444' : 'var(--color-border)' }}>
                <Icon name="AlertTriangle" size={14} color={filterAlert ? '#ef4444' : 'var(--color-muted-foreground)'} />
                Critique seulement
              </button>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="p-16 text-center" style={{ color:'var(--color-muted-foreground)' }}>
              <Icon name="Package" size={48} color="var(--color-muted-foreground)" />
              <p className="mt-4 text-lg">Aucune pièce trouvée</p>
              <p className="text-sm mt-1">Ajoutez des pièces de rechange au catalogue</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[750px]">
                <thead>
                  <tr className="border-b text-sm" style={{ borderColor:'var(--color-border)', color:'var(--color-muted-foreground)' }}>
                    <th className="text-left p-4">Référence</th>
                    <th className="text-left p-4">Désignation</th>
                    <th className="text-left p-4">Catégorie</th>
                    <th className="text-left p-4">Stock</th>
                    <th className="text-left p-4">Stock Sécu.</th>
                    <th className="text-left p-4">Prix Unit.</th>
                    <th className="text-left p-4">Emplacement</th>
                    <th className="text-left p-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(p => (
                    <tr key={p.id} className="border-b" style={{ borderColor:'var(--color-border)', background: p.isCritical ? 'rgba(239,68,68,0.03)' : undefined }}>
                      <td className="p-4 text-sm font-mono" style={{ color:'var(--color-muted-foreground)' }}>{p.reference}</td>
                      <td className="p-4">
                        <div className="font-medium" style={{ color:'var(--color-foreground)' }}>{p.name}</div>
                        {p.description && <div className="text-xs truncate max-w-[180px]" style={{ color:'var(--color-muted-foreground)' }}>{p.description}</div>}
                      </td>
                      <td className="p-4 text-sm" style={{ color:'var(--color-muted-foreground)' }}>{p.category || '—'}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-lg" style={{ color: p.isCritical ? '#ef4444' : 'var(--color-foreground)' }}>{p.quantity}</span>
                          <span className="text-xs" style={{ color:'var(--color-muted-foreground)' }}>{p.unit}</span>
                          {p.isCritical && <Icon name="AlertTriangle" size={14} color="#ef4444" />}
                        </div>
                      </td>
                      <td className="p-4 text-sm" style={{ color:'var(--color-muted-foreground)' }}>
                        {p.safety_stock > 0 ? `${p.safety_stock} ${p.unit}` : '—'}
                      </td>
                      <td className="p-4 text-sm" style={{ color:'var(--color-foreground)' }}>
                        {p.unit_price ? `${parseFloat(p.unit_price).toLocaleString('fr-FR')} FCFA` : '—'}
                      </td>
                      <td className="p-4 text-sm" style={{ color:'var(--color-muted-foreground)' }}>{p.location || '—'}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-1">
                          <button onClick={() => openNewMove(p.id)} title="Mouvement stock" className="p-1.5 rounded hover:bg-blue-50">
                            <Icon name="ArrowUpDown" size={15} color="#3182CE" />
                          </button>
                          <button onClick={() => openEditPart(p)} title="Modifier" className="p-1.5 rounded hover:bg-gray-100">
                            <Icon name="Edit" size={15} color="var(--color-primary)" />
                          </button>
                          <button onClick={() => handleDeletePart(p.id)} title="Supprimer" className="p-1.5 rounded hover:bg-gray-100">
                            <Icon name="Trash2" size={15} color="var(--color-error)" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── TAB MOUVEMENTS ── */}
      {tab === 'movements' && (
        <div className="rounded-xl border" style={{ background:'var(--color-card)' }}>
          <div className="p-4 border-b flex items-center justify-between" style={{ borderColor:'var(--color-border)' }}>
            <h2 className="text-base font-semibold" style={{ color:'var(--color-foreground)' }}>Historique des Mouvements</h2>
            <Button variant="default" iconName="Plus" iconPosition="left" onClick={() => openNewMove()}>Nouveau Mouvement</Button>
          </div>
          {movements.length === 0 ? (
            <div className="p-16 text-center" style={{ color:'var(--color-muted-foreground)' }}>
              <Icon name="ArrowUpDown" size={48} color="var(--color-muted-foreground)" />
              <p className="mt-4">Aucun mouvement enregistré</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[650px]">
                <thead>
                  <tr className="border-b text-sm" style={{ borderColor:'var(--color-border)', color:'var(--color-muted-foreground)' }}>
                    <th className="text-left p-4">Date</th>
                    <th className="text-left p-4">Type</th>
                    <th className="text-left p-4">Pièce</th>
                    <th className="text-left p-4">Quantité</th>
                    <th className="text-left p-4">Motif</th>
                    <th className="text-left p-4">Équipement</th>
                    <th className="text-left p-4">Coût</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.map(m => (
                    <tr key={m.id} className="border-b" style={{ borderColor:'var(--color-border)' }}>
                      <td className="p-4 text-sm" style={{ color:'var(--color-foreground)' }}>{new Date(m.movement_date).toLocaleDateString('fr-FR')}</td>
                      <td className="p-4">
                        <span className="px-2 py-1 rounded-full text-xs font-medium" style={{
                          background: m.movement_type === 'entry' ? 'rgba(34,197,94,0.12)' : m.movement_type === 'exit' ? 'rgba(239,68,68,0.12)' : 'rgba(245,158,11,0.12)',
                          color:      m.movement_type === 'entry' ? '#22c55e'               : m.movement_type === 'exit' ? '#ef4444'               : '#f59e0b',
                        }}>
                          {m.movement_type === 'entry' ? 'Entrée' : m.movement_type === 'exit' ? 'Sortie' : 'Ajustement'}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="font-medium text-sm" style={{ color:'var(--color-foreground)' }}>{m.part?.name || '—'}</div>
                        <div className="text-xs" style={{ color:'var(--color-muted-foreground)' }}>{m.part?.reference}</div>
                      </td>
                      <td className="p-4 font-bold" style={{ color: m.movement_type === 'entry' ? '#22c55e' : m.movement_type === 'exit' ? '#ef4444' : '#f59e0b' }}>
                        {m.movement_type === 'entry' ? '+' : m.movement_type === 'exit' ? '-' : ''}{m.quantity} {m.part?.unit || ''}
                      </td>
                      <td className="p-4 text-sm" style={{ color:'var(--color-muted-foreground)' }}>{m.reason || '—'}</td>
                      <td className="p-4 text-sm" style={{ color:'var(--color-muted-foreground)' }}>{m.equipment?.name || '—'}</td>
                      <td className="p-4 text-sm" style={{ color:'var(--color-foreground)' }}>
                        {m.unit_price ? `${(m.quantity * m.unit_price).toLocaleString('fr-FR')} FCFA` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── MODAL PIÈCE ── */}
      {showPartModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" style={{ background:'var(--color-card)' }}>
            <h3 className="text-lg font-semibold mb-4" style={{ color:'var(--color-foreground)' }}>
              {editPart ? 'Modifier la Pièce' : 'Nouvelle Pièce de Rechange'}
            </h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color:'var(--color-foreground)' }}>Référence *</label>
                  <input type="text" value={partForm.reference} placeholder="Ex: FIL-001" onChange={e => setPartForm(f => ({...f, reference: e.target.value}))} className="w-full p-2 rounded border" style={inp} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color:'var(--color-foreground)' }}>Unité</label>
                  <select value={partForm.unit} onChange={e => setPartForm(f => ({...f, unit: e.target.value}))} className="w-full p-2 rounded border" style={inp}>
                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color:'var(--color-foreground)' }}>Désignation *</label>
                <input type="text" value={partForm.name} placeholder="Ex: Filtre à huile moteur CAT D6" onChange={e => setPartForm(f => ({...f, name: e.target.value}))} className="w-full p-2 rounded border" style={inp} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color:'var(--color-foreground)' }}>Catégorie</label>
                  <select value={partForm.category} onChange={e => setPartForm(f => ({...f, category: e.target.value, category_custom: ''}))} className="w-full p-2 rounded border" style={inp}>
                    <option value="">Sélectionner...</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  {partForm.category === 'Autre' && (
                    <input type="text" value={partForm.category_custom} placeholder="Préciser la catégorie..." onChange={e => setPartForm(f => ({...f, category_custom: e.target.value}))} className="w-full p-2 rounded border mt-2" style={inp} />
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color:'var(--color-foreground)' }}>Fournisseur</label>
                  <input type="text" value={partForm.supplier} placeholder="Nom du fournisseur" onChange={e => setPartForm(f => ({...f, supplier: e.target.value}))} className="w-full p-2 rounded border" style={inp} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color:'var(--color-foreground)' }}>Description</label>
                <textarea value={partForm.description} rows={2} placeholder="Détails, référence constructeur..." onChange={e => setPartForm(f => ({...f, description: e.target.value}))} className="w-full p-2 rounded border" style={inp} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color:'var(--color-foreground)' }}>Prix unitaire (FCFA)</label>
                  <input type="text" inputMode="decimal" value={partForm.unit_price} placeholder="0" onChange={e => setPartForm(f => ({...f, unit_price: e.target.value}))} className="w-full p-2 rounded border" style={inp} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color:'var(--color-foreground)' }}>
                    Stock de sécurité
                    <span className="text-xs ml-1" style={{ color:'var(--color-muted-foreground)' }}>(minimum)</span>
                  </label>
                  <input type="text" inputMode="decimal" value={partForm.safety_stock} placeholder="0" onChange={e => setPartForm(f => ({...f, safety_stock: e.target.value}))} className="w-full p-2 rounded border" style={inp} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color:'var(--color-foreground)' }}>Emplacement magasin</label>
                <input type="text" value={partForm.location} placeholder="Ex: Étagère A3, Casier 12..." onChange={e => setPartForm(f => ({...f, location: e.target.value}))} className="w-full p-2 rounded border" style={inp} />
              </div>
            </div>
            <div className="flex gap-3 mt-5 justify-end">
              <Button variant="outline" onClick={() => setShowPartModal(false)}>Annuler</Button>
              <Button variant="default" onClick={handleSavePart} disabled={saving}>{saving ? 'Enregistrement...' : 'Enregistrer'}</Button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL MOUVEMENT ── */}
      {showMoveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto" style={{ background:'var(--color-card)' }}>
            <h3 className="text-lg font-semibold mb-4" style={{ color:'var(--color-foreground)' }}>Mouvement de Stock</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color:'var(--color-foreground)' }}>Pièce *</label>
                <select value={moveForm.spare_part_id} onChange={e => setMoveForm(f => ({...f, spare_part_id: e.target.value}))} className="w-full p-2 rounded border" style={inp}>
                  <option value="">Sélectionner une pièce</option>
                  {parts.map(p => <option key={p.id} value={p.id}>{p.name} ({p.reference}) — Stock: {p.quantity} {p.unit}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color:'var(--color-foreground)' }}>Type *</label>
                  <select value={moveForm.movement_type} onChange={e => setMoveForm(f => ({...f, movement_type: e.target.value}))} className="w-full p-2 rounded border" style={inp}>
                    <option value="entry">Entrée (réception)</option>
                    <option value="exit">Sortie (utilisation)</option>
                    <option value="adjustment">Ajustement inventaire</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color:'var(--color-foreground)' }}>Date *</label>
                  <input type="date" value={moveForm.movement_date} onChange={e => setMoveForm(f => ({...f, movement_date: e.target.value}))} className="w-full p-2 rounded border" style={inp} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color:'var(--color-foreground)' }}>Quantité *</label>
                  <input type="text" inputMode="decimal" value={moveForm.quantity} placeholder="0" onChange={e => setMoveForm(f => ({...f, quantity: e.target.value}))} className="w-full p-2 rounded border" style={inp} />
                </div>
                {moveForm.movement_type === 'entry' && (
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color:'var(--color-foreground)' }}>Prix unitaire (FCFA)</label>
                    <input type="text" inputMode="decimal" value={moveForm.unit_price} placeholder="0" onChange={e => setMoveForm(f => ({...f, unit_price: e.target.value}))} className="w-full p-2 rounded border" style={inp} />
                  </div>
                )}
                {moveForm.movement_type === 'exit' && (
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color:'var(--color-foreground)' }}>Équipement</label>
                    <select value={moveForm.equipment_id} onChange={e => setMoveForm(f => ({...f, equipment_id: e.target.value}))} className="w-full p-2 rounded border" style={inp}>
                      <option value="">— Aucun —</option>
                      {equipment.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                    </select>
                  </div>
                )}
              </div>
              {moveForm.movement_type === 'entry' && (
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color:'var(--color-foreground)' }}>Fournisseur</label>
                  <input type="text" value={moveForm.supplier} placeholder="Nom du fournisseur" onChange={e => setMoveForm(f => ({...f, supplier: e.target.value}))} className="w-full p-2 rounded border" style={inp} />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color:'var(--color-foreground)' }}>Motif</label>
                <input type="text" value={moveForm.reason} placeholder={moveForm.movement_type === 'entry' ? 'Achat, réapprovisionnement...' : 'Maintenance, panne, remplacement...'} onChange={e => setMoveForm(f => ({...f, reason: e.target.value}))} className="w-full p-2 rounded border" style={inp} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color:'var(--color-foreground)' }}>Notes</label>
                <textarea value={moveForm.notes} rows={2} onChange={e => setMoveForm(f => ({...f, notes: e.target.value}))} className="w-full p-2 rounded border" style={inp} />
              </div>
            </div>
            <div className="flex gap-3 mt-5 justify-end">
              <Button variant="outline" onClick={() => setShowMoveModal(false)}>Annuler</Button>
              <Button variant="default" onClick={handleSaveMove} disabled={saving}>{saving ? 'Enregistrement...' : 'Enregistrer'}</Button>
            </div>
          </div>
        </div>
      )}

    </AppLayout>
  );
}
