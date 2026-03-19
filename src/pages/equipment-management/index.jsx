import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "components/navigation/AppLayout";
import Icon from "components/AppIcon";
import Button from "components/ui/Button";
import { useAuth } from "../..//context/AuthContext";
import { miningService } from "../../config/supabase";

export default function EquipmentManagement() {
  const navigate = useNavigate();
  const [equipment, setEquipment] = useState([]);
  const [operationLogs, setOperationLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showOperationModal, setShowOperationModal] = useState(false);
  const [activeTab, setActiveTab] = useState('equipment'); // 'equipment' or 'operations'
  
  const [newEquipment, setNewEquipment] = useState({
    name: '',
    type: '',
    model: '',
    serial_number: '',
    location: '',
    capacity: ''
  });

  // Nouveau: État pour le suivi quotidien des opérations
  const [newOperation, setNewOperation] = useState({
    date: new Date().toISOString().split('T')[0],
    equipment_id: '',
    shift: 'jour',
    machine_type: '',
    status: 'functional', // 'functional' ou 'panne'
    breakdown_time: '',
    repair_status: '', // 'en_reparation' ou 'hors_service'
    resume_time: '',
    counter_start: '',
    counter_end: '',
    distance: ''
  });

  useEffect(() => {
    fetchEquipmentData();
    loadOperationLogs();
  }, []);

  const fetchEquipmentData = async () => {
    setLoading(true);
    try {
      // appeler le service back-end en passant le rôle de l'utilisateur
      const { data, error } = await miningService.getEquipment(user?.role);
      if (error) throw error;
      if (data) {
        setEquipment(data);
      } else {
        setEquipment([]);
      }
    } catch (error) {
      console.error("Erreur chargement équipements:", error);
      // pour la démo on conserve des données mock si l'API ne répond pas
      setEquipment([
        {
          id: 1,
          name: "Excavateur CAT 349",
          type: "excavator",
          machine_type: "Pelle hydraulique",
          model: "CAT 349F",
          serial_number: "EXC001",
          location: "Site A",
          status: "active",
          capacity: 50.5,
          purchase_date: "2023-01-15",
          last_maintenance: "2026-02-20",
          next_maintenance: "2026-03-20"
        },
        {
          id: 2,
          name: "Percatrice Atlas Copco",
          type: "drill",
          machine_type: "Foruse",
          model: "ROC L8",
          serial_number: "DRILL001",
          location: "Site A",
          status: "active",
          capacity: 25.0,
          purchase_date: "2023-03-10",
          last_maintenance: "2026-02-15",
          next_maintenance: "2026-03-15"
        },
        {
          id: 3,
          name: "Convoyeur Principal",
          type: "conveyor",
          machine_type: "Convoyeur",
          model: "CV-1000",
          serial_number: "CV001",
          location: "Site B",
          status: "maintenance",
          capacity: 100.0,
          purchase_date: "2022-11-20",
          last_maintenance: "2026-03-01",
          next_maintenance: "2026-03-10"
        },
        {
          id: 4,
          name: "Concasseur Metso",
          type: "crusher",
          machine_type: "Concasseur",
          model: "Nordberg C200",
          serial_number: "CRUSH001",
          location: "Site B",
          status: "active",
          capacity: 75.0,
          purchase_date: "2022-09-05",
          last_maintenance: "2026-02-25",
          next_maintenance: "2026-03-25"
        },
        {
          id: 5,
          name: "Camion Benne Volvo A40",
          type: "truck",
          machine_type: "Camion benne",
          model: "A40G",
          serial_number: "TRUCK001",
          location: "Site A",
          status: "active",
          capacity: 41.0,
          purchase_date: "2023-06-15",
          last_maintenance: "2026-02-28",
          next_maintenance: "2026-03-28"
        },
        {
          id: 6,
          name: "Chargeuse CAT 950M",
          type: "loader",
          machine_type: "Chargeuse",
          model: "950M",
          serial_number: "LOAD001",
          location: "Site A",
          status: "active",
          capacity: 9.5,
          purchase_date: "2023-04-20",
          last_maintenance: "2026-03-05",
          next_maintenance: "2026-04-05"
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const loadOperationLogs = async () => {
    // Données de démonstration pour les journaux d'opérations
    const mockLogs = [
      {
        id: 1,
        date: '2026-03-10',
        equipment_id: 1,
        equipment_name: "Excavateur CAT 349",
        shift: 'jour',
        machine_type: "Pelle hydraulique",
        status: 'functional',
        breakdown_time: null,
        repair_status: null,
        resume_time: null,
        counter_start: 12500,
        counter_end: 12550,
        distance: 0,
        operator: 'Jean Dupont'
      },
      {
        id: 2,
        date: '2026-03-10',
        equipment_id: 5,
        equipment_name: "Camion Benne Volvo A40",
        shift: 'jour',
        machine_type: "Camion benne",
        status: 'panne',
        breakdown_time: '10:30',
        repair_status: 'en_reparation',
        resume_time: '14:00',
        counter_start: 8500,
        counter_end: 8650,
        distance: 150,
        operator: 'Marie Martin'
      },
      {
        id: 3,
        date: '2026-03-09',
        equipment_id: 2,
        equipment_name: "Percatrice Atlas Copco",
        shift: 'nuit',
        machine_type: "Foruse",
        status: 'functional',
        breakdown_time: null,
        repair_status: null,
        resume_time: null,
        counter_start: 5600,
        counter_end: 5650,
        distance: 0,
        operator: 'Pierre Durand'
      }
    ];
    setOperationLogs(mockLogs);
  };

  const handleAddEquipment = async () => {
    try {
      if (!newEquipment.name || !newEquipment.type || !newEquipment.model) {
        alert('Veuillez remplir les champs obligatoires');
        return;
      }

      const equipmentToAdd = {
        id: Date.now(),
        name: newEquipment.name,
        type: newEquipment.type,
        machine_type: newEquipment.type,
        model: newEquipment.model,
        serial_number: newEquipment.serial_number || `EQ${Date.now()}`,
        location: newEquipment.location || 'Site A',
        status: 'active',
        capacity: parseFloat(newEquipment.capacity) || 0,
        purchase_date: new Date().toISOString().split('T')[0],
        last_maintenance: null,
        next_maintenance: null
      };
      setEquipment([...equipment, equipmentToAdd]);
      setShowAddModal(false);
      setNewEquipment({
        name: '',
        type: '',
        model: '',
        serial_number: '',
        location: '',
        capacity: ''
      });
    } catch (error) {
      console.error("Erreur ajout équipement:", error);
    }
  };

  // Nouvelle fonction pour ajouter une opération quotidienne
  const handleAddOperation = async () => {
    try {
      if (!newOperation.equipment_id || !newOperation.date) {
        alert('Veuillez sélectionner un équipement et une date');
        return;
      }

      const selectedEquipment = equipment.find(e => e.id === parseInt(newOperation.equipment_id));
      
      const operationToAdd = {
        id: Date.now(),
        date: newOperation.date,
        equipment_id: parseInt(newOperation.equipment_id),
        equipment_name: selectedEquipment?.name || '',
        shift: newOperation.shift,
        machine_type: newOperation.machine_type || selectedEquipment?.machine_type || '',
        status: newOperation.status,
        breakdown_time: newOperation.breakdown_time || null,
        repair_status: newOperation.repair_status || null,
        resume_time: newOperation.resume_time || null,
        counter_start: parseFloat(newOperation.counter_start) || 0,
        counter_end: parseFloat(newOperation.counter_end) || 0,
        distance: parseFloat(newOperation.distance) || 0,
        operator: newOperation.operator || 'Non spécifié'
      };

      setOperationLogs([operationToAdd, ...operationLogs]);
      
      // Mettre à jour le statut de l'équipement si nécessaire
      if (newOperation.status === 'panne') {
        setEquipment(equipment.map(e => 
          e.id === parseInt(newOperation.equipment_id) 
            ? { ...e, status: 'offline' }
            : e
        ));
      }

      setShowOperationModal(false);
      setNewOperation({
        date: new Date().toISOString().split('T')[0],
        equipment_id: '',
        shift: 'jour',
        machine_type: '',
        status: 'functional',
        breakdown_time: '',
        repair_status: '',
        resume_time: '',
        counter_start: '',
        counter_end: '',
        distance: '',
        operator: ''
      });
      
      alert('Opération enregistrée avec succès!');
    } catch (error) {
      console.error("Erreur ajout opération:", error);
    }
  };

  const handleDeleteEquipment = async (equipmentId) => {
    try {
      if (window.confirm("Êtes-vous sûr de vouloir supprimer cet équipement ?")) {
        setEquipment(equipment.filter(e => e.id !== equipmentId));
      }
    } catch (error) {
      console.error("Erreur suppression équipement:", error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
      case 'functional':
        return 'var(--color-success)';
      case 'maintenance':
      case 'en_reparation':
        return 'var(--color-warning)';
      case 'offline':
      case 'hors_service':
      case 'panne':
        return 'var(--color-error)';
      default:
        return 'var(--color-muted-foreground)';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active':
      case 'functional':
        return 'Fonctionnel';
      case 'maintenance':
        return 'Maintenance';
      case 'offline':
      case 'hors_service':
        return 'Hors service';
      case 'panne':
        return 'Panne';
      case 'en_reparation':
        return 'En réparation';
      default:
        return status;
    }
  };

  const getMachineTypeLabel = (type) => {
    const types = {
      'excavator': 'Pelle hydraulique',
      'drill': 'Foruse',
      'conveyor': 'Convoyeur',
      'crusher': 'Concasseur',
      'truck': 'Camion benne',
      'loader': 'Chargeuse'
    };
    return types[type] || type;
  };

  return (
    <AppLayout userRole="admin" userName="JD" userSite="RomBat Exploration & Mines">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--color-foreground)" }}>
            Gestion des Équipements
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--color-muted-foreground)" }}>
            Suivi du parc matériel et des opérations quotidiennes
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="default"
            iconName="Plus"
            iconPosition="left"
            onClick={() => setShowAddModal(true)}
          >
            Nouvel Équipement
          </Button>
          <Button
            variant="outline"
            iconName="RefreshCw"
            iconPosition="left"
            onClick={() => {
              // relancer la requête API pour récupérer les équipements
              fetchEquipmentData();
            }}
          >
            Actualiser les données
          </Button>
          <Button
            variant="outline"
            iconName="Clipboard"
            iconPosition="left"
            onClick={() => setShowOperationModal(true)}
          >
            Saisie Quotidienne
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

      {/* Onglets */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('equipment')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'equipment' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Icon name="Truck" size={16} className="inline mr-2" />
          Parc Équipements
        </button>
        <button
          onClick={() => setActiveTab('operations')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'operations' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Icon name="Calendar" size={16} className="inline mr-2" />
          Suivi Quotidien
        </button>
      </div>

      {activeTab === 'equipment' ? (
        <>
          {/* Stats cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="p-4 rounded-xl border" style={{ background: "var(--color-card)" }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(56,161,105,0.12)" }}>
                  <Icon name="Truck" size={20} color="var(--color-success)" />
                </div>
                <div>
                  <p className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>Total</p>
                  <p className="text-xl font-bold" style={{ color: "var(--color-foreground)" }}>{equipment.length}</p>
                </div>
              </div>
            </div>
            <div className="p-4 rounded-xl border" style={{ background: "var(--color-card)" }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(56,161,105,0.12)" }}>
                  <Icon name="CheckCircle" size={20} color="var(--color-success)" />
                </div>
                <div>
                  <p className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>Fonctionnels</p>
                  <p className="text-xl font-bold" style={{ color: "var(--color-foreground)" }}>
                    {equipment.filter(e => e.status === 'active').length}
                  </p>
                </div>
              </div>
            </div>
            <div className="p-4 rounded-xl border" style={{ background: "var(--color-card)" }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(214,158,46,0.12)" }}>
                  <Icon name="Tool" size={20} color="var(--color-warning)" />
                </div>
                <div>
                  <p className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>Maintenance</p>
                  <p className="text-xl font-bold" style={{ color: "var(--color-foreground)" }}>
                    {equipment.filter(e => e.status === 'maintenance').length}
                  </p>
                </div>
              </div>
            </div>
            <div className="p-4 rounded-xl border" style={{ background: "var(--color-card)" }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(229,62,62,0.12)" }}>
                  <Icon name="XCircle" size={20} color="var(--color-error)" />
                </div>
                <div>
                  <p className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>Hors service</p>
                  <p className="text-xl font-bold" style={{ color: "var(--color-foreground)" }}>
                    {equipment.filter(e => e.status === 'offline').length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Equipment table */}
          <div className="rounded-xl border" style={{ background: "var(--color-card)" }}>
            <div className="p-4 border-b" style={{ borderColor: "var(--color-border)" }}>
              <h2 className="text-lg font-semibold" style={{ color: "var(--color-foreground)" }}>
                Liste des Équipements
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b" style={{ borderColor: "var(--color-border)" }}>
                    <th className="text-left p-4 text-sm font-medium" style={{ color: "var(--color-muted-foreground)" }}>Nom</th>
                    <th className="text-left p-4 text-sm font-medium" style={{ color: "var(--color-muted-foreground)" }}>Type</th>
                    <th className="text-left p-4 text-sm font-medium" style={{ color: "var(--color-muted-foreground)" }}>Modèle</th>
                    <th className="text-left p-4 text-sm font-medium" style={{ color: "var(--color-muted-foreground)" }}>Localisation</th>
                    <th className="text-left p-4 text-sm font-medium" style={{ color: "var(--color-muted-foreground)" }}>Capacité</th>
                    <th className="text-left p-4 text-sm font-medium" style={{ color: "var(--color-muted-foreground)" }}>Statut</th>
                    <th className="text-left p-4 text-sm font-medium" style={{ color: "var(--color-muted-foreground)" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="7" className="p-8 text-center" style={{ color: "var(--color-muted-foreground)" }}>
                        Chargement...
                      </td>
                    </tr>
                  ) : equipment.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="p-8 text-center" style={{ color: "var(--color-muted-foreground)" }}>
                        Aucun équipement trouvé
                      </td>
                    </tr>
                  ) : (
                    equipment.map((item) => (
                      <tr key={item.id} className="border-b" style={{ borderColor: "var(--color-border)" }}>
                        <td className="p-4">
                          <div>
                            <p className="font-medium" style={{ color: "var(--color-foreground)" }}>{item.name}</p>
                            <p className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>{item.serial_number}</p>
                          </div>
                        </td>
                        <td className="p-4" style={{ color: "var(--color-foreground)" }}>{getMachineTypeLabel(item.type)}</td>
                        <td className="p-4" style={{ color: "var(--color-foreground)" }}>{item.model}</td>
                        <td className="p-4" style={{ color: "var(--color-foreground)" }}>{item.location}</td>
                        <td className="p-4" style={{ color: "var(--color-foreground)" }}>{item.capacity} t/h</td>
                        <td className="p-4">
                          <span className="px-2 py-1 rounded-full text-xs font-medium" 
                            style={{ 
                              background: `${getStatusColor(item.status)}15`,
                              color: getStatusColor(item.status)
                            }}>
                            {getStatusText(item.status)}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" iconName="Edit" />
                            <Button variant="ghost" size="sm" iconName="Settings" />
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              iconName="Trash2" 
                              onClick={() => handleDeleteEquipment(item.id)}
                            />
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Vue des opérations quotidiennes */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="p-4 rounded-xl border" style={{ background: "var(--color-card)" }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(56,161,105,0.12)" }}>
                  <Icon name="Clipboard" size={20} color="var(--color-success)" />
                </div>
                <div>
                  <p className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>Total Saisies</p>
                  <p className="text-xl font-bold" style={{ color: "var(--color-foreground)" }}>{operationLogs.length}</p>
                </div>
              </div>
            </div>
            <div className="p-4 rounded-xl border" style={{ background: "var(--color-card)" }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(56,161,105,0.12)" }}>
                  <Icon name="CheckCircle" size={20} color="var(--color-success)" />
                </div>
                <div>
                  <p className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>Fonctionnels</p>
                  <p className="text-xl font-bold" style={{ color: "var(--color-foreground)" }}>
                    {operationLogs.filter(o => o.status === 'functional').length}
                  </p>
                </div>
              </div>
            </div>
            <div className="p-4 rounded-xl border" style={{ background: "var(--color-card)" }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(229,62,62,0.12)" }}>
                  <Icon name="AlertTriangle" size={20} color="var(--color-error)" />
                </div>
                <div>
                  <p className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>Pannes</p>
                  <p className="text-xl font-bold" style={{ color: "var(--color-foreground)" }}>
                    {operationLogs.filter(o => o.status === 'panne').length}
                  </p>
                </div>
              </div>
            </div>
            <div className="p-4 rounded-xl border" style={{ background: "var(--color-card)" }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(59,130,246,0.12)" }}>
                  <Icon name="Route" size={20} color="#3b82f6" />
                </div>
                <div>
                  <p className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>Distance Totale</p>
                  <p className="text-xl font-bold" style={{ color: "var(--color-foreground)" }}>
                    {operationLogs.reduce((sum, o) => sum + o.distance, 0).toFixed(1)} km
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Tableau des opérations quotidiennes */}
          <div className="rounded-xl border" style={{ background: "var(--color-card)" }}>
            <div className="p-4 border-b" style={{ borderColor: "var(--color-border)" }}>
              <h2 className="text-lg font-semibold" style={{ color: "var(--color-foreground)" }}>
                Historique des Opérations Quotidiennes
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b" style={{ borderColor: "var(--color-border)" }}>
                    <th className="text-left p-3 text-xs font-medium" style={{ color: "var(--color-muted-foreground)" }}>Date</th>
                    <th className="text-left p-3 text-xs font-medium" style={{ color: "var(--color-muted-foreground)" }}>Poste</th>
                    <th className="text-left p-3 text-xs font-medium" style={{ color: "var(--color-muted-foreground)" }}>Équipement</th>
                    <th className="text-left p-3 text-xs font-medium" style={{ color: "var(--color-muted-foreground)" }}>Type Machine</th>
                    <th className="text-left p-3 text-xs font-medium" style={{ color: "var(--color-muted-foreground)" }}>État</th>
                    <th className="text-left p-3 text-xs font-medium" style={{ color: "var(--color-muted-foreground)" }}>Heure Panne</th>
                    <th className="text-left p-3 text-xs font-medium" style={{ color: "var(--color-muted-foreground)" }}>Réparation</th>
                    <th className="text-left p-3 text-xs font-medium" style={{ color: "var(--color-muted-foreground)" }}>Reprise</th>
                    <th className="text-left p-3 text-xs font-medium" style={{ color: "var(--color-muted-foreground)" }}>Compteur Début</th>
                    <th className="text-left p-3 text-xs font-medium" style={{ color: "var(--color-muted-foreground)" }}>Compteur Fin</th>
                    <th className="text-left p-3 text-xs font-medium" style={{ color: "var(--color-muted-foreground)" }}>Distance</th>
                  </tr>
                </thead>
                <tbody>
                  {operationLogs.length === 0 ? (
                    <tr>
                      <td colSpan="11" className="p-8 text-center" style={{ color: "var(--color-muted-foreground)" }}>
                        Aucune opération enregistrée
                      </td>
                    </tr>
                  ) : (
                    operationLogs.map((log) => (
                      <tr key={log.id} className="border-b" style={{ borderColor: "var(--color-border)" }}>
                        <td className="p-3 text-sm" style={{ color: "var(--color-foreground)" }}>{log.date}</td>
                        <td className="p-3 text-sm" style={{ color: "var(--color-foreground)" }}>
                          <span className={`px-2 py-0.5 rounded text-xs ${log.shift === 'jour' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}`}>
                            {log.shift === 'jour' ? 'Jour' : 'Nuit'}
                          </span>
                        </td>
                        <td className="p-3 text-sm" style={{ color: "var(--color-foreground)" }}>{log.equipment_name}</td>
                        <td className="p-3 text-sm" style={{ color: "var(--color-foreground)" }}>{log.machine_type}</td>
                        <td className="p-3 text-sm">
                          <span className="px-2 py-1 rounded-full text-xs font-medium" 
                            style={{ 
                              background: `${getStatusColor(log.status)}15`,
                              color: getStatusColor(log.status)
                            }}>
                            {getStatusText(log.status)}
                          </span>
                        </td>
                        <td className="p-3 text-sm" style={{ color: "var(--color-foreground)" }}>{log.breakdown_time || '-'}</td>
                        <td className="p-3 text-sm">
                          {log.repair_status ? (
                            <span className="px-2 py-1 rounded-full text-xs font-medium" 
                              style={{ 
                                background: `${getStatusColor(log.repair_status)}15`,
                                color: getStatusColor(log.repair_status)
                              }}>
                              {getStatusText(log.repair_status)}
                            </span>
                          ) : '-'}
                        </td>
                        <td className="p-3 text-sm" style={{ color: "var(--color-foreground)" }}>{log.resume_time || '-'}</td>
                        <td className="p-3 text-sm" style={{ color: "var(--color-foreground)" }}>{log.counter_start.toLocaleString()}</td>
                        <td className="p-3 text-sm" style={{ color: "var(--color-foreground)" }}>{log.counter_end.toLocaleString()}</td>
                        <td className="p-3 text-sm" style={{ color: "var(--color-foreground)" }}>{log.distance} km</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Modal Ajout Équipement */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="rounded-xl p-6 w-full max-w-md" style={{ background: "var(--color-card)" }}>
            <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--color-foreground)" }}>
              Ajouter un équipement
            </h3>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Nom de l'équipement *"
                value={newEquipment.name}
                onChange={(e) => setNewEquipment({...newEquipment, name: e.target.value})}
                className="w-full p-2 rounded border"
                style={{ borderColor: "var(--color-border)", background: "var(--color-background)", color: "var(--color-foreground)" }}
              />
              <select 
                className="w-full p-2 rounded border" 
                style={{ borderColor: "var(--color-border)", background: "var(--color-background)", color: "var(--color-foreground)" }}
                value={newEquipment.type}
                onChange={(e) => setNewEquipment({...newEquipment, type: e.target.value})}
              >
                <option value="">Type...</option>
                <option value="excavator">Pelle hydraulique</option>
                <option value="drill">Foruse</option>
                <option value="conveyor">Convoyeur</option>
                <option value="crusher">Concasseur</option>
                <option value="truck">Camion benne</option>
                <option value="loader">Chargeuse</option>
              </select>
              <input
                type="text"
                placeholder="Modèle *"
                value={newEquipment.model}
                onChange={(e) => setNewEquipment({...newEquipment, model: e.target.value})}
                className="w-full p-2 rounded border"
                style={{ borderColor: "var(--color-border)", background: "var(--color-background)", color: "var(--color-foreground)" }}
              />
              <input
                type="text"
                placeholder="Numéro de série"
                value={newEquipment.serial_number}
                onChange={(e) => setNewEquipment({...newEquipment, serial_number: e.target.value})}
                className="w-full p-2 rounded border"
                style={{ borderColor: "var(--color-border)", background: "var(--color-background)", color: "var(--color-foreground)" }}
              />
              <input
                type="text"
                placeholder="Localisation"
                value={newEquipment.location}
                onChange={(e) => setNewEquipment({...newEquipment, location: e.target.value})}
                className="w-full p-2 rounded border"
                style={{ borderColor: "var(--color-border)", background: "var(--color-background)", color: "var(--color-foreground)" }}
              />
              <input
                type="number"
                placeholder="Capacité (tonnes/heure)"
                value={newEquipment.capacity}
                onChange={(e) => setNewEquipment({...newEquipment, capacity: e.target.value})}
                className="w-full p-2 rounded border"
                style={{ borderColor: "var(--color-border)", background: "var(--color-background)", color: "var(--color-foreground)" }}
              />
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setShowAddModal(false)}>
                  Annuler
                </Button>
                <Button variant="default" onClick={handleAddEquipment}>
                  Ajouter
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Saisie Quotidienne */}
      {showOperationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto" style={{ background: "var(--color-card)" }}>
            <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--color-foreground)" }}>
              Saisie Quotidienne des Équipements
            </h3>
            <div className="space-y-4">
              {/* Date et Poste */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-foreground)" }}>
                    Date *
                  </label>
                  <input
                    type="date"
                    value={newOperation.date}
                    onChange={(e) => setNewOperation({...newOperation, date: e.target.value})}
                    className="w-full p-2 rounded border"
                    style={{ borderColor: "var(--color-border)", background: "var(--color-background)", color: "var(--color-foreground)" }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-foreground)" }}>
                    Poste *
                  </label>
                  <select
                    value={newOperation.shift}
                    onChange={(e) => setNewOperation({...newOperation, shift: e.target.value})}
                    className="w-full p-2 rounded border"
                    style={{ borderColor: "var(--color-border)", background: "var(--color-background)", color: "var(--color-foreground)" }}
                  >
                    <option value="jour">Jour</option>
                    <option value="nuit">Nuit</option>
                  </select>
                </div>
              </div>

              {/* Équipement et Type machine */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-foreground)" }}>
                    Équipement *
                  </label>
                  <select
                    value={newOperation.equipment_id}
                    onChange={(e) => {
                      const selected = equipment.find(eq => eq.id === parseInt(e.target.value));
                      setNewOperation({
                        ...newOperation, 
                        equipment_id: e.target.value,
                        machine_type: selected?.machine_type || ''
                      });
                    }}
                    className="w-full p-2 rounded border"
                    style={{ borderColor: "var(--color-border)", background: "var(--color-background)", color: "var(--color-foreground)" }}
                  >
                    <option value="">Sélectionner...</option>
                    {equipment.map(eq => (
                      <option key={eq.id} value={eq.id}>{eq.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-foreground)" }}>
                    Type de machine
                  </label>
                  <input
                    type="text"
                    value={newOperation.machine_type}
                    onChange={(e) => setNewOperation({...newOperation, machine_type: e.target.value})}
                    className="w-full p-2 rounded border"
                    style={{ borderColor: "var(--color-border)", background: "var(--color-background)", color: "var(--color-foreground)" }}
                    placeholder="Ex: Pelle hydraulique"
                  />
                </div>
              </div>

              {/* Opérateur */}
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-foreground)" }}>
                  Opérateur
                </label>
                <input
                  type="text"
                  value={newOperation.operator}
                  onChange={(e) => setNewOperation({...newOperation, operator: e.target.value})}
                  className="w-full p-2 rounded border"
                  style={{ borderColor: "var(--color-border)", background: "var(--color-background)", color: "var(--color-foreground)" }}
                  placeholder="Nom de l'opérateur"
                />
              </div>

              {/* État de l'équipement */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "var(--color-foreground)" }}>
                  État de l'équipement *
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="status"
                      value="functional"
                      checked={newOperation.status === 'functional'}
                      onChange={(e) => setNewOperation({...newOperation, status: e.target.value})}
                    />
                    <span style={{ color: "var(--color-success)" }}>Fonctionnel</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="status"
                      value="panne"
                      checked={newOperation.status === 'panne'}
                      onChange={(e) => setNewOperation({...newOperation, status: e.target.value})}
                    />
                    <span style={{ color: "var(--color-error)" }}>Panne</span>
                  </label>
                </div>
              </div>

              {/* Champs de panne (conditionnels) */}
              {newOperation.status === 'panne' && (
                <div className="p-4 rounded-lg border" style={{ borderColor: "var(--color-error)", background: "rgba(229,62,62,0.05)" }}>
                  <h4 className="font-medium mb-3" style={{ color: "var(--color-error)" }}>Informations sur la panne</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-foreground)" }}>
                        Heure de panne
                      </label>
                      <input
                        type="time"
                        value={newOperation.breakdown_time}
                        onChange={(e) => setNewOperation({...newOperation, breakdown_time: e.target.value})}
                        className="w-full p-2 rounded border"
                        style={{ borderColor: "var(--color-border)", background: "var(--color-background)", color: "var(--color-foreground)" }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-foreground)" }}>
                        Statut réparation
                      </label>
                      <select
                        value={newOperation.repair_status}
                        onChange={(e) => setNewOperation({...newOperation, repair_status: e.target.value})}
                        className="w-full p-2 rounded border"
                        style={{ borderColor: "var(--color-border)", background: "var(--color-background)", color: "var(--color-foreground)" }}
                      >
                        <option value="">Sélectionner...</option>
                        <option value="en_reparation">En réparation</option>
                        <option value="hors_service">Hors service</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-foreground)" }}>
                        Heure de reprise
                      </label>
                      <input
                        type="time"
                        value={newOperation.resume_time}
                        onChange={(e) => setNewOperation({...newOperation, resume_time: e.target.value})}
                        className="w-full p-2 rounded border"
                        style={{ borderColor: "var(--color-border)", background: "var(--color-background)", color: "var(--color-foreground)" }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Compteurs et Distance */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-foreground)" }}>
                    Compteur Début
                  </label>
                  <input
                    type="number"
                    value={newOperation.counter_start}
                    onChange={(e) => setNewOperation({...newOperation, counter_start: e.target.value})}
                    className="w-full p-2 rounded border"
                    style={{ borderColor: "var(--color-border)", background: "var(--color-background)", color: "var(--color-foreground)" }}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-foreground)" }}>
                    Compteur Fin
                  </label>
                  <input
                    type="number"
                    value={newOperation.counter_end}
                    onChange={(e) => setNewOperation({...newOperation, counter_end: e.target.value})}
                    className="w-full p-2 rounded border"
                    style={{ borderColor: "var(--color-border)", background: "var(--color-background)", color: "var(--color-foreground)" }}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-foreground)" }}>
                    Distance parcourue (km)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={newOperation.distance}
                    onChange={(e) => setNewOperation({...newOperation, distance: e.target.value})}
                    className="w-full p-2 rounded border"
                    style={{ borderColor: "var(--color-border)", background: "var(--color-background)", color: "var(--color-foreground)" }}
                    placeholder="0.0"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => setShowOperationModal(false)}>
                  Annuler
                </Button>
                <Button variant="default" onClick={handleAddOperation}>
                  Enregistrer
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
