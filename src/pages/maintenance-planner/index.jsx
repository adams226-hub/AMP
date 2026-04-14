import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "../../components/navigation/AppLayout";
import Icon from "../../components/AppIcon";
import Button from "../../components/ui/Button";
import { miningService } from "../../config/supabase";
import { useAuth } from "../../context/AuthContext";
import { toastSuccess, toastError } from "../../utils/toast";

const PRIORITIES = [
  { value: 'critical', label: 'Critique',  color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
  { value: 'high',     label: 'Haute',     color: '#f97316', bg: 'rgba(249,115,22,0.12)' },
  { value: 'medium',   label: 'Moyenne',   color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  { value: 'low',      label: 'Basse',     color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
];

const FREQ_PRESETS = [
  { label: 'Quotidienne',    days: 1   },
  { label: 'Hebdomadaire',   days: 7   },
  { label: '2 semaines',     days: 14  },
  { label: 'Mensuelle',      days: 30  },
  { label: 'Trimestrielle',  days: 90  },
  { label: 'Semestrielle',   days: 180 },
  { label: 'Annuelle',       days: 365 },
];

const EMPTY_FORM = {
  equipment_id: '', task_name: '', description: '',
  frequency_days: '30', frequency_hours: '', last_done_date: '',
  priority: 'medium', estimated_cost: '', estimated_duration_hours: '',
};

const EMPTY_DONE = {
  performed_date: new Date().toISOString().split('T')[0],
  performed_by: '', cost: '', duration_hours: '', notes: '',
};

const inp = { borderColor:'var(--color-border)', background:'var(--color-input)', color:'var(--color-foreground)' };

function priorityInfo(p) { return PRIORITIES.find(x => x.value === p) || PRIORITIES[2]; }

function statusBadge(s) {
  const today = new Date().toISOString().split('T')[0];
  if (!s.next_due_date) return { label:'Non planifié', color:'#6b7280', bg:'rgba(107,114,128,0.12)' };
  if (s.next_due_date < today) return { label:`En retard (${Math.abs(s.daysUntilDue)}j)`, color:'#ef4444', bg:'rgba(239,68,68,0.12)' };
  if (s.daysUntilDue <= 7)    return { label:`Dans ${s.daysUntilDue}j`, color:'#f97316', bg:'rgba(249,115,22,0.12)' };
  if (s.daysUntilDue <= 30)   return { label:`Dans ${s.daysUntilDue}j`, color:'#f59e0b', bg:'rgba(245,158,11,0.12)' };
  return { label:`Dans ${s.daysUntilDue}j`, color:'#22c55e', bg:'rgba(34,197,94,0.12)' };
}

export default function MaintenancePlanner() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [schedules, setSchedules]   = useState([]);
  const [history, setHistory]       = useState([]);
  const [equipment, setEquipment]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [tab, setTab]               = useState('planning'); // planning | history
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterEq, setFilterEq]     = useState('all');
  const [showModal, setShowModal]   = useState(false);
  const [showDoneModal, setShowDoneModal] = useState(false);
  const [editItem, setEditItem]     = useState(null);
  const [doneTarget, setDoneTarget] = useState(null);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [doneForm, setDoneForm]     = useState(EMPTY_DONE);
  const [saving, setSaving]         = useState(false);

  const load = async () => {
    setLoading(true);
    const [schedRes, histRes, eqRes] = await Promise.all([
      miningService.getMaintenanceSchedules(),
      miningService.getMaintenanceHistory(),
      miningService.getEquipment(user?.role),
    ]);
    setSchedules(schedRes.data || []);
    setHistory(histRes.data || []);
    setEquipment(eqRes.data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  // KPIs
  const today = new Date().toISOString().split('T')[0];
  const in7   = new Date(Date.now() + 7*86400000).toISOString().split('T')[0];
  const in30  = new Date(Date.now() + 30*86400000).toISOString().split('T')[0];
  const overdue  = schedules.filter(s => s.next_due_date && s.next_due_date < today && s.status === 'active');
  const dueSoon  = schedules.filter(s => s.next_due_date && s.next_due_date >= today && s.next_due_date <= in7 && s.status === 'active');
  const dueMonth = schedules.filter(s => s.next_due_date && s.next_due_date > in7 && s.next_due_date <= in30 && s.status === 'active');
  const totalCostMonth = history.filter(h => h.performed_date >= new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0])
    .reduce((s, h) => s + parseFloat(h.cost || 0), 0);

  // Filtre
  const filtered = schedules
    .filter(s => filterPriority === 'all' || s.priority === filterPriority)
    .filter(s => filterEq === 'all' || s.equipment_id === filterEq)
    .map(s => {
      const days = s.next_due_date ? Math.ceil((new Date(s.next_due_date) - new Date(today)) / 86400000) : null;
      return { ...s, daysUntilDue: days, isOverdue: days !== null && days < 0, isDueSoon: days !== null && days >= 0 && days <= 7 };
    })
    .sort((a, b) => {
      if (a.isOverdue && !b.isOverdue) return -1;
      if (!a.isOverdue && b.isOverdue) return 1;
      if (!a.next_due_date) return 1;
      if (!b.next_due_date) return -1;
      return a.next_due_date.localeCompare(b.next_due_date);
    });

  const openNew = () => { setForm(EMPTY_FORM); setEditItem(null); setShowModal(true); };
  const openEdit = s => {
    setForm({
      equipment_id: s.equipment_id || '', task_name: s.task_name || '',
      description: s.description || '', frequency_days: String(s.frequency_days || 30),
      frequency_hours: s.frequency_hours || '', last_done_date: s.last_done_date || '',
      priority: s.priority || 'medium', estimated_cost: s.estimated_cost || '',
      estimated_duration_hours: s.estimated_duration_hours || '', status: s.status || 'active',
    });
    setEditItem(s); setShowModal(true);
  };
  const openDone = s => { setDoneTarget(s); setDoneForm({ ...EMPTY_DONE, performed_date: today }); setShowDoneModal(true); };

  const handleSave = async () => {
    if (!form.equipment_id || !form.task_name || !form.frequency_days) {
      toastError('Équipement, tâche et fréquence sont obligatoires'); return;
    }
    setSaving(true);
    const fn = editItem
      ? miningService.updateMaintenanceSchedule(editItem.id, form)
      : miningService.addMaintenanceSchedule(form);
    const { error } = await fn;
    setSaving(false);
    if (error) { toastError(`Erreur: ${error.message}`); return; }
    toastSuccess(editItem ? 'Planification mise à jour' : 'Planification ajoutée');
    setShowModal(false); load();
  };

  const handleDone = async () => {
    if (!doneForm.performed_date) { toastError('Date obligatoire'); return; }
    setSaving(true);
    const { error } = await miningService.markMaintenanceDone(doneTarget.id, {
      ...doneForm,
      equipment_id: doneTarget.equipment_id,
      task_name: doneTarget.task_name,
    });
    setSaving(false);
    if (error) { toastError(`Erreur: ${error.message}`); return; }
    toastSuccess('Maintenance enregistrée ✓');
    setShowDoneModal(false); load();
  };

  const handleDelete = async id => {
    if (!confirm('Supprimer cette planification ?')) return;
    const { error } = await miningService.deleteMaintenanceSchedule(id);
    if (error) { toastError(`Erreur: ${error.message}`); return; }
    toastSuccess('Supprimé'); load();
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
          <h1 className="text-2xl font-bold" style={{ color:'var(--color-foreground)' }}>Maintenance Préventive</h1>
          <p className="text-sm mt-1" style={{ color:'var(--color-muted-foreground)' }}>Planification, alertes et historique des entretiens</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="default" iconName="Plus" iconPosition="left" onClick={openNew}>Nouvelle Planification</Button>
          <Button variant="outline" iconName="RefreshCw" iconPosition="left" onClick={load}>Actualiser</Button>
          <Button variant="outline" iconName="ArrowLeft" iconPosition="left" onClick={() => navigate('/')}>Retour</Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label:'En Retard',       value: overdue.length,    icon:'AlertCircle', color:'#ef4444', bg:'rgba(239,68,68,0.12)' },
          { label:'À Faire (7j)',    value: dueSoon.length,    icon:'Clock',       color:'#f97316', bg:'rgba(249,115,22,0.12)' },
          { label:'Ce Mois',         value: dueMonth.length,   icon:'Calendar',    color:'#f59e0b', bg:'rgba(245,158,11,0.12)' },
          { label:'Coût Mois (FCFA)',value: totalCostMonth.toLocaleString('fr-FR'), icon:'DollarSign', color:'#3182CE', bg:'rgba(49,130,206,0.12)' },
        ].map((k,i) => (
          <div key={i} className="p-4 rounded-xl border" style={{ background:'var(--color-card)' }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background:k.bg }}>
                <Icon name={k.icon} size={20} color={k.color} />
              </div>
              <div>
                <p className="text-xs" style={{ color:'var(--color-muted-foreground)' }}>{k.label}</p>
                <p className="text-xl font-bold" style={{ color:k.color }}>{k.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Alertes critiques */}
      {overdue.length > 0 && (
        <div className="mb-6 p-4 rounded-xl border" style={{ background:'rgba(239,68,68,0.06)', borderColor:'#ef4444' }}>
          <div className="flex items-center gap-2 mb-3">
            <Icon name="AlertTriangle" size={20} color="#ef4444" />
            <span className="font-semibold" style={{ color:'#ef4444' }}>{overdue.length} maintenance{overdue.length > 1 ? 's' : ''} en retard !</span>
          </div>
          <div className="space-y-1">
            {overdue.slice(0,5).map(s => (
              <div key={s.id} className="flex items-center justify-between text-sm">
                <span style={{ color:'var(--color-foreground)' }}>{s.equipment?.name} — {s.task_name}</span>
                <span className="font-bold" style={{ color:'#ef4444' }}>
                  {s.next_due_date ? `Prévu le ${new Date(s.next_due_date).toLocaleDateString('fr-FR')}` : 'Jamais fait'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {[{ id:'planning', label:'Planification', icon:'Calendar' }, { id:'history', label:'Historique', icon:'ClipboardList' }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
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

      {/* ── TAB PLANNING ── */}
      {tab === 'planning' && (
        <div className="rounded-xl border" style={{ background:'var(--color-card)' }}>
          {/* Filtres */}
          <div className="p-4 border-b flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between" style={{ borderColor:'var(--color-border)' }}>
            <h2 className="text-lg font-semibold" style={{ color:'var(--color-foreground)' }}>
              Plannings ({filtered.length})
            </h2>
            <div className="flex flex-wrap gap-2">
              <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} className="p-2 rounded border text-sm" style={inp}>
                <option value="all">Toutes priorités</option>
                {PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
              <select value={filterEq} onChange={e => setFilterEq(e.target.value)} className="p-2 rounded border text-sm" style={inp}>
                <option value="all">Tous équipements</option>
                {equipment.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="p-16 text-center" style={{ color:'var(--color-muted-foreground)' }}>
              <Icon name="Calendar" size={48} color="var(--color-muted-foreground)" />
              <p className="mt-4 text-lg">Aucune planification</p>
              <p className="text-sm mt-1">Créez votre premier planning de maintenance</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[750px]">
                <thead>
                  <tr className="border-b text-sm" style={{ borderColor:'var(--color-border)', color:'var(--color-muted-foreground)' }}>
                    <th className="text-left p-4">Équipement</th>
                    <th className="text-left p-4">Tâche</th>
                    <th className="text-left p-4">Périodicité</th>
                    <th className="text-left p-4">Priorité</th>
                    <th className="text-left p-4">Dernière fois</th>
                    <th className="text-left p-4">Prochaine échéance</th>
                    <th className="text-left p-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(s => {
                    const st  = statusBadge(s);
                    const pri = priorityInfo(s.priority);
                    return (
                      <tr key={s.id} className="border-b" style={{ borderColor:'var(--color-border)', background: s.isOverdue ? 'rgba(239,68,68,0.03)' : undefined }}>
                        <td className="p-4 font-medium" style={{ color:'var(--color-foreground)' }}>{s.equipment?.name || '—'}</td>
                        <td className="p-4">
                          <div style={{ color:'var(--color-foreground)' }} className="font-medium">{s.task_name}</div>
                          {s.description && <div className="text-xs mt-0.5 max-w-[200px] truncate" style={{ color:'var(--color-muted-foreground)' }}>{s.description}</div>}
                        </td>
                        <td className="p-4 text-sm" style={{ color:'var(--color-foreground)' }}>
                          Tous les {s.frequency_days}j
                          {s.frequency_hours && <span className="block text-xs" style={{ color:'var(--color-muted-foreground)' }}>{s.frequency_hours}h moteur</span>}
                        </td>
                        <td className="p-4">
                          <span className="px-2 py-1 rounded-full text-xs font-medium" style={{ background:pri.bg, color:pri.color }}>{pri.label}</span>
                        </td>
                        <td className="p-4 text-sm" style={{ color:'var(--color-muted-foreground)' }}>
                          {s.last_done_date ? new Date(s.last_done_date).toLocaleDateString('fr-FR') : 'Jamais'}
                        </td>
                        <td className="p-4">
                          <span className="px-2 py-1 rounded-full text-xs font-medium" style={{ background:st.bg, color:st.color }}>
                            {s.next_due_date ? new Date(s.next_due_date).toLocaleDateString('fr-FR') : '—'} · {st.label}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-1">
                            <button onClick={() => openDone(s)} title="Marquer effectué"
                              className="p-1.5 rounded hover:bg-green-50" >
                              <Icon name="CheckCircle" size={16} color="#22c55e" />
                            </button>
                            <button onClick={() => openEdit(s)} title="Modifier" className="p-1.5 rounded hover:bg-gray-100">
                              <Icon name="Edit" size={15} color="var(--color-primary)" />
                            </button>
                            <button onClick={() => handleDelete(s.id)} title="Supprimer" className="p-1.5 rounded hover:bg-gray-100">
                              <Icon name="Trash2" size={15} color="var(--color-error)" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── TAB HISTORIQUE ── */}
      {tab === 'history' && (
        <div className="rounded-xl border" style={{ background:'var(--color-card)' }}>
          <div className="p-4 border-b" style={{ borderColor:'var(--color-border)' }}>
            <h2 className="text-lg font-semibold" style={{ color:'var(--color-foreground)' }}>Historique des Maintenances</h2>
          </div>
          {history.length === 0 ? (
            <div className="p-16 text-center" style={{ color:'var(--color-muted-foreground)' }}>
              <Icon name="ClipboardList" size={48} color="var(--color-muted-foreground)" />
              <p className="mt-4">Aucun historique enregistré</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[650px]">
                <thead>
                  <tr className="border-b text-sm" style={{ borderColor:'var(--color-border)', color:'var(--color-muted-foreground)' }}>
                    <th className="text-left p-4">Date</th>
                    <th className="text-left p-4">Équipement</th>
                    <th className="text-left p-4">Tâche</th>
                    <th className="text-left p-4">Réalisé par</th>
                    <th className="text-left p-4">Durée</th>
                    <th className="text-left p-4">Coût</th>
                    <th className="text-left p-4">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map(h => (
                    <tr key={h.id} className="border-b" style={{ borderColor:'var(--color-border)' }}>
                      <td className="p-4 text-sm" style={{ color:'var(--color-foreground)' }}>{new Date(h.performed_date).toLocaleDateString('fr-FR')}</td>
                      <td className="p-4 font-medium" style={{ color:'var(--color-foreground)' }}>{h.equipment?.name || '—'}</td>
                      <td className="p-4 text-sm" style={{ color:'var(--color-foreground)' }}>{h.task_name}</td>
                      <td className="p-4 text-sm" style={{ color:'var(--color-muted-foreground)' }}>{h.performed_by || '—'}</td>
                      <td className="p-4 text-sm" style={{ color:'var(--color-muted-foreground)' }}>{h.duration_hours ? `${h.duration_hours}h` : '—'}</td>
                      <td className="p-4 text-sm font-medium" style={{ color:'var(--color-foreground)' }}>
                        {h.cost ? `${parseFloat(h.cost).toLocaleString('fr-FR')} FCFA` : '—'}
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-1 rounded-full text-xs font-medium"
                          style={{ background: h.status === 'completed' ? 'rgba(34,197,94,0.12)' : 'rgba(245,158,11,0.12)', color: h.status === 'completed' ? '#22c55e' : '#f59e0b' }}>
                          {h.status === 'completed' ? 'Effectué' : h.status === 'partial' ? 'Partiel' : 'Annulé'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── MODAL NOUVELLE PLANIFICATION ── */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" style={{ background:'var(--color-card)' }}>
            <h3 className="text-lg font-semibold mb-4" style={{ color:'var(--color-foreground)' }}>
              {editItem ? 'Modifier la Planification' : 'Nouvelle Planification de Maintenance'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color:'var(--color-foreground)' }}>Équipement *</label>
                <select value={form.equipment_id} onChange={e => setForm(f => ({...f, equipment_id: e.target.value}))} className="w-full p-2 rounded border" style={inp}>
                  <option value="">Sélectionner un équipement</option>
                  {equipment.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color:'var(--color-foreground)' }}>Tâche de maintenance *</label>
                <input type="text" value={form.task_name} placeholder="Ex: Vidange moteur, Graissage, Vérification freins..." onChange={e => setForm(f => ({...f, task_name: e.target.value}))} className="w-full p-2 rounded border" style={inp} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color:'var(--color-foreground)' }}>Description</label>
                <textarea value={form.description} rows={2} placeholder="Détails de la tâche..." onChange={e => setForm(f => ({...f, description: e.target.value}))} className="w-full p-2 rounded border" style={inp} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color:'var(--color-foreground)' }}>Périodicité *</label>
                <div className="flex flex-wrap gap-1 mb-2">
                  {FREQ_PRESETS.map(p => (
                    <button key={p.days} onClick={() => setForm(f => ({...f, frequency_days: String(p.days)}))}
                      className="px-2 py-1 rounded text-xs border"
                      style={{ background: form.frequency_days === String(p.days) ? 'var(--color-primary)' : 'var(--color-background)', color: form.frequency_days === String(p.days) ? '#fff' : 'var(--color-foreground)', borderColor:'var(--color-border)' }}>
                      {p.label}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <input type="text" inputMode="decimal" value={form.frequency_days} placeholder="Jours" onChange={e => setForm(f => ({...f, frequency_days: e.target.value}))} className="w-full p-2 rounded border" style={inp} />
                    <p className="text-xs mt-0.5" style={{ color:'var(--color-muted-foreground)' }}>Fréquence en jours</p>
                  </div>
                  <div className="flex-1">
                    <input type="text" inputMode="decimal" value={form.frequency_hours} placeholder="Optionnel" onChange={e => setForm(f => ({...f, frequency_hours: e.target.value}))} className="w-full p-2 rounded border" style={inp} />
                    <p className="text-xs mt-0.5" style={{ color:'var(--color-muted-foreground)' }}>Heures moteur (optionnel)</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color:'var(--color-foreground)' }}>Priorité</label>
                  <select value={form.priority} onChange={e => setForm(f => ({...f, priority: e.target.value}))} className="w-full p-2 rounded border" style={inp}>
                    {PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color:'var(--color-foreground)' }}>Dernière réalisation</label>
                  <input type="date" value={form.last_done_date} onChange={e => setForm(f => ({...f, last_done_date: e.target.value}))} className="w-full p-2 rounded border" style={inp} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color:'var(--color-foreground)' }}>Coût estimé (FCFA)</label>
                  <input type="text" inputMode="decimal" value={form.estimated_cost} placeholder="0" onChange={e => setForm(f => ({...f, estimated_cost: e.target.value}))} className="w-full p-2 rounded border" style={inp} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color:'var(--color-foreground)' }}>Durée estimée (h)</label>
                  <input type="text" inputMode="decimal" value={form.estimated_duration_hours} placeholder="0" onChange={e => setForm(f => ({...f, estimated_duration_hours: e.target.value}))} className="w-full p-2 rounded border" style={inp} />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6 justify-end">
              <Button variant="outline" onClick={() => setShowModal(false)}>Annuler</Button>
              <Button variant="default" onClick={handleSave} disabled={saving}>{saving ? 'Enregistrement...' : 'Enregistrer'}</Button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL MARQUER EFFECTUÉ ── */}
      {showDoneModal && doneTarget && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto" style={{ background:'var(--color-card)' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background:'rgba(34,197,94,0.12)' }}>
                <Icon name="CheckCircle" size={20} color="#22c55e" />
              </div>
              <div>
                <h3 className="font-semibold" style={{ color:'var(--color-foreground)' }}>Maintenance Effectuée</h3>
                <p className="text-sm" style={{ color:'var(--color-muted-foreground)' }}>{doneTarget.equipment?.name} — {doneTarget.task_name}</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color:'var(--color-foreground)' }}>Date réalisation *</label>
                  <input type="date" value={doneForm.performed_date} onChange={e => setDoneForm(f => ({...f, performed_date: e.target.value}))} className="w-full p-2 rounded border" style={inp} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color:'var(--color-foreground)' }}>Réalisé par</label>
                  <input type="text" value={doneForm.performed_by} placeholder="Technicien" onChange={e => setDoneForm(f => ({...f, performed_by: e.target.value}))} className="w-full p-2 rounded border" style={inp} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color:'var(--color-foreground)' }}>Coût réel (FCFA)</label>
                  <input type="text" inputMode="decimal" value={doneForm.cost} placeholder="0" onChange={e => setDoneForm(f => ({...f, cost: e.target.value}))} className="w-full p-2 rounded border" style={inp} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color:'var(--color-foreground)' }}>Durée (heures)</label>
                  <input type="text" inputMode="decimal" value={doneForm.duration_hours} placeholder="0" onChange={e => setDoneForm(f => ({...f, duration_hours: e.target.value}))} className="w-full p-2 rounded border" style={inp} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color:'var(--color-foreground)' }}>Notes</label>
                <textarea value={doneForm.notes} rows={2} placeholder="Observations, pièces remplacées..." onChange={e => setDoneForm(f => ({...f, notes: e.target.value}))} className="w-full p-2 rounded border" style={inp} />
              </div>
            </div>
            <div className="flex gap-3 mt-5 justify-end">
              <Button variant="outline" onClick={() => setShowDoneModal(false)}>Annuler</Button>
              <Button variant="default" onClick={handleDone} disabled={saving}>{saving ? 'Enregistrement...' : 'Confirmer'}</Button>
            </div>
          </div>
        </div>
      )}

    </AppLayout>
  );
}
