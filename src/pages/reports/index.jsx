import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "components/navigation/AppLayout";
import Icon from "components/AppIcon";
import Button from "components/ui/Button";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from "recharts";
import { toastError, toastSuccess } from "../../utils/toast.jsx";
import { miningService, supabase } from "../../config/supabase.js";
import { useAuth } from "../../context/AuthContext";
import FuelCostChart from "../executive-dashboard/components/FuelCostChart";
import OilConsumptionChart from "../executive-dashboard/components/OilConsumptionChart";

// ── Helpers ──────────────────────────────────────────────────
const SEP  = '='.repeat(52);
const SUB  = '-'.repeat(40);
const fmt  = (n) => Number(n || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtN = (n) => Number(n || 0).toLocaleString('fr-FR');
const now  = () => new Date().toLocaleString('fr-FR');

// Charge toutes les données réelles de Supabase pour la génération
async function fetchAllData() {
  const [prodRes, detailsRes, exitsRes, financialRes, maintenanceRes, eqRes, fuelRes, oilRes, stockEntriesRes, stockExitsRes] = await Promise.all([
    supabase.from('production').select('*').order('date').limit(5000),
    supabase.from('production_details').select('dimension, quantity').limit(5000),
    supabase.from('production_exits').select('*').limit(5000),
    supabase.from('financial_transactions').select('*').limit(5000),
    supabase.from('maintenance').select('*, equipment:equipment_id(name)').order('start_date', { ascending: false }).limit(500),
    supabase.from('equipment').select('*'),
    supabase.from('fuel_transactions').select('*, equipment:equipment_id(name)').order('transaction_date', { ascending: false }).limit(5000),
    supabase.from('oil_transactions').select('*, equipment:equipment_id(name)').order('transaction_date', { ascending: false }).limit(5000),
    miningService.getStockEntries(),
    miningService.getStockExits(),
  ]);
  return {
    production:   prodRes.data    || [],
    details:      detailsRes.data || [],
    exits:        exitsRes.data   || [],
    financial:    financialRes.data || [],
    maintenance:  maintenanceRes.data || [],
    equipment:    eqRes.data      || [],
    fuel:         fuelRes.data    || [],
    oil:          oilRes.data     || [],
    stockEntries: stockEntriesRes.data || [],
    stockExits:   stockExitsRes.data  || [],
  };
}

function computeStockByDim(stockEntries, stockExits) {
  const byDim = {};
  (stockEntries || []).forEach(entry => {
    (entry.stock_entry_details || []).forEach(d => {
      if (!byDim[d.dimension]) byDim[d.dimension] = { entries: 0, exits: 0 };
      byDim[d.dimension].entries += parseFloat(d.quantity || 0);
    });
  });
  (stockExits || []).forEach(exit => {
    (exit.stock_exit_details || []).forEach(d => {
      if (!byDim[d.dimension]) byDim[d.dimension] = { entries: 0, exits: 0 };
      byDim[d.dimension].exits += parseFloat(d.quantity || 0);
    });
  });
  return Object.entries(byDim)
    .filter(([, v]) => v.entries > 0 || v.exits > 0)
    .map(([dimension, v]) => ({
      dimension,
      entries: v.entries,
      exits: v.exits,
      available: Math.max(0, v.entries - v.exits),
    }));
}

function buildProductionReport(report, d) {
  // Grouper par dimension
  const byDim = {};
  d.details.forEach(r => {
    const dim = r.dimension || 'Inconnu';
    byDim[dim] = (byDim[dim] || 0) + parseFloat(r.quantity || 0);
  });
  const totalProd = Object.values(byDim).reduce((s, v) => s + v, 0);
  const dimLines = Object.entries(byDim).length > 0
    ? Object.entries(byDim).map(([dim, qty]) => {
        const pct = totalProd > 0 ? ((qty / totalProd) * 100).toFixed(1) : '0.0';
        return `  ${dim.padEnd(28)} ${fmtN(qty).padStart(8)} t   (${pct}%)`;
      }).join('\n')
    : '  Aucune production enregistrée';

  // Totaux exits
  const totalExits = d.exits.reduce((s, e) => s + parseFloat(e.total || 0), 0);

  return `${SEP}
  RAPPORT DE PRODUCTION
  African Mining Partenair SARL
${SEP}

  Nom      : ${report.name}
  Période  : ${report.period}
  Généré le: ${now()}

${SUB}
  SYNTHÈSE GLOBALE
${SUB}

  Production totale enregistrée : ${fmtN(totalProd)} t
  Sorties totales                : ${fmtN(totalExits)} t
  Stock estimé                   : ${fmtN(Math.max(0, totalProd - totalExits))} t
  Nombre de saisies              : ${d.production.length}

${SUB}
  PRODUCTION PAR DIMENSION
${SUB}

${dimLines}

${SUB}
  HISTORIQUE DES SAISIES (10 dernières)
${SUB}

${d.production.slice(-10).reverse().map(p =>
  `  ${p.date}  ${(p.site || '').padEnd(20)}  ${(p.operator || '').padEnd(20)}  ${fmtN(p.total)} t`
).join('\n') || '  Aucune saisie'}

${SUB}
  STOCK PAR DIMENSION
${SUB}

${(() => {
  const stockDim = computeStockByDim(d.stockEntries, d.stockExits);
  if (stockDim.length === 0) return '  Aucune donnée de stock enregistrée';
  const header = `  ${'Dimension'.padEnd(28)} ${'Entrées'.padStart(12)} ${'Sorties'.padStart(12)} ${'Disponible'.padStart(12)}`;
  const lines  = stockDim.map(s =>
    `  ${s.dimension.padEnd(28)} ${(fmtN(s.entries)+' t').padStart(12)} ${(fmtN(s.exits)+' t').padStart(12)} ${(fmtN(s.available)+' t').padStart(12)}`
  ).join('\n');
  return `${header}\n${lines}`;
})()}

${SUB}
  SORTIES DE STOCK (10 dernières)
${SUB}

${(() => {
  const exits = d.stockExits.slice(0, 10);
  if (exits.length === 0) return '  Aucune sortie de stock enregistrée';
  const header = `  ${'Date'.padEnd(12)} ${'Destination'.padEnd(25)} ${'Total'.padStart(10)}   Dimensions`;
  const lines  = exits.map(e => {
    const total = (e.stock_exit_details || []).reduce((s, x) => s + parseFloat(x.quantity || 0), 0);
    const dims  = (e.stock_exit_details || []).map(x => `${x.dimension}: ${fmtN(x.quantity)}t`).join(', ');
    return `  ${(e.exit_date || '').padEnd(12)} ${(e.destination || '').padEnd(25)} ${(fmtN(total)+' t').padStart(10)}   ${dims}`;
  }).join('\n');
  return `${header}\n${lines}`;
})()}

---
Généré par AMP Platform — ${now()}`;
}

function buildFinancialReport(report, d) {
  const revenus  = d.financial.filter(f => f.type === 'income').reduce((s, f) => s + parseFloat(f.amount || 0), 0);
  const depenses = d.financial.filter(f => f.type === 'expense').reduce((s, f) => s + parseFloat(f.amount || 0), 0);
  const benefice = revenus - depenses;
  const marge    = revenus > 0 ? ((benefice / revenus) * 100).toFixed(1) : '0.0';

  const byCategory = {};
  d.financial.forEach(f => {
    const cat = f.category || 'Autre';
    if (!byCategory[cat]) byCategory[cat] = { income: 0, expense: 0 };
    if (f.type === 'income')  byCategory[cat].income  += parseFloat(f.amount || 0);
    if (f.type === 'expense') byCategory[cat].expense += parseFloat(f.amount || 0);
  });
  const catLines = Object.entries(byCategory).map(([cat, v]) =>
    `  ${cat.padEnd(28)} R: ${fmt(v.income).padStart(14)} FCFA   D: ${fmt(v.expense).padStart(14)} FCFA`
  ).join('\n') || '  Aucune transaction';

  return `${SEP}
  RAPPORT FINANCIER
  African Mining Partenair SARL
${SEP}

  Nom      : ${report.name}
  Période  : ${report.period}
  Généré le: ${now()}

${SUB}
  SYNTHÈSE
${SUB}

  Revenus totaux : ${fmt(revenus)} FCFA
  Dépenses totales: ${fmt(depenses)} FCFA
  Bénéfice net   : ${fmt(benefice)} FCFA
  Marge nette    : ${marge}%
  Transactions   : ${d.financial.length}

${SUB}
  RÉPARTITION PAR CATÉGORIE
${SUB}

${catLines}

${SUB}
  DERNIÈRES TRANSACTIONS (10)
${SUB}

${d.financial.slice(-10).reverse().map(f =>
  `  ${(f.transaction_date || '').padEnd(12)} ${(f.type === 'income' ? 'REVENU' : 'DÉPENSE').padEnd(10)} ${(f.category || '').padEnd(20)} ${fmt(f.amount).padStart(14)} FCFA`
).join('\n') || '  Aucune transaction'}

---
Généré par AMP Platform — ${now()}`;
}

function buildMaintenanceReport(report, d) {
  const total      = d.maintenance.length;
  const preventive = d.maintenance.filter(m => m.type === 'preventive' || m.maintenance_type === 'preventive').length;
  const corrective = d.maintenance.filter(m => m.type === 'corrective' || m.maintenance_type === 'corrective').length;
  const totalCost  = d.maintenance.reduce((s, m) => s + parseFloat(m.cost || 0), 0);

  return `${SEP}
  RAPPORT DE MAINTENANCE
  African Mining Partenair SARL
${SEP}

  Nom      : ${report.name}
  Période  : ${report.period}
  Généré le: ${now()}

${SUB}
  SYNTHÈSE
${SUB}

  Interventions totales : ${total}
  Préventives           : ${preventive}${total > 0 ? ` (${((preventive/total)*100).toFixed(1)}%)` : ''}
  Correctives           : ${corrective}${total > 0 ? ` (${((corrective/total)*100).toFixed(1)}%)` : ''}
  Coût total            : ${fmt(totalCost)} FCFA
  Équipements suivis    : ${d.equipment.length}

${SUB}
  ÉTAT DU PARC ÉQUIPEMENTS
${SUB}

${d.equipment.map(e =>
  `  ${(e.name || '').padEnd(30)} ${(e.type || '').padEnd(20)} ${(e.status || '').padEnd(15)}`
).join('\n') || '  Aucun équipement'}

${SUB}
  DERNIÈRES INTERVENTIONS (10)
${SUB}

${d.maintenance.slice(0, 10).map(m =>
  `  ${(m.start_date || '').padEnd(12)} ${(m.equipment?.name || '').padEnd(25)} ${(m.description || '').substring(0, 30).padEnd(32)} ${fmt(m.cost)} FCFA`
).join('\n') || '  Aucune intervention'}

---
Généré par AMP Platform — ${now()}`;
}

function buildSummaryReport(report, d) {
  const totalProd  = d.details.reduce((s, r) => s + parseFloat(r.quantity || 0), 0);
  const revenus    = d.financial.filter(f => f.type === 'income').reduce((s, f) => s + parseFloat(f.amount || 0), 0);
  const depenses   = d.financial.filter(f => f.type === 'expense').reduce((s, f) => s + parseFloat(f.amount || 0), 0);
  const benefice   = revenus - depenses;
  const fuelTotal  = d.fuel.reduce((s, f) => s + parseFloat(f.quantity || 0), 0);
  const activeEq   = d.equipment.filter(e => e.status === 'active').length;

  return `${SEP}
  BILAN DE SYNTHÈSE
  African Mining Partenair SARL
${SEP}

  Nom      : ${report.name}
  Période  : ${report.period}
  Généré le: ${now()}

${SUB}
  PRODUCTION
${SUB}
  Production totale    : ${fmtN(totalProd)} t
  Nombre de saisies    : ${d.production.length}
  Sorties enregistrées : ${d.exits.length}

${SUB}
  FINANCES
${SUB}
  Revenus             : ${fmt(revenus)} FCFA
  Dépenses            : ${fmt(depenses)} FCFA
  Bénéfice            : ${fmt(benefice)} FCFA
  Marge               : ${revenus > 0 ? ((benefice/revenus)*100).toFixed(1) : '0.0'}%

${SUB}
  ÉQUIPEMENTS
${SUB}
  Total équipements   : ${d.equipment.length}
  Actifs              : ${activeEq}
  Disponibilité       : ${d.equipment.length > 0 ? ((activeEq/d.equipment.length)*100).toFixed(1) : '0.0'}%
  Carburant consommé  : ${fmtN(fuelTotal)} L

${SUB}
  MAINTENANCE
${SUB}
  Interventions totales: ${d.maintenance.length}

${SUB}
  STOCK
${SUB}
${(() => {
  const stockDim = computeStockByDim(d.stockEntries, d.stockExits);
  if (stockDim.length === 0) return '  Aucune donnée de stock enregistrée';
  const totalEntries = stockDim.reduce((s, v) => s + v.entries, 0);
  const totalExits   = stockDim.reduce((s, v) => s + v.exits, 0);
  const totalStock   = stockDim.reduce((s, v) => s + v.available, 0);
  return `  Entrées cumulées    : ${fmtN(totalEntries)} t\n  Sorties cumulées    : ${fmtN(totalExits)} t\n  Stock disponible    : ${fmtN(totalStock)} t\n  Sorties enregistrées: ${d.stockExits.length}`;
})()}

---
Généré par AMP Platform — ${now()}`;
}

function buildFuelReport(report, d) {
  const entries = d.fuel.filter(f => f.transaction_type === 'entry' || f.transaction_type === null);
  const exits   = d.fuel.filter(f => f.transaction_type === 'exit');
  const totalIn   = entries.reduce((s, f) => s + parseFloat(f.quantity || 0), 0);
  const totalOut  = exits.reduce((s, f)   => s + parseFloat(f.quantity || 0), 0);
  const totalCost = entries.reduce((s, f) => s + parseFloat(f.total_cost || 0), 0);
  const stock     = Math.max(0, totalIn - totalOut);

  const byEq = {};
  exits.forEach(f => {
    const name = f.equipment?.name || null;
    if (!name) return; // ignorer les sorties sans engin associé
    if (!byEq[name]) byEq[name] = 0;
    byEq[name] += parseFloat(f.quantity || 0);
  });
  const eqLines = Object.entries(byEq)
    .sort((a, b) => b[1] - a[1])
    .map(([name, qty]) => `  ${name.padEnd(30)} ${fmtN(qty).padStart(10)} L`)
    .join('\n') || '  Aucune sortie enregistrée';

  const lastFuel = d.fuel.slice(0, 15);

  return `${SEP}
  RAPPORT CARBURANT
  African Mining Partenair SARL
${SEP}

  Nom      : ${report.name}
  Période  : ${report.period}
  Généré le: ${now()}

${SUB}
  STOCK CARBURANT
${SUB}

  Entrées (réceptions)   : ${fmtN(totalIn)} L
  Sorties (consommations): ${fmtN(totalOut)} L
  Stock disponible       : ${fmtN(stock)} L
  Coût total achats      : ${fmt(totalCost)} FCFA
  Transactions totales   : ${d.fuel.length}

${SUB}
  CONSOMMATION PAR ENGIN (Sorties)
${SUB}

  ${'Équipement'.padEnd(30)} ${'Quantité'.padStart(10)}
${eqLines}

${SUB}
  HISTORIQUE RÉCENT (15 dernières transactions)
${SUB}

  ${'Date'.padEnd(12)} ${'Type'.padEnd(8)} ${'Équipement'.padEnd(25)} ${'Carburant'.padEnd(10)} ${'Quantité'.padStart(10)}
${lastFuel.map(f => {
  const type = f.transaction_type === 'entry' ? 'ENTRÉE' : 'SORTIE';
  const eq   = f.equipment?.name || '—';
  return `  ${(f.transaction_date||'').padEnd(12)} ${type.padEnd(8)} ${eq.padEnd(25)} ${(f.fuel_type||'').padEnd(10)} ${(fmtN(f.quantity)+' L').padStart(10)}`;
}).join('\n') || '  Aucune transaction'}

---
Généré par AMP Platform — ${now()}`;
}

function buildOilReport(report, d) {
  const entries = d.oil.filter(o => o.transaction_type === 'entry');
  const exits   = d.oil.filter(o => o.transaction_type === 'exit');
  const totalIn  = entries.reduce((s, o) => s + parseFloat(o.quantity || 0), 0);
  const totalOut = exits.reduce((s, o)   => s + parseFloat(o.quantity || 0), 0);
  const stock    = Math.max(0, totalIn - totalOut);

  const byEq = {};
  exits.forEach(o => {
    const name = o.equipment?.name || '—';
    if (!byEq[name]) byEq[name] = { qty: 0, types: {} };
    byEq[name].qty += parseFloat(o.quantity || 0);
    if (o.oil_type) byEq[name].types[o.oil_type] = (byEq[name].types[o.oil_type] || 0) + parseFloat(o.quantity || 0);
  });
  const eqLines = Object.entries(byEq)
    .sort((a, b) => b[1].qty - a[1].qty)
    .map(([name, v]) => `  ${name.padEnd(30)} ${(fmtN(v.qty)+' L').padStart(10)}`)
    .join('\n') || '  Aucune sortie enregistrée';

  return `${SEP}
  RAPPORT HUILE
  African Mining Partenair SARL
${SEP}

  Nom      : ${report.name}
  Période  : ${report.period}
  Généré le: ${now()}

${SUB}
  STOCK HUILE
${SUB}

  Entrées (réceptions)   : ${fmtN(totalIn)} L
  Sorties (consommations): ${fmtN(totalOut)} L
  Stock disponible       : ${fmtN(stock)} L
  Transactions totales   : ${d.oil.length}

${SUB}
  CONSOMMATION PAR ENGIN (Sorties)
${SUB}

  ${'Équipement'.padEnd(30)} ${'Consommé'.padStart(10)}
${eqLines}

${SUB}
  HISTORIQUE RÉCENT (15 dernières transactions)
${SUB}

  ${'Date'.padEnd(12)} ${'Type'.padEnd(8)} ${'Équipement'.padEnd(25)} ${'Huile'.padEnd(20)} ${'Qté'.padStart(8)}
${d.oil.slice(0, 15).map(o => {
  const type = o.transaction_type === 'entry' ? 'ENTRÉE' : 'SORTIE';
  const eq   = o.equipment?.name || (o.transaction_type === 'entry' ? '(Stock général)' : '—');
  return `  ${(o.transaction_date||'').padEnd(12)} ${type.padEnd(8)} ${eq.padEnd(25)} ${(o.oil_type||'').padEnd(20)} ${(fmtN(o.quantity)+' L').padStart(8)}`;
}).join('\n') || '  Aucune transaction'}

---
Généré par AMP Platform — ${now()}`;
}

async function generateReport(report) {
  const d = await fetchAllData();
  switch (report.type) {
    case 'production':  return buildProductionReport(report, d);
    case 'financial':   return buildFinancialReport(report, d);
    case 'maintenance': return buildMaintenanceReport(report, d);
    case 'fuel':        return buildFuelReport(report, d);
    case 'oil':         return buildOilReport(report, d);
    case 'summary':     return buildSummaryReport(report, d);
    default:            return buildSummaryReport(report, d);
  }
}

// ── Composant principal ───────────────────────────────────────
export default function Reports() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [reports, setReports]           = useState([]);
  const [loading, setLoading]           = useState(true);
  const [fuelChartData, setFuelChartData] = useState([]);
  const [oilChartData, setOilChartData]   = useState([]);
  const [costChartData, setCostChartData] = useState([]);
  const [stockDimData, setStockDimData]   = useState([]);
  const [recentExits, setRecentExits]   = useState([]);
  const [generating, setGenerating]     = useState(null); // id du rapport en cours
  const [showNewModal, setShowNewModal] = useState(false);
  const [newReport, setNewReport]       = useState({ name: '', type: 'production', period: '', format: 'PDF' });

  useEffect(() => {
    loadReports();
    loadChartData();
    loadStockData();
  }, []);

  async function loadReports() {
    try {
      const result = await miningService.getReports();
      if (result.error) throw result.error;
      setReports(result.data || []);
    } catch (err) {
      toastError("Erreur chargement des rapports");
      setReports([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadChartData() {
    const [fuelRes, oilRes, costRes] = await Promise.all([
      miningService.getFuelChartData(),
      miningService.getOilChartData(),
      miningService.getCostEvolutionData(),
    ]);
    setFuelChartData(fuelRes.data || []);
    setOilChartData(oilRes.data   || []);
    setCostChartData(costRes.data  || []);
  }

  async function loadStockData() {
    const [entriesRes, exitsRes] = await Promise.all([
      miningService.getStockEntries(),
      miningService.getStockExits(),
    ]);
    if (entriesRes.error) console.error('Stock entries error:', entriesRes.error);
    if (exitsRes.error)   console.error('Stock exits error:',   exitsRes.error);
    const entries = entriesRes.data || [];
    const exits   = exitsRes.data   || [];
    setStockDimData(computeStockByDim(entries, exits));
    setRecentExits(exits.slice(0, 10));
  }

  async function handleView(report) {
    setGenerating(report.id);
    try {
      const content = await generateReport(report);
      const w = window.open('', '_blank', 'width=860,height=700');
      w.document.write(`<!DOCTYPE html><html><head><title>${report.name}</title>
        <style>body{font-family:monospace;padding:32px;background:#f4f4f4;line-height:1.7}
        .c{max-width:820px;margin:0 auto;background:#fff;padding:40px;border-radius:8px;box-shadow:0 2px 12px rgba(0,0,0,.1)}
        pre{white-space:pre-wrap;word-break:break-word;font-size:13px}
        .btn{background:#1d4ed8;color:#fff;border:none;padding:10px 22px;border-radius:6px;cursor:pointer;margin-right:8px;font-size:14px}
        .btn:hover{background:#1e40af}</style></head>
        <body><div class="c">
        <pre>${content.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</pre>
        <br><button class="btn" onclick="window.print()">Imprimer</button>
        <button class="btn" onclick="window.close()">Fermer</button>
        </div></body></html>`);
      w.document.close();
    } catch (err) {
      toastError('Erreur génération du rapport');
    } finally {
      setGenerating(null);
    }
  }

  async function handleDownload(report) {
    setGenerating(report.id);
    try {
      const content = await generateReport(report);
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `${report.name.replace(/[^a-zA-Z0-9]/g,'_')}_${report.period.replace(/[^a-zA-Z0-9]/g,'_')}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toastSuccess('Rapport téléchargé');
    } catch (err) {
      toastError('Erreur téléchargement');
    } finally {
      setGenerating(null);
    }
  }

  async function handleCreate() {
    if (!newReport.name || !newReport.period) {
      toastError('Remplissez le nom et la période');
      return;
    }
    try {
      const { data, error } = await miningService.createReport({
        name: newReport.name,
        type: newReport.type,
        period: newReport.period,
        format: newReport.format,
        status: 'completed',
        report_date: new Date().toISOString().split('T')[0],
      });
      if (error) throw error;
      toastSuccess('Rapport créé');
      setShowNewModal(false);
      setNewReport({ name: '', type: 'production', period: '', format: 'PDF' });
      await loadReports();
    } catch (err) {
      toastError(`Erreur: ${err.message}`);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Supprimer ce rapport ?')) return;
    try {
      const { error } = await miningService.deleteReport(id);
      if (error) throw error;
      toastSuccess('Rapport supprimé');
      await loadReports();
    } catch (err) {
      toastError(`Erreur: ${err.message}`);
    }
  }

  const typeLabel  = t => ({ production:'Production', financial:'Financier', maintenance:'Maintenance', fuel:'Carburant', oil:'Huile', summary:'Synthèse' }[t] || t);
  const typeColor  = t => ({ production:'var(--color-primary)', financial:'var(--color-success)', maintenance:'var(--color-warning)', fuel:'#3182CE', oil:'#D97706', summary:'#805AD5' }[t] || 'var(--color-muted-foreground)');
  const statColor  = s => ({ completed:'var(--color-success)', generating:'var(--color-warning)', failed:'var(--color-error)' }[s] || 'var(--color-muted-foreground)');
  const statLabel  = s => ({ completed:'Terminé', generating:'En cours', failed:'Échoué' }[s] || s);

  return (
    <AppLayout userRole={user?.role} userName={user?.full_name} userSite="African Mining Partenair SARL">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color:'var(--color-foreground)' }}>Rapports</h1>
          <p className="text-sm mt-1" style={{ color:'var(--color-muted-foreground)' }}>Génération de rapports à partir des données réelles</p>
        </div>
        <div className="flex gap-3">
          <Button variant="default" iconName="Plus" iconPosition="left" onClick={() => setShowNewModal(true)}>Nouveau Rapport</Button>
          <Button variant="outline" iconName="ArrowLeft" iconPosition="left" onClick={() => navigate('/')}>Retour</Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label:'Total',    value: reports.length,                                         icon:'FileText',   color:'var(--color-success)', bg:'rgba(56,161,105,0.12)' },
          { label:'Terminés', value: reports.filter(r=>r.status==='completed').length,        icon:'CheckCircle',color:'var(--color-success)', bg:'rgba(56,161,105,0.12)' },
          { label:'En cours', value: reports.filter(r=>r.status==='generating').length,       icon:'Clock',      color:'var(--color-warning)', bg:'rgba(214,158,46,0.12)' },
          { label:'Ce Mois',  value: reports.filter(r=>r.created_at?.startsWith(new Date().toISOString().substring(0,7))).length, icon:'Calendar', color:'#3182CE', bg:'rgba(49,130,206,0.12)' },
        ].map((k,i) => (
          <div key={i} className="p-4 rounded-xl border" style={{ background:'var(--color-card)' }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background:k.bg }}>
                <Icon name={k.icon} size={20} color={k.color} />
              </div>
              <div>
                <p className="text-sm" style={{ color:'var(--color-muted-foreground)' }}>{k.label}</p>
                <p className="text-xl font-bold" style={{ color:'var(--color-foreground)' }}>{k.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Table rapports */}
      <div className="rounded-xl border" style={{ background:'var(--color-card)' }}>
        <div className="p-4 border-b" style={{ borderColor:'var(--color-border)' }}>
          <h2 className="text-lg font-semibold" style={{ color:'var(--color-foreground)' }}>Rapports Disponibles</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b text-sm" style={{ borderColor:'var(--color-border)', color:'var(--color-muted-foreground)' }}>
                <th className="text-left p-4">Nom</th>
                <th className="text-left p-4">Type</th>
                <th className="text-left p-4">Période</th>
                <th className="text-left p-4">Date création</th>
                <th className="text-left p-4">Format</th>
                <th className="text-left p-4">Statut</th>
                <th className="text-left p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="p-8 text-center" style={{ color:'var(--color-muted-foreground)' }}>Chargement...</td></tr>
              ) : reports.length === 0 ? (
                <tr><td colSpan={7} className="p-8 text-center" style={{ color:'var(--color-muted-foreground)' }}>Aucun rapport — créez-en un avec le bouton ci-dessus</td></tr>
              ) : reports.map(r => (
                <tr key={r.id} className="border-b" style={{ borderColor:'var(--color-border)' }}>
                  <td className="p-4 font-medium" style={{ color:'var(--color-foreground)' }}>{r.name}</td>
                  <td className="p-4">
                    <span className="px-2 py-1 rounded-full text-xs font-medium" style={{ background:`${typeColor(r.type)}18`, color:typeColor(r.type) }}>{typeLabel(r.type)}</span>
                  </td>
                  <td className="p-4 text-sm" style={{ color:'var(--color-foreground)' }}>{r.period}</td>
                  <td className="p-4 text-sm" style={{ color:'var(--color-muted-foreground)' }}>{r.report_date || r.created_at?.split('T')[0]}</td>
                  <td className="p-4">
                    <span className="px-2 py-1 rounded text-xs" style={{ background:'rgba(49,130,206,0.12)', color:'#3182CE' }}>{r.format}</span>
                  </td>
                  <td className="p-4">
                    <span className="px-2 py-1 rounded-full text-xs font-medium" style={{ background:`${statColor(r.status)}18`, color:statColor(r.status) }}>{statLabel(r.status)}</span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleView(r)}
                        disabled={generating === r.id}
                        className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-40"
                        title="Visualiser (données réelles)"
                      >
                        {generating === r.id
                          ? <Icon name="Loader" size={16} color="var(--color-muted-foreground)" />
                          : <Icon name="Eye" size={16} color="var(--color-success)" />}
                      </button>
                      <button
                        onClick={() => handleDownload(r)}
                        disabled={generating === r.id}
                        className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-40"
                        title="Télécharger (données réelles)"
                      >
                        <Icon name="Download" size={16} color="var(--color-primary)" />
                      </button>
                      <button onClick={() => handleDelete(r.id)} className="p-1.5 rounded hover:bg-gray-100" title="Supprimer">
                        <Icon name="Trash2" size={16} color="var(--color-error)" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Graphiques Carburant & Huile par Engin */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <FuelCostChart data={fuelChartData} periodLabel="Ce mois · sorties par engin" />
        <OilConsumptionChart data={oilChartData} periodLabel="Ce mois · sorties par engin" />
      </div>

      {/* Évolution des Coûts */}
      <div className="rounded-xl border p-6 mt-6" style={{ background:'var(--color-card)' }}>
        <h3 className="text-lg font-semibold mb-4" style={{ color:'var(--color-foreground)' }}>Évolution des Coûts (6 mois)</h3>
        {costChartData.every(d => d.c === 0 && d.m === 0) ? (
          <div className="flex items-center justify-center h-56 text-sm" style={{ color:'var(--color-muted-foreground)' }}>Aucune donnée financière disponible</div>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={costChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="mois" tick={{ fontSize:11, fill:'var(--color-muted-foreground)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize:11, fill:'var(--color-muted-foreground)' }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v,n) => [`${v.toLocaleString('fr-FR')} FCFA`, n]} />
              <Legend />
              <Line type="monotone" dataKey="c" name="Dépenses" stroke="#FF6B35" strokeWidth={2} dot={{ r:3 }} />
              <Line type="monotone" dataKey="m" name="Revenus"  stroke="var(--color-success)" strokeWidth={2} dot={{ r:3 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Graphique Stock par Dimension */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="rounded-xl border p-6" style={{ background:'var(--color-card)' }}>
          <h3 className="text-lg font-semibold mb-4" style={{ color:'var(--color-foreground)' }}>Stock par Dimension</h3>
          {stockDimData.length === 0 ? (
            <div className="flex items-center justify-center h-56 text-sm" style={{ color:'var(--color-muted-foreground)' }}>Aucune donnée de stock disponible</div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={stockDimData.map(d => ({ ...d, name: d.dimension.length > 10 ? d.dimension.substring(0, 9) + '…' : d.dimension }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="name" tick={{ fontSize:10, fill:'var(--color-muted-foreground)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize:11, fill:'var(--color-muted-foreground)' }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v, n) => [`${Number(v).toLocaleString('fr-FR')} t`, n]} />
                <Legend />
                <Bar dataKey="entries"   name="Entrées"    fill="#22c55e" radius={[3,3,0,0]} />
                <Bar dataKey="exits"     name="Sorties"    fill="#ef4444" radius={[3,3,0,0]} />
                <Bar dataKey="available" name="Disponible" fill="#3182CE" radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Table des sorties de stock */}
        <div className="rounded-xl border" style={{ background:'var(--color-card)' }}>
          <div className="p-4 border-b" style={{ borderColor:'var(--color-border)' }}>
            <h3 className="text-lg font-semibold" style={{ color:'var(--color-foreground)' }}>Dernières Sorties de Stock</h3>
          </div>
          {recentExits.length === 0 ? (
            <div className="flex items-center justify-center h-56 text-sm" style={{ color:'var(--color-muted-foreground)' }}>Aucune sortie de stock enregistrée</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="border-b text-sm" style={{ borderColor:'var(--color-border)', color:'var(--color-muted-foreground)' }}>
                    <th className="text-left p-3">Date</th>
                    <th className="text-left p-3">Destination</th>
                    <th className="text-left p-3">Dimensions</th>
                    <th className="text-right p-3">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {recentExits.map((exit, i) => {
                    const details = exit.stock_exit_details || [];
                    const total = details.reduce((s, d) => s + parseFloat(d.quantity || 0), 0);
                    return (
                      <tr key={exit.id || i} className="border-b" style={{ borderColor:'var(--color-border)' }}>
                        <td className="p-3 text-sm" style={{ color:'var(--color-foreground)' }}>{exit.exit_date}</td>
                        <td className="p-3 text-sm font-medium" style={{ color:'var(--color-foreground)' }}>{exit.destination || '—'}</td>
                        <td className="p-3 text-xs" style={{ color:'var(--color-muted-foreground)' }}>
                          {details.map(d => (
                            <span key={d.dimension} className="inline-block mr-2 mb-1 px-1.5 py-0.5 rounded" style={{ background:'rgba(49,130,206,0.1)', color:'#3182CE' }}>
                              {d.dimension}: {Number(d.quantity).toLocaleString('fr-FR')}t
                            </span>
                          ))}
                        </td>
                        <td className="p-3 text-sm font-bold text-right" style={{ color:'var(--color-error)' }}>
                          -{total.toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} t
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Tableau stock par dimension (résumé) */}
      {stockDimData.length > 0 && (
        <div className="rounded-xl border mt-6" style={{ background:'var(--color-card)' }}>
          <div className="p-4 border-b" style={{ borderColor:'var(--color-border)' }}>
            <h3 className="text-lg font-semibold" style={{ color:'var(--color-foreground)' }}>Stock Disponible par Dimension</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b text-sm" style={{ borderColor:'var(--color-border)', color:'var(--color-muted-foreground)' }}>
                  <th className="text-left p-4">Dimension</th>
                  <th className="text-left p-4">Entrées Cumulées</th>
                  <th className="text-left p-4">Sorties Cumulées</th>
                  <th className="text-left p-4">Disponible</th>
                  <th className="text-left p-4">Statut</th>
                </tr>
              </thead>
              <tbody>
                {stockDimData.map((item, i) => (
                  <tr key={i} className="border-b" style={{ borderColor:'var(--color-border)' }}>
                    <td className="p-4 font-medium" style={{ color:'var(--color-foreground)' }}>{item.dimension}</td>
                    <td className="p-4 font-bold" style={{ color:'var(--color-success)' }}>+{item.entries.toLocaleString('fr-FR', { minimumFractionDigits:1, maximumFractionDigits:1 })} t</td>
                    <td className="p-4 font-bold" style={{ color:'var(--color-error)' }}>-{item.exits.toLocaleString('fr-FR', { minimumFractionDigits:1, maximumFractionDigits:1 })} t</td>
                    <td className="p-4 font-bold" style={{ color:'var(--color-foreground)' }}>{item.available.toLocaleString('fr-FR', { minimumFractionDigits:1, maximumFractionDigits:1 })} t</td>
                    <td className="p-4">
                      <span className="px-2 py-1 rounded-full text-xs font-medium" style={{
                        background: item.available > 50 ? 'rgba(34,197,94,0.12)' : item.available > 10 ? 'rgba(214,158,46,0.12)' : 'rgba(239,68,68,0.12)',
                        color:      item.available > 50 ? 'var(--color-success)'  : item.available > 10 ? 'var(--color-warning)'  : 'var(--color-error)',
                      }}>
                        {item.available > 50 ? 'Bon' : item.available > 10 ? 'Faible' : 'Critique'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Nouveau Rapport */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="rounded-xl p-6 w-full max-w-md" style={{ background:'var(--color-card)' }}>
            <h3 className="text-lg font-semibold mb-4" style={{ color:'var(--color-foreground)' }}>Créer un Rapport</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color:'var(--color-foreground)' }}>Nom *</label>
                <input type="text" value={newReport.name} onChange={e => setNewReport(r => ({...r, name:e.target.value}))}
                  className="w-full p-2 rounded border" placeholder="ex: Rapport Mensuel Avril"
                  style={{ borderColor:'var(--color-border)', background:'var(--color-background)', color:'var(--color-foreground)' }} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color:'var(--color-foreground)' }}>Type</label>
                <select value={newReport.type} onChange={e => setNewReport(r => ({...r, type:e.target.value}))}
                  className="w-full p-2 rounded border"
                  style={{ borderColor:'var(--color-border)', background:'var(--color-background)', color:'var(--color-foreground)' }}>
                  <option value="production">Production</option>
                  <option value="financial">Financier</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="fuel">Carburant</option>
                  <option value="oil">Huile</option>
                  <option value="summary">Synthèse Globale</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color:'var(--color-foreground)' }}>Période *</label>
                <input type="text" value={newReport.period} onChange={e => setNewReport(r => ({...r, period:e.target.value}))}
                  className="w-full p-2 rounded border" placeholder="ex: Avril 2026"
                  style={{ borderColor:'var(--color-border)', background:'var(--color-background)', color:'var(--color-foreground)' }} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color:'var(--color-foreground)' }}>Format</label>
                <select value={newReport.format} onChange={e => setNewReport(r => ({...r, format:e.target.value}))}
                  className="w-full p-2 rounded border"
                  style={{ borderColor:'var(--color-border)', background:'var(--color-background)', color:'var(--color-foreground)' }}>
                  <option value="PDF">PDF</option>
                  <option value="Excel">Excel</option>
                  <option value="CSV">CSV</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6 justify-end">
              <Button variant="outline" onClick={() => setShowNewModal(false)}>Annuler</Button>
              <Button variant="default" onClick={handleCreate}>Créer</Button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
