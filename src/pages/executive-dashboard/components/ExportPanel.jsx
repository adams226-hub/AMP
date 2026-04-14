import React, { useState } from "react";
import Icon from "components/AppIcon";
import Button from "components/ui/Button";
import { miningService } from "../../../config/supabase";

export default function ExportPanel() {
  const [exporting, setExporting] = useState(null);
  const [dateRange, setDateRange] = useState("month");

  // Générer le contenu du rapport de production avec données réelles
  const generateProductionReport = async () => {
    try {
      const { startDate, endDate } = getDateRange();

      // Récupérer les données de production depuis la base
      const productionResponse = await miningService.getProductionData(startDate, endDate);
      const rawProductionData = productionResponse.data || [];

      // Aplatir les données de production
      const productionData = [];
      rawProductionData.forEach(production => {
        if (production.production_details && Array.isArray(production.production_details)) {
          production.production_details.forEach(detail => {
            productionData.push({
              ...production,
              dimension: detail.dimension,
              quantity: detail.quantity
            });
          });
        }
      });

      // Calculer les totaux par dimension
      const dimensionTotals = {};
      let totalProduction = 0;

      productionData.forEach(item => {
        const dimension = item.dimension || item.dimension_name;
        const quantity = parseFloat(item.quantity || item.total_quantity || 0);
        dimensionTotals[dimension] = (dimensionTotals[dimension] || 0) + quantity;
        totalProduction += quantity;
      });

      let content = "RAPPORT DE PRODUCTION\n";
      content += "=".repeat(50) + "\n";
      content += `Période: ${formatDateRange(startDate, endDate)}\n`;
      content += `Date: ${new Date().toLocaleDateString('fr-FR')}\n\n`;
      content += "PRODUCTION PAR DIMENSION\n";
      content += "-".repeat(50) + "\n";

      Object.entries(dimensionTotals).forEach(([dim, qty]) => {
        const pct = totalProduction > 0 ? ((qty / totalProduction) * 100).toFixed(1) : '0.0';
        content += `${dim}: ${qty.toFixed(1)} tonnes (${pct}%)\n`;
      });

      content += `\nTotal: ${totalProduction.toFixed(1)} tonnes\n`;
      content += `\nGénéré par African Mining Partenair SA Platform\n${new Date().toLocaleString()}`;

      return content;
    } catch (error) {
      console.error('Erreur génération rapport production:', error);
      return "Erreur lors de la génération du rapport de production";
    }
  };

  // Générer le contenu du rapport de carburant avec données réelles
  const generateFuelReport = async () => {
    try {
      const { startDate, endDate } = getDateRange();

      // Récupérer les données de carburant depuis la base
      const fuelResponse = await miningService.getFuelTransactions(startDate, endDate);
      const fuelData = fuelResponse.data || [];

      let content = "RAPPORT DE CARBURANT\n";
      content += "=".repeat(50) + "\n";
      content += `Période: ${formatDateRange(startDate, endDate)}\n`;
      content += `Date: ${new Date().toLocaleDateString('fr-FR')}\n\n`;
      content += "CONSOMMATION PAR ÉQUIPEMENT\n";
      content += "-".repeat(50) + "\n";

      let totalQty = 0;
      let totalCost = 0;

      fuelData.forEach(f => {
        const quantity = parseFloat(f.quantity || 0);
        const cost = parseFloat(f.total_cost || 0);
        const equipmentName = f.equipment?.name || f.equipment_name || 'Équipement inconnu';

        content += `${f.transaction_date} - ${equipmentName}: ${quantity.toFixed(1)}L (${cost.toFixed(0)}FCFA)\n`;
        totalQty += quantity;
        totalCost += cost;
      });

      content += `\nTotal: ${totalQty.toFixed(1)}L - Coût: ${totalCost.toFixed(0)}FCFA\n`;
      content += `\nGénéré par African Mining Partenair SA Platform\n${new Date().toLocaleString()}`;

      return content;
    } catch (error) {
      console.error('Erreur génération rapport carburant:', error);
      return "Erreur lors de la génération du rapport de carburant";
    }
  };

  // Générer le contenu du rapport financier avec données réelles
  const generateFinancialReport = async () => {
    try {
      const { startDate, endDate } = getDateRange();

      // Récupérer les données financières depuis la base
      const financialResponse = await miningService.getFinancialTransactions(startDate, endDate);
      const financialData = financialResponse.data || [];

      const income = financialData.filter(t => t.type === 'income');
      const expenses = financialData.filter(t => t.type === 'expense');

      const totalIncome = income.reduce((sum, i) => sum + parseFloat(i.amount || 0), 0);
      const totalExpenses = expenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
      const profit = totalIncome - totalExpenses;

      let content = "RAPPORT FINANCIER\n";
      content += "=".repeat(50) + "\n";
      content += `Période: ${formatDateRange(startDate, endDate)}\n`;
      content += `Date: ${new Date().toLocaleDateString('fr-FR')}\n\n`;

      content += "REVENUS\n";
      content += "-".repeat(30) + "\n";
      income.forEach(i => {
        content += `${i.category}: ${parseFloat(i.amount || 0).toFixed(2)}FCFA\n`;
      });
      content += `Total Revenus: ${totalIncome.toFixed(2)}FCFA\n\n`;

      content += "DÉPENSES\n";
      content += "-".repeat(30) + "\n";
      expenses.forEach(e => {
        content += `${e.category}: ${parseFloat(e.amount || 0).toFixed(2)}FCFA\n`;
      });
      content += `Total Dépenses: ${totalExpenses.toFixed(2)}FCFA\n\n`;

      content += "RÉSULTAT\n";
      content += "-".repeat(30) + "\n";
      content += `Bénéfice Net: ${profit.toFixed(2)}FCFA\n`;
      content += `Marge: ${totalIncome > 0 ? ((profit / totalIncome) * 100).toFixed(1) : '0.0'}%\n`;
      content += `\nGénéré par African Mining Partenair SA Platform\n${new Date().toLocaleString()}`;

      return content;
    } catch (error) {
      console.error('Erreur génération rapport financier:', error);
      return "Erreur lors de la génération du rapport financier";
    }
  };

  // Générer le contenu du rapport équipement avec données réelles
  const generateEquipmentReport = async () => {
    try {
      // Récupérer les données d'équipement depuis la base
      const equipmentResponse = await miningService.getEquipment();
      const equipmentData = equipmentResponse.data || [];

      let content = "RAPPORT ÉQUIPEMENTS\n";
      content += "=".repeat(50) + "\n";
      content += `Période: ${dateRange === 'day' ? "Aujourd'hui" : dateRange === 'week' ? "Cette semaine" : dateRange === 'month' ? "Ce mois" : "Trimestre"}\n`;
      content += `Date: ${new Date().toLocaleDateString('fr-FR')}\n\n`;
      content += "STATUT DES ÉQUIPEMENTS\n";
      content += "-".repeat(50) + "\n";

      equipmentData.forEach(e => {
        content += `${e.name}\n`;
        content += `  Statut: ${e.status || 'Inconnu'}\n`;
        content += `  Heures: ${parseFloat(e.operating_hours || 0).toFixed(1)}h\n`;
        content += `  Type: ${e.type || 'Inconnu'}\n\n`;
      });

      const activeCount = equipmentData.filter(e => e.status === 'active').length;
      const totalCount = equipmentData.length;

      content += `Équipements actifs: ${activeCount}/${totalCount}\n`;
      content += `\nGénéré par African Mining Partenair SA Platform\n${new Date().toLocaleString()}`;

      return content;
    } catch (error) {
      console.error('Erreur génération rapport équipement:', error);
      return "Erreur lors de la génération du rapport d'équipement";
    }
  };

  // Fonctions utilitaires pour les dates
  const getDateRange = () => {
    const now = new Date();
    let startDate, endDate;

    switch (dateRange) {
      case 'day':
        startDate = new Date(now);
        endDate = new Date(now);
        break;
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - now.getDay());
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case 'quarter':
        const quarterStart = Math.floor(now.getMonth() / 3) * 3;
        startDate = new Date(now.getFullYear(), quarterStart, 1);
        endDate = new Date(now.getFullYear(), quarterStart + 3, 0);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }

    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    };
  };

  const formatDateRange = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start.toDateString() === end.toDateString()) {
      return `Le ${start.toLocaleDateString('fr-FR')}`;
    } else {
      return `Du ${start.toLocaleDateString('fr-FR')} au ${end.toLocaleDateString('fr-FR')}`;
    }
  };

  // Fonction pour télécharger un fichier
  const downloadFile = (content, filename, type = 'text/plain;charset=utf-8') => {
    const blob = new Blob(['\ufeff', content], { type });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };


  // Fonction pour exporter en PDF
  const handleExportPDF = async () => {
    setExporting("pdf");
    try {
      const { startDate, endDate } = getDateRange();
      const periodLabel = formatDateRange(startDate, endDate);

      // ── Chargement parallèle de toutes les données ────────────
      const [productionResponse, fuelResponse, financialResponse, equipmentResponse, stockSummaryRes, oilResponse] = await Promise.all([
        miningService.getProductionData(startDate, endDate),
        miningService.getFuelTransactions(startDate, endDate),
        miningService.getFinancialTransactions(startDate, endDate),
        miningService.getEquipment(),
        miningService.getStockSummary(),
        miningService.getOilTransactions(),
      ]);

      const rawProductionData = productionResponse.data || [];
      const fuelData          = fuelResponse.data || [];
      const financialData     = financialResponse.data || [];
      const equipmentData     = equipmentResponse.data || [];
      const stockSummary      = stockSummaryRes.data || [];
      const oilData           = oilResponse.data || [];

      // ── Production par dimension ────────────────────────────────
      const dimensionTotals = {};
      rawProductionData.forEach(prod => {
        (prod.production_details || []).forEach(d => {
          const dim = d.dimension || 'Inconnu';
          dimensionTotals[dim] = (dimensionTotals[dim] || 0) + parseFloat(d.quantity || 0);
        });
      });
      const totalProduction = Object.values(dimensionTotals).reduce((a, b) => a + b, 0);

      // ── Financier ───────────────────────────────────────────────
      const totalIncome   = financialData.filter(t => t.type === 'income').reduce((s, i) => s + parseFloat(i.amount || 0), 0);
      const totalExpenses = financialData.filter(t => t.type === 'expense').reduce((s, e) => s + parseFloat(e.amount || 0), 0);
      const benefice      = totalIncome - totalExpenses;

      // Dépenses par catégorie
      const expByCat = {};
      financialData.filter(t => t.type === 'expense').forEach(t => {
        const cat = t.category || 'Autre';
        expByCat[cat] = (expByCat[cat] || 0) + parseFloat(t.amount || 0);
      });

      // ── Carburant par engin (sorties uniquement, avec engin associé) ──
      const fuelByEngin = {};
      fuelData.forEach(f => {
        if (f.transaction_type !== 'exit') return; // ignorer les entrées en stock
        const name = f.equipment?.name || null;
        if (!name) return; // ignorer les sorties sans engin associé
        fuelByEngin[name] = (fuelByEngin[name] || 0) + parseFloat(f.quantity || 0);
      });

      // ── Huile par engin ─────────────────────────────────────────
      // Toutes les transactions avec un engin = consommation (entry = ravitaillement engin)
      const oilByEngin = {};
      oilData.forEach(o => {
        const name = o.equipment?.name || null;
        if (!name) return; // ignorer les transactions sans engin associé
        oilByEngin[name] = (oilByEngin[name] || 0) + parseFloat(o.quantity || 0);
      });

      // ── Stock par dimension (entrées, sorties, disponible) ──────
      const stockWithData = stockSummary.filter(s => s.entries > 0 || s.exits > 0 || s.available > 0);
      const totalStockAvailable = stockWithData.reduce((a, s) => a + s.available, 0);

      // ── Totaux pour KPIs ────────────────────────────────────────
      const totalFuel      = Object.values(fuelByEngin).reduce((a, b) => a + b, 0);
      const totalOil       = Object.values(oilByEngin).reduce((a, b) => a + b, 0);
      const activeCount    = equipmentData.filter(e => e.status === 'active').length;

      // ── Sérialisation JSON pour Chart.js ───────────────────────
      const prodLabels   = JSON.stringify(Object.keys(dimensionTotals));
      const prodValues   = JSON.stringify(Object.values(dimensionTotals).map(v => parseFloat(v.toFixed(2))));
      const stockLabels  = JSON.stringify(stockWithData.map(s => s.dimension));
      const stockAvail   = JSON.stringify(stockWithData.map(s => parseFloat(s.available.toFixed(2))));
      const fuelLabels   = JSON.stringify(Object.keys(fuelByEngin));
      const fuelValues   = JSON.stringify(Object.values(fuelByEngin).map(v => parseFloat(v.toFixed(1))));
      const oilLabels    = JSON.stringify(Object.keys(oilByEngin));
      const oilValues    = JSON.stringify(Object.values(oilByEngin).map(v => parseFloat(v.toFixed(1))));
      const expCatLabels = JSON.stringify(Object.keys(expByCat));
      const expCatValues = JSON.stringify(Object.values(expByCat).map(v => parseFloat(v.toFixed(0))));

      // ── Lignes des tableaux HTML ────────────────────────────────
      const prodRows = Object.entries(dimensionTotals).map(([dim, qty]) =>
        `<tr><td>${dim}</td><td>${qty.toFixed(1)}</td><td>${totalProduction > 0 ? ((qty/totalProduction)*100).toFixed(1) : '0.0'}%</td></tr>`
      ).join('') || `<tr><td colspan="3" style="text-align:center;color:#999">Aucune production enregistr&#233;e</td></tr>`;

      const stockRows = stockWithData.map(s =>
        `<tr><td>${s.dimension}</td><td>${Number(s.entries).toFixed(1)}</td><td>${Number(s.exits).toFixed(1)}</td><td><strong>${Number(s.available).toFixed(1)}</strong></td></tr>`
      ).join('') || `<tr><td colspan="4" style="text-align:center;color:#999">Aucune donn&#233;e de stock</td></tr>`;

      const fuelRows = Object.entries(fuelByEngin).sort((a,b) => b[1]-a[1]).map(([name, qty]) =>
        `<tr><td>${name}</td><td>${qty.toFixed(1)} L</td></tr>`
      ).join('') || `<tr><td colspan="2" style="text-align:center;color:#999">Aucune consommation enregistr&#233;e</td></tr>`;

      const oilRows = Object.entries(oilByEngin).sort((a,b) => b[1]-a[1]).map(([name, qty]) =>
        `<tr><td>${name}</td><td>${qty.toFixed(1)} L</td></tr>`
      ).join('') || `<tr><td colspan="2" style="text-align:center;color:#999">Aucune consommation enregistr&#233;e</td></tr>`;

      const eqRows = equipmentData.map(e =>
        `<tr><td>${e.name || '-'}</td><td>${e.status === 'active' ? '&#x2705; Actif' : '&#x26A0; ' + (e.status || 'Inconnu')}</td><td>${parseFloat(e.operating_hours || 0).toFixed(1)} h</td></tr>`
      ).join('') || `<tr><td colspan="3" style="text-align:center;color:#999">Aucun &#233;quipement</td></tr>`;

      const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Rapport ROMBAT &#8211; ${periodLabel}</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"><\/script>
  <style>
    * { box-sizing: border-box; }
    body { font-family: Arial, sans-serif; padding: 36px 48px; max-width: 960px; margin: 0 auto; color: #222; }
    h1 { color: #1a5c1a; border-bottom: 3px solid #1a5c1a; padding-bottom: 10px; font-size: 24px; margin-bottom: 4px; }
    h2 { color: #1a5c1a; font-size: 15px; margin: 28px 0 8px; border-left: 4px solid #1a5c1a; padding-left: 10px; }
    .meta { font-size: 13px; color: #555; margin: 3px 0; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 8px; font-size: 13px; }
    th, td { border: 1px solid #ddd; padding: 7px 10px; text-align: left; }
    th { background: #1a5c1a; color: #fff; font-weight: 600; }
    tr:nth-child(even) td { background: #f6faf6; }
    .total td { font-weight: bold; background: #d7f0d7 !important; }
    .chart-wrap { margin: 12px 0 28px; height: 220px; }
    .chart-wrap-sm { margin: 12px 0 28px; height: 200px; }
    .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
    .badge-active { color: #1a5c1a; font-weight: bold; }
    .kpi-row { display: flex; gap: 12px; margin: 12px 0 24px; flex-wrap: wrap; }
    .kpi { flex: 1; min-width: 120px; background: #f6faf6; border: 1px solid #c8e6c9; border-radius: 8px; padding: 12px 14px; text-align: center; }
    .kpi-val { font-size: 18px; font-weight: bold; color: #1a5c1a; }
    .kpi-lbl { font-size: 10px; color: #555; margin-top: 4px; }
    .footer { margin-top: 32px; font-size: 11px; color: #888; text-align: center; border-top: 1px solid #e0e0e0; padding-top: 12px; }
    @media print {
      body { padding: 16px 24px; }
      .chart-wrap, .chart-wrap-sm { height: 190px; page-break-inside: avoid; }
      h2 { page-break-after: avoid; }
      .two-col { grid-template-columns: 1fr 1fr; }
    }
  </style>
</head>
<body>

  <h1>African Mining Partenair SA</h1>
  <p class="meta"><strong>P&#233;riode :</strong> ${periodLabel}</p>
  <p class="meta"><strong>G&#233;n&#233;r&#233; le :</strong> ${new Date().toLocaleDateString('fr-FR')}</p>

  <!-- KPIs -->
  <div class="kpi-row">
    <div class="kpi"><div class="kpi-val">${totalProduction.toFixed(1)} t</div><div class="kpi-lbl">Production totale</div></div>
    <div class="kpi"><div class="kpi-val">${totalStockAvailable.toFixed(1)} t</div><div class="kpi-lbl">Stock disponible</div></div>
    <div class="kpi"><div class="kpi-val">${totalFuel.toFixed(0)} L</div><div class="kpi-lbl">Carburant consomm&#233;</div></div>
    <div class="kpi"><div class="kpi-val">${totalOil.toFixed(0)} L</div><div class="kpi-lbl">Huile consomm&#233;e</div></div>
    <div class="kpi"><div class="kpi-val">${totalIncome.toLocaleString('fr-FR', {maximumFractionDigits:0})} FCFA</div><div class="kpi-lbl">Revenus</div></div>
    <div class="kpi"><div class="kpi-val" style="color:${benefice >= 0 ? '#1a5c1a' : '#c62828'}">${benefice.toLocaleString('fr-FR', {maximumFractionDigits:0})} FCFA</div><div class="kpi-lbl">B&#233;n&#233;fice net</div></div>
    <div class="kpi"><div class="kpi-val">${activeCount}/${equipmentData.length}</div><div class="kpi-lbl">Engins actifs</div></div>
  </div>

  <!-- 1. Production -->
  <h2>1. Production par Dimension</h2>
  <table>
    <tr><th>Dimension</th><th>Quantit&#233; (tonnes)</th><th>Pourcentage</th></tr>
    ${prodRows}
    <tr class="total"><td>TOTAL</td><td>${totalProduction.toFixed(1)}</td><td>100 %</td></tr>
  </table>
  <div class="chart-wrap"><canvas id="prodChart"></canvas></div>

  <!-- 2. Stock par Dimension -->
  <h2>2. Stock par Dimension</h2>
  <table>
    <tr><th>Dimension</th><th>Entr&#233;es (t)</th><th>Sorties (t)</th><th>Disponible (t)</th></tr>
    ${stockRows}
    <tr class="total"><td>TOTAL</td><td></td><td></td><td>${totalStockAvailable.toFixed(1)}</td></tr>
  </table>
  <div class="chart-wrap"><canvas id="stockChart"></canvas></div>

  <!-- 3. Carburant & Huile (côte à côte) -->
  <div class="two-col">
    <div>
      <h2>3. Consommation Carburant par Engin</h2>
      <table>
        <tr><th>Engin</th><th>Consommation (L)</th></tr>
        ${fuelRows}
        <tr class="total"><td>TOTAL</td><td>${totalFuel.toFixed(1)} L</td></tr>
      </table>
      <div class="chart-wrap-sm"><canvas id="fuelChart"></canvas></div>
    </div>
    <div>
      <h2>4. Consommation Huile par Engin</h2>
      <table>
        <tr><th>Engin</th><th>Consommation (L)</th></tr>
        ${oilRows}
        <tr class="total"><td>TOTAL</td><td>${totalOil.toFixed(1)} L</td></tr>
      </table>
      <div class="chart-wrap-sm"><canvas id="oilChart"></canvas></div>
    </div>
  </div>

  <!-- 5. Financier -->
  <h2>5. R&#233;sum&#233; Financier</h2>
  <table>
    <tr><th>Cat&#233;gorie</th><th>Montant (FCFA)</th></tr>
    <tr><td>Revenus</td><td>${totalIncome.toLocaleString('fr-FR', {minimumFractionDigits:2, maximumFractionDigits:2})}</td></tr>
    <tr><td>D&#233;penses</td><td>${totalExpenses.toLocaleString('fr-FR', {minimumFractionDigits:2, maximumFractionDigits:2})}</td></tr>
    <tr class="total"><td>B&#233;n&#233;fice Net</td><td style="color:${benefice >= 0 ? '#1a5c1a' : '#c62828'}">${benefice.toLocaleString('fr-FR', {minimumFractionDigits:2, maximumFractionDigits:2})}</td></tr>
  </table>

  <!-- 6. Dépenses par catégorie (côte à côte avec le graphique) -->
  <div class="two-col">
    <div>
      <h2>6. R&#233;partition des D&#233;penses</h2>
      <table>
        <tr><th>Cat&#233;gorie</th><th>Montant (FCFA)</th></tr>
        ${Object.entries(expByCat).sort((a,b)=>b[1]-a[1]).map(([cat, val]) =>
          `<tr><td>${cat}</td><td>${val.toLocaleString('fr-FR', {maximumFractionDigits:0})}</td></tr>`
        ).join('') || `<tr><td colspan="2" style="text-align:center;color:#999">Aucune d&#233;pense</td></tr>`}
      </table>
    </div>
    <div style="display:flex;align-items:center;">
      <div style="width:100%;height:220px;"><canvas id="expCatChart"></canvas></div>
    </div>
  </div>

  <!-- 7. Équipements -->
  <h2>7. Statut des &#201;quipements</h2>
  <table>
    <tr><th>&#201;quipement</th><th>Statut</th><th>Heures op.</th></tr>
    ${eqRows}
  </table>
  <p class="meta">&#201;quipements actifs : <span class="badge-active">${activeCount} / ${equipmentData.length}</span></p>

  <div class="footer">
    G&#233;n&#233;r&#233; par African Mining Partenair SA Platform &mdash; ${new Date().toLocaleString('fr-FR')}
  </div>

  <script>
    var GREENS  = ['#1a5c1a','#2d8b2d','#4caf50','#81c784','#388e3c','#66bb6a','#a5d6a7','#c8e6c9'];
    var BLUES   = ['#0288d1','#0277bd','#039be5','#29b6f6','#4fc3f7','#81d4fa','#b3e5fc'];
    var PALETTE = ['#1a5c1a','#c62828','#0288d1','#dd6b20','#805ad5','#d69e2e','#38a169','#e91e63','#00bcd4','#ff7043'];

    function barChart(id, labels, data, suffix, colors) {
      var ctx = document.getElementById(id);
      if (!ctx || !labels || !labels.length) return;
      new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{ data: data, backgroundColor: colors || labels.map(function(_,i){ return GREENS[i%GREENS.length]; }), borderRadius: 5, borderSkipped: false }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false }, tooltip: { callbacks: { label: function(c){ return c.parsed.y.toLocaleString('fr-FR') + ' ' + suffix; } } } },
          scales: { x: { grid: { display: false } }, y: { beginAtZero: true, ticks: { callback: function(v){ return v.toLocaleString('fr-FR'); } } } }
        }
      });
    }

    function pieChart(id, labels, data, colors) {
      var ctx = document.getElementById(id);
      if (!ctx || !labels || !labels.length) return;
      new Chart(ctx, {
        type: 'doughnut',
        data: { labels: labels, datasets: [{ data: data, backgroundColor: colors || labels.map(function(_,i){ return PALETTE[i%PALETTE.length]; }), borderWidth: 2, borderColor: '#fff' }] },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { position: 'right', labels: { font: { size: 11 }, boxWidth: 14, padding: 8 } }, tooltip: { callbacks: { label: function(c){ return c.label + ': ' + c.parsed.toLocaleString('fr-FR') + ' FCFA'; } } } }
        }
      });
    }

    window.onload = function() {
      barChart('prodChart',  ${prodLabels},  ${prodValues},  't');
      barChart('stockChart', ${stockLabels}, ${stockAvail}, 't');
      barChart('fuelChart',  ${fuelLabels},  ${fuelValues},  'L', ${fuelLabels}.map(function(_,i){ return BLUES[i%BLUES.length]; }));
      barChart('oilChart',   ${oilLabels},   ${oilValues},   'L', ${oilLabels}.map(function(_,i){ return ['#dd6b20','#e07d10','#f6a21e','#f6c346','#fbd38d'][i%5]; }));
      pieChart('expCatChart', ${expCatLabels}, ${expCatValues});
      setTimeout(function(){ window.print(); }, 1000);
    };
  <\/script>
</body>
</html>`;

      downloadFile(html, `ROMBAT_Rapport_${dateRange}_${new Date().toISOString().split('T')[0]}.html`, 'text/html;charset=utf-8');
      setTimeout(() => setExporting(null), 1200);
    } catch (error) {
      console.error('Erreur export PDF:', error);
      setExporting(null);
      alert('Erreur lors de l\'export PDF: ' + error.message);
    }
  };

  // Fonction pour exporter en Excel (CSV)
  const handleExportExcel = async () => {
    setExporting("excel");

    try {
      const { startDate, endDate } = getDateRange();

      // Récupérer les données réelles
      const [productionResponse, financialResponse] = await Promise.all([
        miningService.getProductionData(startDate, endDate),
        miningService.getFinancialTransactions(startDate, endDate)
      ]);

      // Extraire et aplatir les données
      const rawProductionData = productionResponse.data || [];
      const financialData = financialResponse.data || [];

      const productionData = [];
      rawProductionData.forEach(production => {
        if (production.production_details && Array.isArray(production.production_details)) {
          production.production_details.forEach(detail => {
            productionData.push({
              ...production,
              dimension: detail.dimension,
              quantity: detail.quantity
            });
          });
        }
      });

      // Calculer les totaux de production
      const dimensionTotals = {};
      productionData.forEach(item => {
        const dimension = item.dimension || item.dimension_name;
        const quantity = parseFloat(item.quantity || item.total_quantity || 0);
        dimensionTotals[dimension] = (dimensionTotals[dimension] || 0) + quantity;
      });

      const totalProduction = Object.values(dimensionTotals).reduce((a, b) => a + b, 0);
      const periodLabel = formatDateRange(startDate, endDate);

      // Créer un CSV avec les données
      const csvData = [
        ['ROMBAT Mining Platform - Export Excel'],
        [`Période: ${periodLabel}`],
        [`Date: ${new Date().toLocaleDateString('fr-FR')}`],
        [],
        ['DIMENSION', 'QUANTITÉ (tonnes)', 'POURCENTAGE']
      ];

      // Ajouter chaque dimension avec sa valeur
      Object.entries(dimensionTotals).forEach(([dim, qty]) => {
        const percentage = totalProduction > 0 ? ((qty / totalProduction) * 100).toFixed(1) : '0.0';
        csvData.push([dim, qty.toFixed(1), percentage + '%']);
      });

      // Ajouter le total
      csvData.push(['TOTAL', totalProduction.toFixed(1), '100%']);
      csvData.push([]);
      csvData.push(['RÉSUMÉ FINANCIER']);

      const income = financialData.filter(t => t.type === 'income');
      const expenses = financialData.filter(t => t.type === 'expense');
      const totalIncome = income.reduce((sum, i) => sum + parseFloat(i.amount || 0), 0);
      const totalExpenses = expenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);

      csvData.push(['Revenus', totalIncome.toFixed(2)]);
      csvData.push(['Dépenses', totalExpenses.toFixed(2)]);
      csvData.push(['Bénéfice', (totalIncome - totalExpenses).toFixed(2)]);

      const csvContent = csvData.map(row => row.join(';')).join('\n');
      downloadFile(csvContent, `ROMBAT_Export_${dateRange}_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');

      setTimeout(() => setExporting(null), 1000);
    } catch (error) {
      console.error('Erreur export Excel:', error);
      setExporting(null);
      alert('Erreur lors de l\'export Excel: ' + error.message);
    }
  };

  // Fonction pour télécharger un rapport spécifique
  const handleDownloadReport = async (reportType) => {
    setExporting(reportType);

    try {
      let content, filename;

      switch (reportType) {
        case 'report-0': // Production
          content = await generateProductionReport();
          filename = `ROMBAT_Rapport_Production_${new Date().toISOString().split('T')[0]}.txt`;
          break;
        case 'report-1': // Carburant
          content = await generateFuelReport();
          filename = `ROMBAT_Rapport_Carburant_${new Date().toISOString().split('T')[0]}.txt`;
          break;
        case 'report-2': // Financier
          content = await generateFinancialReport();
          filename = `ROMBAT_Rapport_Financier_${new Date().toISOString().split('T')[0]}.txt`;
          break;
        case 'report-3': // Équipement
          content = await generateEquipmentReport();
          filename = `ROMBAT_Rapport_Equipement_${new Date().toISOString().split('T')[0]}.txt`;
          break;
        default:
          content = "Rapport African Mining Partenair SA";
          filename = `ROMBAT_Rapport_${new Date().toISOString().split('T')[0]}.txt`;
      }

      downloadFile(content, filename);
      setTimeout(() => setExporting(null), 1000);
    } catch (error) {
      console.error('Erreur génération rapport:', error);
      setExporting(null);
      alert('Erreur lors de la génération du rapport: ' + error.message);
    }
  };

  return (
    <div
      className="rounded-xl border p-4 md:p-5"
      style={{
        background: "var(--color-card)",
        borderColor: "var(--color-border)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <div className="flex items-center gap-2 mb-4">
        <Icon name="Download" size={18} color="var(--color-primary)" />
        <h3
          className="text-base font-semibold"
          style={{ color: "var(--color-foreground)", fontFamily: "var(--font-heading)" }}
        >
          Export & Rapports
        </h3>
      </div>
      {/* Period selector */}
      <div className="mb-4">
        <p
          className="text-xs font-medium mb-2"
          style={{ color: "var(--color-muted-foreground)", fontFamily: "var(--font-caption)" }}
        >
          Période
        </p>
        <div className="flex flex-wrap gap-2">
          {[
            { key: "day", label: "Aujourd'hui" },
            { key: "week", label: "Cette semaine" },
            { key: "month", label: "Ce mois" },
            { key: "quarter", label: "Trimestre" },
          ]?.map((p) => (
            <button
              key={p?.key}
              onClick={() => setDateRange(p?.key)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 border"
              style={{
                background: dateRange === p?.key ? "var(--color-primary)" : "transparent",
                color: dateRange === p?.key ? "#fff" : "var(--color-muted-foreground)",
                borderColor: dateRange === p?.key ? "var(--color-primary)" : "var(--color-border)",
                fontFamily: "var(--font-caption)",
              }}
            >
              {p?.label}
            </button>
          ))}
        </div>
      </div>
      {/* Export buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Button
          variant="outline"
          iconName="FileText"
          iconPosition="left"
          loading={exporting === "pdf"}
          onClick={handleExportPDF}
          fullWidth
        >
          Exporter PDF
        </Button>
        <Button
          variant="success"
          iconName="FileSpreadsheet"
          iconPosition="left"
          loading={exporting === "excel"}
          onClick={handleExportExcel}
          fullWidth
        >
          Exporter Excel
        </Button>
      </div>
      {/* Report types */}
      <div className="mt-4 space-y-2">
        <p
          className="text-xs font-medium"
          style={{ color: "var(--color-muted-foreground)", fontFamily: "var(--font-caption)" }}
        >
          Rapports disponibles
        </p>
        {[
          { icon: "BarChart3", label: "Rapport de Production", badge: "Nouveau" },
          { icon: "Fuel", label: "Rapport Carburant", badge: null },
          { icon: "Calculator", label: "Rapport Financier", badge: null },
          { icon: "Wrench", label: "Rapport Équipement", badge: null },
        ]?.map((r, i) => (
          <button
            key={i}
            onClick={() => handleDownloadReport(`report-${i}`)}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg border transition-all duration-200 hover:bg-muted/50"
            style={{ borderColor: "var(--color-border)" }}
          >
            <Icon name={r?.icon} size={15} color="var(--color-primary)" />
            <span
              className="flex-1 text-left text-sm"
              style={{ color: "var(--color-foreground)", fontFamily: "var(--font-caption)" }}
            >
              {r?.label}
            </span>
            {r?.badge && (
              <span
                className="px-1.5 py-0.5 rounded text-xs font-semibold"
                style={{
                  background: "rgba(44,85,48,0.12)",
                  color: "var(--color-primary)",
                  fontFamily: "var(--font-caption)",
                }}
              >
                {r?.badge}
              </span>
            )}
            <Icon name="Download" size={13} color="var(--color-muted-foreground)" />
          </button>
        ))}
      </div>
    </div>
  );
}