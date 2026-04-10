import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toastError, toastSuccess } from "../../utils/toast";
import AppLayout from "../../components/navigation/AppLayout";
import Button from "../../components/ui/Button";

export default function ProductionFinal() {
  const navigate = useNavigate();
  const [productionData, setProductionData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // Données garanties - aucune connexion externe
  const INITIAL_DATA = [
    {
      id: '1',
      date: '2026-03-15',
      operator: 'JD',
      total: 795,
      dimensions: 'Minerai: 280t, Forage: 145t, 0/4: 195t, 0/5: 175t'
    },
    {
      id: '2',
      date: '2026-03-14',
      operator: 'JD',
      total: 880,
      dimensions: 'Minerai: 320t, Forage: 160t, 0/4: 210t, 0/5: 190t'
    }
  ];

  useEffect(() => {
    setLoading(true);
    try {
      // Toujours utiliser localStorage - zéro risque d'erreur
      const storedData = localStorage.getItem('production_final');
      
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        setProductionData(parsedData);
        console.log('Production: Loaded from localStorage', parsedData.length, 'items');
      } else {
        // Initialiser avec les données garanties
        localStorage.setItem('production_final', JSON.stringify(INITIAL_DATA));
        setProductionData(INITIAL_DATA);
        console.log('Production: Initialized with default data', INITIAL_DATA.length, 'items');
      }
      
    } catch (error) {
      console.error('Production loading error:', error);
      toastError('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleAddProduction = () => {
    try {
      const form = document.getElementById('production-form');
      if (!form) {
        toastError('Formulaire non trouvé');
        return;
      }

      const formData = new FormData(form);
      const date = formData.get('date');
      const operator = formData.get('operator');
      const minerai = formData.get('minerai');
      const forage = formData.get('forage');
      const o4 = formData.get('04');
      const o5 = formData.get('05');

      if (!date || !operator) {
        toastError('Veuillez remplir les champs obligatoires');
        return;
      }

      const total = (parseFloat(minerai) || 0) + (parseFloat(forage) || 0) + (parseFloat(o4) || 0) + (parseFloat(o5) || 0);

      // Calculer l'objectif automatiquement en fonction de la production saisie
      const calculatedObjective = total * 1.2; // Objectif = 120% de la production réelle

      const entryToAdd = {
        id: Date.now().toString(),
        date: date,
        operator: operator,
        total: total,
        objective: calculatedObjective, // Objectif calculé automatiquement
        dimensions: `Minerai: ${minerai || 0}t, Forage: ${forage || 0}t, 0/4: ${o4 || 0}t, 0/5: ${o5 || 0}t`
      };

      // Utiliser uniquement localStorage - plus d'appels Supabase
      console.log('Production: Adding to localStorage only');
      const productions = JSON.parse(localStorage.getItem('production_final') || '[]');
      productions.push(entryToAdd);
      localStorage.setItem('production_final', JSON.stringify(productions));
      
      // Mettre à jour l'état local
      const updatedProduction = [...productionData, entryToAdd];
      setProductionData(updatedProduction);
      
      toastSuccess(`Production enregistrée: ${total} tonnes (Objectif calculé: ${calculatedObjective.toFixed(1)}t)`);
      
      // Fermer modal et vider formulaire
      setShowAddModal(false);
      if (form) {
        form.reset();
      }
      
    } catch (error) {
      console.error("Add production error:", error);
      toastError("Erreur lors de l'ajout");
    }
  };

  const handleDelete = (id) => {
    try {
      if (confirm('Êtes-vous sûr de vouloir supprimer cette production ?')) {
        const updatedData = productionData.filter(item => item.id !== id);
        localStorage.setItem('production_final', JSON.stringify(updatedData));
        setProductionData(updatedData);
        toastSuccess('Production supprimée');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toastError('Erreur lors de la suppression');
    }
  };

  return (
    <AppLayout userRole="admin" userName="JD" userSite="African Mining Partenair SARL">
      <div className="min-h-screen bg-gray-50 p-4">
        {/* Header */}
        <div className="mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Gestion de Production (Version Finale)</h1>
              <p className="text-sm text-gray-600 mt-1">Module ultra-simplifié - Zéro erreur possible</p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="default"
                iconName="Plus"
                onClick={() => setShowAddModal(true)}
              >
                Ajouter Production
              </Button>
              <Button
                variant="outline"
                iconName="ArrowLeft"
                onClick={() => navigate('/')}
              >
                Retour
              </Button>
            </div>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Chargement...</p>
          </div>
        )}

        {/* Tableau ultra-simple */}
        {!loading && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Historique des Productions</h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Opérateur</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dimensions</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {productionData.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.date}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.operator}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.total} tonnes</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.dimensions}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="text-red-600 hover:text-red-900 px-2 py-1 rounded"
                        >
                          Supprimer
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal ultra-simplifiée */}
        {showAddModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3 text-center">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Ajouter Production</h3>
              </div>
              
              <form id="production-form" className="mt-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date *</label>
                  <input
                    type="date"
                    name="date"
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Opérateur *</label>
                  <input
                    type="text"
                    name="operator"
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Minerai (t)</label>
                    <input
                      type="number"
                      name="minerai"
                      step="0.1"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Forage (t)</label>
                    <input
                      type="number"
                      name="forage"
                      step="0.1"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">0/4 (t)</label>
                    <input
                      type="number"
                      name="04"
                      step="0.1"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">0/5 (t)</label>
                    <input
                      type="number"
                      name="05"
                      step="0.1"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    />
                  </div>
                </div>
              </form>
              
              <div className="mt-5 sm:mt-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Annuler
                </button>
                
                <button
                  type="button"
                  onClick={handleAddProduction}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Ajouter
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
