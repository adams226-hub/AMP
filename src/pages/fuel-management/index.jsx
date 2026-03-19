import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line, ResponsiveContainer } from 'recharts';
import AppLayout from "../../components/navigation/AppLayout";
import Icon from "../../components/AppIcon";
import Button from "../../components/ui/Button";
import { miningService } from "../../config/supabase";
import toast from "../../utils/toast";

export default function FuelManagement() {
  const navigate = useNavigate();
  const [consumption, setConsumption] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEntry, setNewEntry] = useState({
    date: '',
    equipment_id: '',
    fuel_type: 'diesel',
    quantity: '',
    cost_per_liter: '',
    supplier: '',
    notes: ''
  });
  const userRole = 'admin'; // From auth context in real app

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
          site: item.site?.name || 'N/A',
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
      if (error || !data || data.length === 0) {
        console.log('Aucun équipement trouvé en base, utilisation des données de démonstration');
        // Données mock avec UUIDs valides pour la démo
        setEquipment([
          {
            id: "550e8400-e29b-41d4-a716-446655440001",
            name: "Excavateur CAT 349",
            serial_number: "EXC001",
            type: "excavator",
            status: "active"
          },
          {
            id: "550e8400-e29b-41d4-a716-446655440002",
            name: "Percatrice Atlas Copco",
            serial_number: "DRILL001",
            type: "drill",
            status: "active"
          },
          {
            id: "550e8400-e29b-41d4-a716-446655440003",
            name: "Convoyeur Principal",
            serial_number: "CV001",
            type: "conveyor",
            status: "maintenance"
          },
          {
            id: "550e8400-e29b-41d4-a716-446655440004",
            name: "Chargeur sur Roues",
            serial_number: "LOAD001",
            type: "loader",
            status: "active"
          }
        ]);
      } else {
        setEquipment(data);
      }
    } catch (error) {
      console.error('Erreur de chargement des équipements, utilisation des données de démonstration');
      // Fallback vers données mock
      setEquipment([
        {
          id: "550e8400-e29b-41d4-a716-446655440001",
          name: "Excavateur CAT 349",
          serial_number: "EXC001",
          type: "excavator",
          status: "active"
        },
        {
          id: "550e8400-e29b-41d4-a716-446655440002",
          name: "Percatrice Atlas Copco",
          serial_number: "DRILL001",
          type: "drill",
          status: "active"
        }
      ]);
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

  const handleAddFuelEntry = async () => {
    if (!newEntry.date || !newEntry.equipment_id || !newEntry.quantity || !newEntry.cost_per_liter) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      toast.loading('Enregistrement...');
      const { data, error } = await miningService.addFuelTransaction(userRole, newEntry);
      if (error) {
        toast.error(`Erreur: ${error.message}`);
      } else {
        toast.success(`Consommation enregistrée: ${newEntry.quantity}L`);
        setShowAddModal(false);
        setNewEntry({
          date: '',
          equipment_id: '',
          fuel_type: 'diesel',
          quantity: '',
          cost_per_liter: '',
          supplier: '',
          notes: ''
        });
        loadFuelData(); // Reload
      }
    } catch (error) {
      toast.error('Erreur lors de l\'enregistrement');
    }
  };

  return (
    <AppLayout userRole="admin" userName="JD" userSite="RomBat Exploration & Mines">
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
              <p className="text-xl font-bold" style={{ color: "var(--color-foreground)" }}>{totalCost.toFixed(2)} €</p>
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
              <p className="text-xl font-bold" style={{ color: "var(--color-foreground)" }}>{avgCostPerL} €</p>
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
                <th className="text-left p-4 text-sm font-medium" style={{ color: "var(--color-muted-foreground)" }}>Coût (€)</th>
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
                        <Button variant="ghost" size="sm" iconName="Edit" />
                        <Button variant="ghost" size="sm" iconName="Trash2" />
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
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="machine" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value} L`, 'Consommation']} />
                  <Legend />
                  <Bar dataKey="consommation" fill="#2C5530" />
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
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value} €`, 'Coût']} />
                  <Legend />
                  <Line type="monotone" dataKey="coût" stroke="#D69E2E" strokeWidth={2} />
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
                {equipment.length > 0 && (
                  <p className="text-xs mt-1" style={{ color: "var(--color-muted-foreground)" }}>
                    💡 Ces équipements sont des données de démonstration. 
                    <button 
                      onClick={() => navigate('/equipment-management')}
                      className="text-blue-500 hover:underline ml-1"
                    >
                      Ajoutez vos vrais équipements ici
                    </button>
                  </p>
                )}
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
                  <option value="diesel">Diesel</option>
                  <option value="essence">Essence</option>
                  <option value="gasoil">Gasoil</option>
                  <option value="hybrid">Hybride</option>
                </select>
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
                    Prix/L (€) *
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

