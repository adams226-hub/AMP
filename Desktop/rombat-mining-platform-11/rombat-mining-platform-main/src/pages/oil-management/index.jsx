import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../../components/navigation/AppLayout';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import { miningService } from '../../config/supabase';
import { useAuth } from '../../context/AuthContext';
import { toastSuccess, toastError } from '../../utils/toast';

export default function OilManagement() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [equipment, setEquipment] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [editTx, setEditTx] = useState(null);
  const [transactionType, setTransactionType] = useState('entry');
  const [newTransaction, setNewTransaction] = useState({
    date: new Date().toISOString().split('T')[0],
    equipment_id: '',
    quantity: '',
    site: 'Koro',
    notes: ''
  });

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [eqRes, txRes] = await Promise.all([
        miningService.getEquipment(),
        miningService.getOilTransactions(),
      ]);
      setEquipment(eqRes.data || []);
      setTransactions(txRes.data || []);
      if (!newTransaction.equipment_id && eqRes.data?.length > 0) {
        setNewTransaction(prev => ({ ...prev, equipment_id: String(eqRes.data[0].id) }));
      }
    } catch (err) {
      toastError('Erreur chargement données');
    } finally {
      setLoading(false);
    }
  };

  // Calcul du stock par équipement
  const buildSummary = () => {
    return equipment.map(eq => {
      const eqTx = transactions.filter(tx => String(tx.equipment_id) === String(eq.id));
      const totalEntries = eqTx.filter(tx => tx.transaction_type === 'entry').reduce((s, tx) => s + parseFloat(tx.quantity || 0), 0);
      const totalExits = eqTx.filter(tx => tx.transaction_type === 'exit').reduce((s, tx) => s + parseFloat(tx.quantity || 0), 0);
      return { id: eq.id, name: eq.name, site: eq.location || 'N/A', totalEntries, totalExits, available: Math.max(0, totalEntries - totalExits) };
    });
  };

  const summary = buildSummary();
  const totalAvailable = summary.reduce((s, i) => s + i.available, 0);
  const totalEntries = transactions.filter(tx => tx.transaction_type === 'entry').reduce((s, tx) => s + parseFloat(tx.quantity || 0), 0);
  const totalExits = transactions.filter(tx => tx.transaction_type === 'exit').reduce((s, tx) => s + parseFloat(tx.quantity || 0), 0);

  const handleAddTransaction = async () => {
    if (!newTransaction.date || !newTransaction.equipment_id || !newTransaction.quantity) {
      toastError('Veuillez remplir la date, l\'équipement et la quantité');
      return;
    }
    const quantity = parseFloat(newTransaction.quantity);
    if (isNaN(quantity) || quantity <= 0) {
      toastError('La quantité doit être un nombre positif');
      return;
    }
    if (transactionType === 'exit') {
      const eqSummary = summary.find(s => String(s.id) === String(newTransaction.equipment_id));
      if (eqSummary && quantity > eqSummary.available) {
        toastError(`Stock insuffisant (${eqSummary.available.toFixed(1)} L disponibles)`);
        return;
      }
    }
    try {
      const { error } = await miningService.addOilTransaction({
        ...newTransaction,
        transaction_type: transactionType,
      });
      if (error) throw error;
      toastSuccess(transactionType === 'entry' ? 'Entrée huile enregistrée' : 'Sortie huile enregistrée');
      setShowModal(false);
      setNewTransaction({ date: new Date().toISOString().split('T')[0], equipment_id: equipment[0]?.id || '', quantity: '', site: 'Koro', notes: '' });
      setTransactionType('entry');
      loadAll();
    } catch (err) {
      toastError('Erreur lors de l\'enregistrement: ' + (err.message || ''));
    }
  };

  const handleDelete = async () => {
    if (!confirmDeleteId) return;
    try {
      const { error } = await miningService.deleteOilTransaction(confirmDeleteId);
      if (error) throw error;
      toastSuccess('Transaction supprimée');
      setConfirmDeleteId(null);
      loadAll();
    } catch (err) {
      toastError('Erreur suppression: ' + err.message);
      setConfirmDeleteId(null);
    }
  };

  const openEdit = (tx) => {
    setEditTx({
      id: tx.id,
      date: tx.transaction_date,
      equipment_id: String(tx.equipment_id),
      quantity: tx.quantity,
      site: tx.site || 'Koro',
      notes: tx.notes || '',
      transaction_type: tx.transaction_type,
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editTx.date || !editTx.quantity) {
      toastError('Date et quantité obligatoires');
      return;
    }
    try {
      const { error } = await miningService.updateOilTransaction(editTx.id, {
        transaction_date: editTx.date,
        quantity: parseFloat(editTx.quantity),
        site: editTx.site || null,
        notes: editTx.notes || null,
        transaction_type: editTx.transaction_type,
      });
      if (error) throw error;
      toastSuccess('Transaction mise à jour');
      setShowEditModal(false);
      setEditTx(null);
      loadAll();
    } catch (err) {
      toastError('Erreur mise à jour: ' + err.message);
    }
  };

  return (
    <AppLayout userRole={user?.role} userName={user?.full_name} userSite={user?.department || 'Amp Mines et Carrieres'}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>
            Gestion de l'Huile
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-muted-foreground)' }}>
            Suivi des entrées et sorties d'huile par équipement
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" iconName="Wrench" iconPosition="left" onClick={() => navigate('/equipment-management')}>
            Modules Équipement
          </Button>
          <Button variant="default" iconName="Plus" iconPosition="left" onClick={() => setShowModal(true)}>
            Nouvelle transaction
          </Button>
          <Button variant="outline" iconName="ArrowLeft" iconPosition="left" onClick={() => navigate('/')}>
            Retour
          </Button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 rounded-xl border" style={{ background: 'var(--color-card)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'rgba(34,197,94,0.12)' }}>
              <Icon name="Droplet" size={20} color="#22c55e" />
            </div>
            <div>
              <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>Stock disponible</p>
              <p className="text-xl font-bold" style={{ color: 'var(--color-foreground)' }}>{totalAvailable.toFixed(1)} L</p>
            </div>
          </div>
        </div>
        <div className="p-4 rounded-xl border" style={{ background: 'var(--color-card)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'rgba(34,197,94,0.12)' }}>
              <Icon name="ArrowUpRight" size={20} color="#22c55e" />
            </div>
            <div>
              <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>Entrées totales</p>
              <p className="text-xl font-bold" style={{ color: 'var(--color-foreground)' }}>{totalEntries.toFixed(1)} L</p>
            </div>
          </div>
        </div>
        <div className="p-4 rounded-xl border" style={{ background: 'var(--color-card)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.12)' }}>
              <Icon name="ArrowDownRight" size={20} color="#ef4444" />
            </div>
            <div>
              <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>Sorties totales</p>
              <p className="text-xl font-bold" style={{ color: 'var(--color-foreground)' }}>{totalExits.toFixed(1)} L</p>
            </div>
          </div>
        </div>
      </div>

      {/* Historique */}
      <div className="rounded-xl border mt-6" style={{ background: 'var(--color-card)' }}>
        <div className="p-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
          <h2 className="text-lg font-semibold" style={{ color: 'var(--color-foreground)' }}>
            Historique des transactions huile
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b" style={{ borderColor: 'var(--color-border)' }}>
                <th className="text-left p-4 text-sm font-medium" style={{ color: 'var(--color-muted-foreground)' }}>Date</th>
                <th className="text-left p-4 text-sm font-medium" style={{ color: 'var(--color-muted-foreground)' }}>Type</th>
                <th className="text-left p-4 text-sm font-medium" style={{ color: 'var(--color-muted-foreground)' }}>Équipement</th>
                <th className="text-left p-4 text-sm font-medium" style={{ color: 'var(--color-muted-foreground)' }}>Quantité</th>
                <th className="text-left p-4 text-sm font-medium" style={{ color: 'var(--color-muted-foreground)' }}>Site</th>
                <th className="text-left p-4 text-sm font-medium" style={{ color: 'var(--color-muted-foreground)' }}>Notes</th>
                <th className="text-left p-4 text-sm font-medium" style={{ color: 'var(--color-muted-foreground)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center" style={{ color: 'var(--color-muted-foreground)' }}>Chargement...</td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center" style={{ color: 'var(--color-muted-foreground)' }}>
                    Aucune transaction huile enregistrée.
                  </td>
                </tr>
              ) : transactions.map((tx) => (
                <tr key={tx.id} className="border-b" style={{ borderColor: 'var(--color-border)' }}>
                  <td className="p-4" style={{ color: 'var(--color-foreground)' }}>{tx.transaction_date}</td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${tx.transaction_type === 'entry' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {tx.transaction_type === 'entry' ? 'Entrée' : 'Sortie'}
                    </span>
                  </td>
                  <td className="p-4" style={{ color: 'var(--color-foreground)' }}>{tx.equipment?.name || tx.equipment_id}</td>
                  <td className="p-4 font-semibold" style={{ color: 'var(--color-foreground)' }}>{parseFloat(tx.quantity).toFixed(1)} L</td>
                  <td className="p-4" style={{ color: 'var(--color-foreground)' }}>{tx.site || '—'}</td>
                  <td className="p-4" style={{ color: 'var(--color-muted-foreground)' }}>{tx.notes || '-'}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEdit(tx)}
                        className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors hover:bg-muted"
                        style={{ color: 'var(--color-primary)' }}
                      >
                        <Icon name="Edit" size={13} color="var(--color-primary)" />
                        Modifier
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(tx.id)}
                        className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors hover:bg-muted"
                        style={{ color: 'var(--color-error)' }}
                      >
                        <Icon name="Trash2" size={13} color="var(--color-error)" />
                        Suppr.
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Ajout */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="rounded-xl p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto" style={{ background: 'var(--color-card)' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold" style={{ color: 'var(--color-foreground)' }}>
                Nouvelle transaction huile
              </h3>
              <button onClick={() => setShowModal(false)} className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>Fermer</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-foreground)' }}>Type</label>
                <select
                  value={transactionType}
                  onChange={(e) => setTransactionType(e.target.value)}
                  className="w-full p-2 rounded border"
                  style={{ borderColor: 'var(--color-border)', background: 'var(--color-background)', color: 'var(--color-foreground)' }}
                >
                  <option value="entry">Entrée huile</option>
                  <option value="exit">Sortie huile</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-foreground)' }}>Date</label>
                <input
                  type="date"
                  value={newTransaction.date}
                  onChange={(e) => setNewTransaction({ ...newTransaction, date: e.target.value })}
                  className="w-full p-2 rounded border"
                  style={{ borderColor: 'var(--color-border)', background: 'var(--color-background)', color: 'var(--color-foreground)' }}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-foreground)' }}>Équipement</label>
                <select
                  value={newTransaction.equipment_id}
                  onChange={(e) => setNewTransaction({ ...newTransaction, equipment_id: e.target.value })}
                  className="w-full p-2 rounded border"
                  style={{ borderColor: 'var(--color-border)', background: 'var(--color-background)', color: 'var(--color-foreground)' }}
                >
                  <option value="">Sélectionner un équipement</option>
                  {equipment.map((eq) => (
                    <option key={eq.id} value={eq.id}>{eq.name} ({eq.location || 'Site N/A'})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-foreground)' }}>Site</label>
                <input
                  type="text"
                  value={newTransaction.site}
                  onChange={(e) => setNewTransaction({ ...newTransaction, site: e.target.value })}
                  className="w-full p-2 rounded border"
                  style={{ borderColor: 'var(--color-border)', background: 'var(--color-background)', color: 'var(--color-foreground)' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-foreground)' }}>Quantité (L)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={newTransaction.quantity}
                  onChange={(e) => setNewTransaction({ ...newTransaction, quantity: e.target.value })}
                  className="w-full p-2 rounded border"
                  style={{ borderColor: 'var(--color-border)', background: 'var(--color-background)', color: 'var(--color-foreground)' }}
                  placeholder="0.0"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-foreground)' }}>Notes</label>
                <textarea
                  value={newTransaction.notes}
                  onChange={(e) => setNewTransaction({ ...newTransaction, notes: e.target.value })}
                  rows="3"
                  className="w-full p-2 rounded border"
                  style={{ borderColor: 'var(--color-border)', background: 'var(--color-background)', color: 'var(--color-foreground)' }}
                  placeholder="Notes optionnelles"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <Button variant="outline" onClick={() => setShowModal(false)}>Annuler</Button>
              <Button variant="default" onClick={handleAddTransaction}>Enregistrer</Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Modifier */}
      {showEditModal && editTx && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="rounded-xl p-6 w-full max-w-xl" style={{ background: 'var(--color-card)' }}>
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-foreground)' }}>Modifier la transaction</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-foreground)' }}>Type</label>
                <select
                  value={editTx.transaction_type}
                  onChange={(e) => setEditTx({ ...editTx, transaction_type: e.target.value })}
                  className="w-full p-2 rounded border"
                  style={{ borderColor: 'var(--color-border)', background: 'var(--color-background)', color: 'var(--color-foreground)' }}
                >
                  <option value="entry">Entrée huile</option>
                  <option value="exit">Sortie huile</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-foreground)' }}>Date</label>
                <input
                  type="date"
                  value={editTx.date}
                  onChange={(e) => setEditTx({ ...editTx, date: e.target.value })}
                  className="w-full p-2 rounded border"
                  style={{ borderColor: 'var(--color-border)', background: 'var(--color-background)', color: 'var(--color-foreground)' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-foreground)' }}>Quantité (L)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={editTx.quantity}
                  onChange={(e) => setEditTx({ ...editTx, quantity: e.target.value })}
                  className="w-full p-2 rounded border"
                  style={{ borderColor: 'var(--color-border)', background: 'var(--color-background)', color: 'var(--color-foreground)' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-foreground)' }}>Site</label>
                <input
                  type="text"
                  value={editTx.site}
                  onChange={(e) => setEditTx({ ...editTx, site: e.target.value })}
                  className="w-full p-2 rounded border"
                  style={{ borderColor: 'var(--color-border)', background: 'var(--color-background)', color: 'var(--color-foreground)' }}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-foreground)' }}>Notes</label>
                <textarea
                  value={editTx.notes}
                  onChange={(e) => setEditTx({ ...editTx, notes: e.target.value })}
                  rows="2"
                  className="w-full p-2 rounded border"
                  style={{ borderColor: 'var(--color-border)', background: 'var(--color-background)', color: 'var(--color-foreground)' }}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <Button variant="outline" onClick={() => { setShowEditModal(false); setEditTx(null); }}>Annuler</Button>
              <Button variant="default" onClick={handleSaveEdit}>Sauvegarder</Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmation Suppression */}
      {confirmDeleteId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="rounded-xl p-6 w-full max-w-sm" style={{ background: 'var(--color-card)' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(229,62,62,0.12)' }}>
                <Icon name="AlertTriangle" size={20} color="var(--color-error)" />
              </div>
              <div>
                <h3 className="text-base font-semibold" style={{ color: 'var(--color-foreground)' }}>Supprimer cette transaction ?</h3>
                <p className="text-xs mt-0.5" style={{ color: 'var(--color-muted-foreground)' }}>Cette action est irréversible.</p>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setConfirmDeleteId(null)}>Annuler</Button>
              <Button variant="destructive" onClick={handleDelete}>Supprimer</Button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
