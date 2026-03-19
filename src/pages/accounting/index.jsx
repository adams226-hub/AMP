import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import AppLayout from "components/navigation/AppLayout";
import Icon from "components/AppIcon";
import Button from "components/ui/Button";

export default function Accounting() {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  
  const [newTransaction, setNewTransaction] = useState({
    date: '',
    type: 'income',
    category: '',
    description: '',
    amount: '',
    reference: '',
    client_supplier: '',
    payment_method: '',
    notes: ''
  });

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    const mockData = [
      {
        id: 1,
        date: "2026-03-05",
        type: "expense",
        category: "Carburant",
        description: "Achat carburant Site A",
        amount: 187.50,
        status: "paid",
        reference: "CAR-2026-03-001"
      },
      {
        id: 2,
        date: "2026-03-04",
        type: "expense",
        category: "Maintenance",
        description: "Maintenance excavateur CAT 349",
        amount: 1250.00,
        status: "pending",
        reference: "MAINT-2026-03-001"
      },
      {
        id: 3,
        date: "2026-03-03",
        type: "income",
        category: "Vente minerais",
        description: "Vente or - Mars 2026",
        amount: 45000.00,
        status: "paid",
        reference: "VENTE-2026-03-001"
      },
      {
        id: 4,
        date: "2026-03-02",
        type: "expense",
        category: "Salaires",
        description: "Paie mensuelle opérateurs",
        amount: 8500.00,
        status: "paid",
        reference: "SALAIRE-2026-03-001"
      }
    ];
    setTransactions(mockData);
    setLoading(false);
  };

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const netProfit = totalIncome - totalExpenses;
  const pendingExpenses = transactions.filter(t => t.type === 'expense' && t.status === 'pending').reduce((sum, t) => sum + t.amount, 0);

  // Données pour le graphique circulaire des dépenses par catégorie
  const expensesByCategory = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      if (!acc[t.category]) {
        acc[t.category] = 0;
      }
      acc[t.category] += t.amount;
      return acc;
    }, {});

  const pieChartData = Object.entries(expensesByCategory).map(([category, amount], index) => ({
    name: category,
    value: Math.round(amount * 100) / 100,
    color: ['#2C5530', '#D69E2E', '#E53E3E', '#3182CE', '#805AD5'][index % 5]
  }));

  // Données pour le graphique d'évolution mensuelle
  const monthlyData = transactions.reduce((acc, t) => {
    const date = new Date(t.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const monthName = date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });

    if (!acc[monthKey]) {
      acc[monthKey] = { month: monthName, revenus: 0, depenses: 0 };
    }

    if (t.type === 'income') {
      acc[monthKey].revenus += t.amount;
    } else {
      acc[monthKey].depenses += t.amount;
    }

    return acc;
  }, {});

  const lineChartData = Object.values(monthlyData).sort((a, b) => {
    const dateA = new Date(a.month + ' 01');
    const dateB = new Date(b.month + ' 01');
    return dateA - dateB;
  });

  const handleAddTransaction = async () => {
    try {
      if (!newTransaction.date || !newTransaction.category || !newTransaction.description || !newTransaction.amount) {
        alert('Veuillez remplir les champs obligatoires');
        return;
      }

      const transactionToAdd = {
        id: Date.now(),
        date: newTransaction.date,
        type: newTransaction.type,
        category: newTransaction.category,
        description: newTransaction.description,
        amount: parseFloat(newTransaction.amount),
        reference: newTransaction.reference,
        client_supplier: newTransaction.client_supplier,
        payment_method: newTransaction.payment_method,
        status: 'pending',
        notes: newTransaction.notes
      };

      setTransactions([transactionToAdd, ...transactions]);
      
      setNewTransaction({
        date: '',
        type: 'income',
        category: '',
        description: '',
        amount: '',
        reference: '',
        client_supplier: '',
        payment_method: '',
        notes: ''
      });
      
      setShowAddModal(false);
      alert(`Transaction enregistrée: ${newTransaction.type === 'income' ? '+' : '-'}${parseFloat(newTransaction.amount).toFixed(2)} €`);
      
    } catch (error) {
      console.error("Erreur ajout transaction:", error);
      alert("Erreur lors de l'enregistrement de la transaction");
    }
  };

  const handleDeleteTransaction = async (transactionId) => {
    try {
      if (confirm('Êtes-vous sûr de vouloir supprimer cette transaction ?')) {
        setTransactions(transactions.filter(t => t.id !== transactionId));
        alert('Transaction supprimée avec succès');
      }
    } catch (error) {
      console.error("Erreur suppression transaction:", error);
      alert("Erreur lors de la suppression de la transaction");
    }
  };

  const getTypeColor = (type) => {
    return type === 'income' ? 'var(--color-success)' : 'var(--color-error)';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'var(--color-success)';
      case 'pending': return 'var(--color-warning)';
      case 'overdue': return 'var(--color-error)';
      default: return 'var(--color-muted-foreground)';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'paid': return 'Payé';
      case 'pending': return 'En attente';
      case 'overdue': return 'En retard';
      default: return status;
    }
  };

  return (
    <AppLayout userRole="admin" userName="JD" userSite="RomBat Exploration & Mines">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--color-foreground)" }}>
            Comptabilité
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--color-muted-foreground)" }}>
            Gestion financière et suivi des transactions
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="default"
            iconName="Plus"
            iconPosition="left"
            onClick={() => setShowAddModal(true)}
          >
            Ajouter Transaction
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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="p-4 rounded-xl border" style={{ background: "var(--color-card)" }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(56,161,105,0.12)" }}>
              <Icon name="TrendingUp" size={20} color="var(--color-success)" />
            </div>
            <div>
              <p className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>Revenus</p>
              <p className="text-xl font-bold" style={{ color: "var(--color-success)" }}>{totalIncome.toFixed(2)} €</p>
            </div>
          </div>
        </div>
        <div className="p-4 rounded-xl border" style={{ background: "var(--color-card)" }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(229,62,62,0.12)" }}>
              <Icon name="TrendingDown" size={20} color="var(--color-error)" />
            </div>
            <div>
              <p className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>Dépenses</p>
              <p className="text-xl font-bold" style={{ color: "var(--color-error)" }}>{totalExpenses.toFixed(2)} €</p>
            </div>
          </div>
        </div>
        <div className="p-4 rounded-xl border" style={{ background: "var(--color-card)" }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(49,130,206,0.12)" }}>
              <Icon name="DollarSign" size={20} color="#3182CE" />
            </div>
            <div>
              <p className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>Bénéfice Net</p>
              <p className="text-xl font-bold" style={{ color: netProfit >= 0 ? "#3182CE" : "var(--color-error)" }}>
                {netProfit.toFixed(2)} €
              </p>
            </div>
          </div>
        </div>
        <div className="p-4 rounded-xl border" style={{ background: "var(--color-card)" }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(214,158,46,0.12)" }}>
              <Icon name="Clock" size={20} color="var(--color-warning)" />
            </div>
            <div>
              <p className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>En Attente</p>
              <p className="text-xl font-bold" style={{ color: "var(--color-warning)" }}>{pendingExpenses.toFixed(2)} €</p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border" style={{ background: "var(--color-card)" }}>
        <div className="p-4 border-b" style={{ borderColor: "var(--color-border)" }}>
          <h2 className="text-lg font-semibold" style={{ color: "var(--color-foreground)" }}>
            Historique des Transactions
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b" style={{ borderColor: "var(--color-border)" }}>
                <th className="text-left p-4 text-sm font-medium" style={{ color: "var(--color-muted-foreground)" }}>Date</th>
                <th className="text-left p-4 text-sm font-medium" style={{ color: "var(--color-muted-foreground)" }}>Type</th>
                <th className="text-left p-4 text-sm font-medium" style={{ color: "var(--color-muted-foreground)" }}>Catégorie</th>
                <th className="text-left p-4 text-sm font-medium" style={{ color: "var(--color-muted-foreground)" }}>Description</th>
                <th className="text-left p-4 text-sm font-medium" style={{ color: "var(--color-muted-foreground)" }}>Montant</th>
                <th className="text-left p-4 text-sm font-medium" style={{ color: "var(--color-muted-foreground)" }}>Statut</th>
                <th className="text-left p-4 text-sm font-medium" style={{ color: "var(--color-muted-foreground)" }}>Référence</th>
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
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan="8" className="p-8 text-center" style={{ color: "var(--color-muted-foreground)" }}>
                    Aucune transaction trouvée
                  </td>
                </tr>
              ) : (
                transactions.map((item) => (
                  <tr key={item.id} className="border-b" style={{ borderColor: "var(--color-border)" }}>
                    <td className="p-4" style={{ color: "var(--color-foreground)" }}>{item.date}</td>
                    <td className="p-4">
                      <span className="px-2 py-1 rounded-full text-xs font-medium" 
                        style={{ 
                          background: `${getTypeColor(item.type)}15`,
                          color: getTypeColor(item.type)
                        }}>
                        {item.type === 'income' ? 'Revenu' : 'Dépense'}
                      </span>
                    </td>
                    <td className="p-4" style={{ color: "var(--color-foreground)" }}>{item.category}</td>
                    <td className="p-4" style={{ color: "var(--color-foreground)" }}>{item.description}</td>
                    <td className="p-4" style={{ color: getTypeColor(item.type), fontWeight: 'bold' }}>
                      {item.type === 'income' ? '+' : '-'}{item.amount.toFixed(2)}
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-1 rounded-full text-xs font-medium" 
                        style={{ 
                          background: `${getStatusColor(item.status)}15`,
                          color: getStatusColor(item.status)
                        }}>
                        {getStatusText(item.status)}
                      </span>
                    </td>
                    <td className="p-4" style={{ color: "var(--color-foreground)" }}>{item.reference}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" iconName="Eye" />
                        <Button variant="ghost" size="sm" iconName="Edit" />
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          iconName="Trash2" 
                          onClick={() => handleDeleteTransaction(item.id)}
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="rounded-xl border p-6" style={{ background: "var(--color-card)" }}>
          <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--color-foreground)" }}>
            Répartition des Dépenses
          </h3>
          <div className="h-64">
            {pieChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} €`, 'Montant']} />
                </PieChart>
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
            Évolution Mensuelle
          </h3>
          <div className="h-64">
            {lineChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}k€`} />
                  <Tooltip formatter={(value) => [`${value.toLocaleString('fr-FR')} €`, '']} />
                  <Legend />
                  <Line type="monotone" dataKey="revenus" stroke="#2C5530" strokeWidth={2} name="Revenus" />
                  <Line type="monotone" dataKey="depenses" stroke="#E53E3E" strokeWidth={2} name="Dépenses" />
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

      {/* Modal Ajout Transaction */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="rounded-xl p-6 w-full max-w-2xl" style={{ background: "var(--color-card)" }}>
            <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--color-foreground)" }}>
              Ajouter une Transaction
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-foreground)" }}>
                    Date *
                  </label>
                  <input
                    type="date"
                    value={newTransaction.date}
                    onChange={(e) => setNewTransaction({...newTransaction, date: e.target.value})}
                    className="w-full p-2 rounded border"
                    style={{ 
                      borderColor: "var(--color-border)",
                      background: "var(--color-background)",
                      color: "var(--color-foreground)"
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-foreground)" }}>
                    Type *
                  </label>
                  <select
                    value={newTransaction.type}
                    onChange={(e) => setNewTransaction({...newTransaction, type: e.target.value})}
                    className="w-full p-2 rounded border"
                    style={{ 
                      borderColor: "var(--color-border)",
                      background: "var(--color-background)",
                      color: "var(--color-foreground)"
                    }}
                  >
                    <option value="income">Revenu</option>
                    <option value="expense">Dépense</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-foreground)" }}>
                    Catégorie *
                  </label>
                  <input
                    type="text"
                    value={newTransaction.category}
                    onChange={(e) => setNewTransaction({...newTransaction, category: e.target.value})}
                    className="w-full p-2 rounded border"
                    style={{ 
                      borderColor: "var(--color-border)",
                      background: "var(--color-background)",
                      color: "var(--color-foreground)"
                    }}
                    placeholder="ex: Ventes matériaux"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-foreground)" }}>
                    Montant (€) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newTransaction.amount}
                    onChange={(e) => setNewTransaction({...newTransaction, amount: e.target.value})}
                    className="w-full p-2 rounded border"
                    style={{ 
                      borderColor: "var(--color-border)",
                      background: "var(--color-background)",
                      color: "var(--color-foreground)"
                    }}
                    placeholder="ex: 1250.00"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-foreground)" }}>
                  Description *
                </label>
                <input
                  type="text"
                  value={newTransaction.description}
                  onChange={(e) => setNewTransaction({...newTransaction, description: e.target.value})}
                  className="w-full p-2 rounded border"
                  style={{ 
                    borderColor: "var(--color-border)",
                    background: "var(--color-background)",
                    color: "var(--color-foreground)"
                  }}
                  placeholder="ex: Vente gravillons Client A"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-foreground)" }}>
                    Référence
                  </label>
                  <input
                    type="text"
                    value={newTransaction.reference}
                    onChange={(e) => setNewTransaction({...newTransaction, reference: e.target.value})}
                    className="w-full p-2 rounded border"
                    style={{ 
                      borderColor: "var(--color-border)",
                      background: "var(--color-background)",
                      color: "var(--color-foreground)"
                    }}
                    placeholder="ex: FACT-2026-03-001"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-foreground)" }}>
                    Client/Fournisseur
                  </label>
                  <input
                    type="text"
                    value={newTransaction.client_supplier}
                    onChange={(e) => setNewTransaction({...newTransaction, client_supplier: e.target.value})}
                    className="w-full p-2 rounded border"
                    style={{ 
                      borderColor: "var(--color-border)",
                      background: "var(--color-background)",
                      color: "var(--color-foreground)"
                    }}
                    placeholder="ex: Société ABC"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-foreground)" }}>
                  Moyen de paiement
                </label>
                <select
                  value={newTransaction.payment_method}
                  onChange={(e) => setNewTransaction({...newTransaction, payment_method: e.target.value})}
                  className="w-full p-2 rounded border"
                  style={{ 
                    borderColor: "var(--color-border)",
                    background: "var(--color-background)",
                    color: "var(--color-foreground)"
                  }}
                >
                  <option value="">Sélectionner...</option>
                  <option value="virement">Virement bancaire</option>
                  <option value="cheque">Chèque</option>
                  <option value="espece">Espèces</option>
                  <option value="carte">Carte bancaire</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-foreground)" }}>
                  Notes
                </label>
                <textarea
                  value={newTransaction.notes}
                  onChange={(e) => setNewTransaction({...newTransaction, notes: e.target.value})}
                  className="w-full p-2 rounded border"
                  style={{ 
                    borderColor: "var(--color-border)",
                    background: "var(--color-background)",
                    color: "var(--color-foreground)"
                  }}
                  rows="3"
                  placeholder="Notes optionnelles..."
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button
                variant="default"
                onClick={handleAddTransaction}
              >
                Ajouter
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowAddModal(false)}
              >
                Annuler
              </Button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
