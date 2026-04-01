import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line, ResponsiveContainer } from 'recharts';
import AppLayout from "../../components/navigation/AppLayout";
import Icon from "../../components/AppIcon";
import Button from "../../components/ui/Button";
import { miningService } from "../../config/supabase";
import { useAuth } from "../../context/AuthContext";
import toast from "../../utils/toast";
import { default as hotToast } from "react-hot-toast";

export default function FuelManagement() {
  const navigate = useNavigate();
  const [consumption, setConsumption] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editEntry, setEditEntry] = useState(null);
  const [newEntry, setNewEntry] = useState({
    date: '',
    equipment_id: '',
    fuel_type: 'gasoil',
    quantity: '',
    cost_per_liter: '',
    supplier: '',
    operator_name: '',
    site: 'Koro',
    notes: ''
  });
  const { user } = useAuth();
  const userRole = user?.role;

  const loadFuelData = async () => {
    setLoading(true);
    try {
      const { data, error } = await miningService.getFuelTransactions(userRole);
      if (error) {
        toast.error(`Erreur chargement: ${error.message}`);
      } else {
        // Map data for UI
        const mappedData = data?.map(item => ({
          ...item,
          date: item.transaction_date,
          equipment: item.equipment?.name || item.equipment_id,
          operator: item.operator_name || 'N/A',
          site: item.site || item.equipment?.location || item.equipment?.name || 'N/A',
          cost: parseFloat(item.total_cost || (item.quantity * item.cost_per_liter || 0)).toFixed(2),
          efficiency: '--' // From summary if needed
        })) || [];
        setConsumption(mappedData);
      }
    } catch (error) {
      toast.error('Erreur de chargement des données carburant');
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
    loadFuelData();
    loadEquipment();
  }, []);

  const totalConsumption = consumption.reduce((sum, item) => sum + parseFloat(item.quantity || 0), 0);
  const totalCost = consumption.reduce((sum, item) => sum + parseFloat(item.cost || 0), 0);
  const avgCostPerL = consumption.length > 0 ? (totalCost / totalConsumption).toFixed(2) : 0;

  // Données pour le graphique Consommation par Machine
  const consumptionByMachine = consumption.reduce((acc, item) => {
    const machine = item.equipment || 'Inconnu';
    if (!acc[machine]) {
      acc[machine] = 0;
    }
    acc[machine] += parseFloat(item.quantity || 0);
    return acc;
  }, {});

  const consumptionChartData = Object.entries(consumptionByMachine).map(([machine, qty]) => ({
    machine: machine.length > 15 ? machine.substring(0, 15) + '...' : machine,
    consommation: Math.round(qty * 100) / 100
  }));

  // Données pour le graphique Évolution Coûts
  const costByDate = consumption.reduce((acc, item) => {
    const date = item.date ? new Date(item.date).toISOString().split('T')[0] : 'Inconnue';
    if (!acc[date]) {
      acc[date] = 0;
    }
    acc[date] += parseFloat(item.cost || 0);
    return acc;
  }, {});

  const costEvolutionData = Object.entries(costByDate)
    .sort(([a], [b]) => new Date(a) - new Date(b))
    .map(([date, cost]) => ({
      date: new Date(date).toLocaleDateString('fr-FR'),
      coût: Math.round(cost * 100) / 100
    }));

  const handleDeleteFuel = async () => {
    if (!confirmDeleteId) return;
    try {
      const { error } = await miningService.deleteFuelTransaction(confirmDeleteId);
      if (error) throw error;
      toast.success('Transaction supprimée');
      setConfirmDeleteId(null);
      loadFuelData();
    } catch (err) {
      toast.error('Erreur suppression: ' + err.message);
      setConfirmDeleteId(null);
    }
  };

  const openEdit = (item) => {
    setEditEntry({
      id: item.id,
      date: item.transaction_date || item.date,
      equipment_id: item.equipment_id,
      fuel_type: item.fuel_type,
      quantity: item.quantity,
      cost_per_liter: item.cost_per_liter,
      operator_name: item.operator_name || item.operator || '',
      supplier: item.supplier || '',
      site: item.site || 'Koro',
      notes: item.notes || '',
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editEntry.date || !editEntry.quantity || !editEntry.cost_per_liter) {
      toast.error('Date, quantité et prix obligatoires');
      return;
    }
    try {
      const { error } = await miningService.updateFuelTransaction(editEntry.id, {
        transaction_date: editEntry.date,
        fuel_type: editEntry.fuel_type,
        quantity: parseFloat(editEntry.quantity),
        cost_per_liter: parseFloat(editEntry.cost_per_liter),
        operator_name: editEntry.operator_name || null,
        supplier: editEntry.supplier || null,
        site: editEntry.site || null,
        notes: editEntry.notes || null,
      });
      if (error) throw error;
      toast.success('Transaction mise à jour');
      setShowEditModal(false);
      setEditEntry(null);
      loadFuelData();
    } catch (err) {
      toast.error('Erreur mise à jour: ' + err.message);
    }
  };

  const handleAddFuelEntry = async () => {
    if (!newEntry.date || !newEntry.equipment_id || !newEntry.quantity || !newEntry.cost_per_liter) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    const loadingId = hotToast.loading('Enregistrement...', { position: 'top-right' });
    try {
      const { data, error } = await miningService.addFuelTransaction(newEntry);
      toast.dismiss(loadingId);
      if (error) {
        toast.error(`Erreur: ${error.message}`);
      } else {
        toast.success(`Consommation enregistrée: ${newEntry.quantity}L`);
        setShowAddModal(false);
        setNewEntry({
          date: '',
          equipment_id: '',
          fuel_type: 'gasoil',
          quantity: '',
          cost_per_liter: '',
          supplier: '',
          operator_name: '',
          site: 'Koro',
          notes: ''
        });
        loadFuelData();
      }
    } catch (error) {
      toast.dismiss(loadingId);
      toast.error('Erreur lors de l\'enregistrement');
    }
  };

  return (
    <AppLayout userRole={user?.role} userName={user?.full_name} userSite="Amp Mines et Carrieres">
      {/* Header same as before */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--color-foreground)" }}>
            Gestion du Carburant
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--color-muted-foreground)" }}>
            Suivi de la consommation et des coûts de carburant par machine
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            iconName="Wrench"
            iconPosition="left"
            onClick={() => navigate("/equipment-management")}
          >
            Gérer Équipements
          </Button>
          <Button
            variant="default"
            iconName="Plus"
            iconPosition="left"
            onClick={() => setShowAddModal(true)}
          >
            Ajouter Consommation
          </Button>
          <Button
            variant="outline"
            iconName="ArrowLeft"
            iconPosition="left"
            onClick={() => navigate("/")}
          >
            Retour
          </Button>
        </div>
      </div>

      {/* Stats cards - updated */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="p-4 rounded-xl border" style={{ background: "var(--color-card)" }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(229,62,62,0.12)" }}>
              <Icon name="Fuel" size={20} color="var(--color-error)" />
            </div>
            <div>
              <p className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>Total Consommé</p>
              <p className="text-xl font-bold" style={{ color: "var(--color-foreground)" }}>{totalConsumption.toFixed(0)} L</p>
            </div>
          </div>
        </div>
        <div className="p-4 rounded-xl border" style={{ background: "var(--color-card)" }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(229,62,62,0.12)" }}>
              <Icon name="Receipt" size={20} color="var(--color-error)" />
            </div>
            <div>
              <p className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>Coût Total</p>
              <p className="text-xl font-bold" style={{ color: "var(--color-foreground)" }}>{totalCost.toLocaleString('fr-FR')} FCFA</p>
            </div>
          </div>
        </div>
        <div className="p-4 rounded-xl border" style={{ background: "var(--color-card)" }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(49,130,206,0.12)" }}>
              <Icon name="DollarSign" size={20} color="#3182CE" />
            </div>
            <div>
              <p className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>Coût Moyen/L</p>
              <p className="text-xl font-bold" style={{ color: "var(--color-foreground)" }}>{avgCostPerL} FCFA</p>
            </div>
          </div>
        </div>
        <div className="p-4 rounded-xl border" style={{ background: "var(--color-card)" }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(56,161,105,0.12)" }}>
              <Icon name="TrendingUp" size={20} color="var(--color-success)" />
            </div>
            <div>
              <p className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>Transactions</p>
              <p className="text-xl font-bold" style={{ color: "var(--color-foreground)" }}>{consumption.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Table same structure, but data from state */}
      <div className="rounded-xl border" style={{ background: "var(--color-card)" }}>
        <div className="p-4 border-b" style={{ borderColor: "var(--color-border)" }}>
          <h2 className="text-lg font-semibold" style={{ color: "var(--color-foreground)" }}>
            Historique des Consommations
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b" style={{ borderColor: "var(--color-border)" }}>
                <th className="text-left p-4 text-sm font-medium" style={{ color: "var(--color-muted-foreground)" }}>Date</th>
                <th className="text-left p-4 text-sm font-medium" style={{ color: "var(--color-muted-foreground)" }}>Machine</th>
                <th className="text-left p-4 text-sm font-medium" style={{ color: "var(--color-muted-foreground)" }}>Opérateur</th>
                <th className="text-left p-4 text-sm font-medium" style={{ color: "var(--color-muted-foreground)" }}>Type</th>
                <th className="text-left p-4 text-sm font-medium" style={{ color: "var(--color-muted-foreground)" }}>Quantité (L)</th>
                <th className="text-left p-4 text-sm font-medium" style={{ color: "var(--color-muted-foreground)" }}>Coût (FCFA)</th>
                <th className="text-left p-4 text-sm font-medium" style={{ color: "var(--color-muted-foreground)" }}>Site</th>
                <th className="text-left p-4 text-sm font-medium" style={{ color: "var(--color-muted-foreground)" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="p-8 text-center" style={{ color: "var(--color-muted-foreground)" }}>
                    Chargement...
                  </td>
                </tr>
              ) : consumption.length === 0 ? (
                <tr>
                  <td colSpan="8" className="p-8 text-center" style={{ color: "var(--color-muted-foreground)" }}>
                    Aucune consommation enregistrée. Ajoutez la première !
                  </td>
                </tr>
              ) : (
                consumption.map((item) => (
                  <tr key={item.id} className="border-b" style={{ borderColor: "var(--color-border)" }}>
                    <td className="p-4" style={{ color: "var(--color-foreground)" }}>{item.date}</td>
                    <td className="p-4 font-medium" style={{ color: "var(--color-foreground)" }}>{item.equipment}</td>
                    <td className="p-4" style={{ color: "var(--color-foreground)" }}>{item.operator}</td>
                    <td className="p-4 px-2 py-1 rounded text-xs" style={{ 
                      background: "rgba(56,161,105,0.12)", 
                      color: "var(--color-success)",
                      fontFamily: "monospace"
                    }}>{item.fuel_type}</td>
                    <td className="p-4 font-semibold" style={{ color: "var(--color-foreground)" }}>{item.quantity}</td>
                    <td className="p-4" style={{ color: "var(--color-foreground)" }}>{item.cost}</td>
                    <td className="p-4" style={{ color: "var(--color-foreground)" }}>{item.site}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEdit(item)}
                          className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors hover:bg-muted"
                          style={{ color: "var(--color-primary)" }}
                        >
                          <Icon name="Edit" size={13} color="var(--color-primary)" />
                          Modifier
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(item.id)}
                          className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors hover:bg-muted"
                          style={{ color: "var(--color-error)" }}
                        >
                          <Icon name="Trash2" size={13} color="var(--color-error)" />
                          Suppr.
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="rounded-xl border p-6" style={{ background: "var(--color-card)" }}>
          <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--color-foreground)" }}>
            Consommation par Machine
          </h3>
          <div className="h-64">
            {consumptionChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={consumptionChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis 
                    dataKey="machine" 
                    tick={{ fontSize: 11, fill: "var(--color-muted-foreground)", fontFamily: "var(--font-caption)" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 11, fill: "var(--color-muted-foreground)", fontFamily: "var(--font-caption)" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip formatter={(value) => [`${value} L`, 'Consommation']} />
                  <Legend />
                  <Bar dataKey="consommation" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center bg-muted/30 rounded-lg" style={{ color: "var(--color-muted-foreground)" }}>
                Aucune donnée disponible
              </div>
            )}
          </div>
        </div>
        <div className="rounded-xl border p-6" style={{ background: "var(--color-card)" }}>
          <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--color-foreground)" }}>
            Évolution Coûts
          </h3>
          <div className="h-64">
            {costEvolutionData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={costEvolutionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 11, fill: "var(--color-muted-foreground)", fontFamily: "var(--font-caption)" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 11, fill: "var(--color-muted-foreground)", fontFamily: "var(--font-caption)" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip formatter={(value) => [`${value} FCFA`, 'Coût']} />
                  <Legend />
                  <Line type="monotone" dataKey="coût" stroke="var(--color-warning)" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center bg-muted/30 rounded-lg" style={{ color: "var(--color-muted-foreground)" }}>
                Aucune donnée disponible
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Confirmation Suppression */}
      {confirmDeleteId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="rounded-xl p-6 w-full max-w-sm" style={{ background: "var(--color-card)" }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "rgba(229,62,62,0.12)" }}>
                <Icon name="AlertTriangle" size={20} color="var(--color-error)" />
              </div>
              <div>
                <h3 className="text-base font-semibold" style={{ color: "var(--color-foreground)" }}>Supprimer cette transaction ?</h3>
                <p className="text-xs mt-0.5" style={{ color: "var(--color-muted-foreground)" }}>Cette action est irréversible.</p>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setConfirmDeleteId(null)}>Annuler</Button>
              <Button variant="destructive" onClick={handleDeleteFuel}>Supprimer</Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Modifier */}
      {showEditModal && editEntry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto" style={{ background: "var(--color-card)" }}>
            <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--color-foreground)" }}>Modifier la consommation</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-foreground)" }}>Date</label>
                <input type="date" value={editEntry.date} onChange={(e) => setEditEntry({ ...editEntry, date: e.target.value })}
                  className="w-full p-2 rounded border" style={{ borderColor: "var(--color-border)", background: "var(--color-input)", color: "var(--color-foreground)" }} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-foreground)" }}>Type Carburant</label>
                <select value={editEntry.fuel_type} onChange={(e) => setEditEntry({ ...editEntry, fuel_type: e.target.value })}
                  className="w-full p-2 rounded border" style={{ borderColor: "var(--color-border)", background: "var(--color-input)", color: "var(--color-foreground)" }}>
                  <option value="essence">Essence</option>
                  <option value="gasoil">Gasoil</option>
                  <option value="diesel">Diesel</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-foreground)" }}>Quantité (L)</label>
                  <input type="number" step="0.1" min="0" value={editEntry.quantity} onChange={(e) => setEditEntry({ ...editEntry, quantity: e.target.value })}
                    className="w-full p-2 rounded border" style={{ borderColor: "var(--color-border)", background: "var(--color-input)", color: "var(--color-foreground)" }} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-foreground)" }}>Prix/L (FCFA)</label>
                  <input type="number" step="0.01" min="0" value={editEntry.cost_per_liter} onChange={(e) => setEditEntry({ ...editEntry, cost_per_liter: e.target.value })}
                    className="w-full p-2 rounded border" style={{ borderColor: "var(--color-border)", background: "var(--color-input)", color: "var(--color-foreground)" }} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-foreground)" }}>Opérateur</label>
                <input type="text" value={editEntry.operator_name} onChange={(e) => setEditEntry({ ...editEntry, operator_name: e.target.value })}
                  className="w-full p-2 rounded border" style={{ borderColor: "var(--color-border)", background: "var(--color-input)", color: "var(--color-foreground)" }} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-foreground)" }}>Notes</label>
                <textarea value={editEntry.notes} onChange={(e) => setEditEntry({ ...editEntry, notes: e.target.value })} rows="2"
                  className="w-full p-2 rounded border" style={{ borderColor: "var(--color-border)", background: "var(--color-input)", color: "var(--color-foreground)" }} />
              </div>
            </div>
            <div className="flex gap-3 mt-4 justify-end">
              <Button variant="outline" onClick={() => { setShowEditModal(false); setEditEntry(null); }}>Annuler</Button>
              <Button variant="default" onClick={handleSaveEdit}>Sauvegarder</Button>
            </div>
          </div>
        </div>
      )}

      {/* Simplified Modal - matches schema */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto" style={{ background: "var(--color-card)" }}>
            <h3 className="text-lg font-semibold mb-6" style={{ color: "var(--color-foreground)" }}>
              Nouvelle Consommation Carburant
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "var(--color-foreground)" }}>
                  Date *
                </label>
                <input
                  type="date"
                  value={newEntry.date}
                  onChange={(e) => setNewEntry({...newEntry, date: e.target.value})}
                  className="w-full p-3 rounded-lg border transition-colors"
                  style={{ 
                    borderColor: "var(--color-border)",
                    background: "var(--color-input)",
                    color: "var(--color-foreground)"
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "var(--color-foreground)" }}>
                  Équipement *
                </label>
                <select
                  value={newEntry.equipment_id}
                  onChange={(e) => setNewEntry({...newEntry, equipment_id: e.target.value})}
                  className="w-full p-3 rounded-lg border transition-colors"
                  style={{ 
                    borderColor: "var(--color-border)",
                    background: "var(--color-input)",
                    color: "var(--color-foreground)"
                  }}
                >
                  <option value="">Sélectionner un équipement</option>
                  {equipment.map((equip) => (
                    <option key={equip.id} value={equip.id}>
                      {equip.name} ({equip.serial_number})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "var(--color-foreground)" }}>
                  Type Carburant *
                </label>
                <select
                  value={newEntry.fuel_type}
                  onChange={(e) => setNewEntry({...newEntry, fuel_type: e.target.value})}
                  className="w-full p-3 rounded-lg border transition-colors"
                  style={{ 
                    borderColor: "var(--color-border)",
                    background: "var(--color-input)",
                    color: "var(--color-foreground)"
                  }}
                >
                  <option value="essence">Essence</option>
                  <option value="gasoil">Gasoil</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "var(--color-foreground)" }}>
                  Site
                </label>
                <input
                  type="text"
                  value="Koro"
                  disabled
                  className="w-full p-3 rounded-lg border transition-colors"
                  style={{ 
                    borderColor: "var(--color-border)",
                    background: "var(--color-input)",
                    color: "var(--color-foreground)"
                  }}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: "var(--color-foreground)" }}>
                    Quantité (L) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={newEntry.quantity}
                    onChange={(e) => setNewEntry({...newEntry, quantity: parseFloat(e.target.value) || ''})}
                    className="w-full p-3 rounded-lg border transition-colors"
                    style={{ 
                      borderColor: "var(--color-border)",
                      background: "var(--color-input)",
                      color: "var(--color-foreground)"
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: "var(--color-foreground)" }}>
                    Prix/L (FCFA) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newEntry.cost_per_liter}
                    onChange={(e) => setNewEntry({...newEntry, cost_per_liter: parseFloat(e.target.value) || ''})}
                    className="w-full p-3 rounded-lg border transition-colors"
                    style={{ 
                      borderColor: "var(--color-border)",
                      background: "var(--color-input)",
                      color: "var(--color-foreground)"
                    }}
                  />
                </div>
              </div>
              {/* Total calculé en temps réel */}
              {newEntry.quantity && newEntry.cost_per_liter && (
                <div className="p-3 rounded-lg" style={{ background: "rgba(44,85,48,0.08)", border: "1px solid var(--color-primary)" }}>
                  <p className="text-sm font-semibold" style={{ color: "var(--color-primary)" }}>
                    Total: {(parseFloat(newEntry.quantity) * parseFloat(newEntry.cost_per_liter)).toLocaleString('fr-FR')} FCFA
                  </p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "var(--color-foreground)" }}>
                  Opérateur
                </label>
                <input
                  type="text"
                  value={newEntry.operator_name}
                  onChange={(e) => setNewEntry({...newEntry, operator_name: e.target.value})}
                  className="w-full p-3 rounded-lg border transition-colors"
                  style={{
                    borderColor: "var(--color-border)",
                    background: "var(--color-input)",
                    color: "var(--color-foreground)"
                  }}
                  placeholder="Nom de l'opérateur"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "var(--color-foreground)" }}>
                  Fournisseur
                </label>
                <input
                  type="text"
                  value={newEntry.supplier}
                  onChange={(e) => setNewEntry({...newEntry, supplier: e.target.value})}
                  className="w-full p-3 rounded-lg border transition-colors"
                  style={{
                    borderColor: "var(--color-border)",
                    background: "var(--color-input)",
                    color: "var(--color-foreground)"
                  }}
                  placeholder="Fournisseur optionnel"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "var(--color-foreground)" }}>
                  Notes
                </label>
                <textarea
                  value={newEntry.notes}
                  onChange={(e) => setNewEntry({...newEntry, notes: e.target.value})}
                  rows="2"
                  className="w-full p-3 rounded-lg border transition-colors resize-vertical"
                  style={{ 
                    borderColor: "var(--color-border)",
                    background: "var(--color-input)",
                    color: "var(--color-foreground)"
                  }}
                  placeholder="Notes optionnelles..."
                />
              </div>
            </div>
            <div className="flex gap-3 mt-8 pt-4 border-t" style={{ borderColor: "var(--color-border)" }}>
              <Button variant="default" onClick={handleAddFuelEntry} className="flex-1">
                Enregistrer
              </Button>
              <Button variant="outline" onClick={() => setShowAddModal(false)} className="flex-1">
                Annuler
              </Button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

