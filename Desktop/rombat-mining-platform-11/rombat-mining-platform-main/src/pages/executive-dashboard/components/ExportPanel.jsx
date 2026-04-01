import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "components/AppIcon";
import Button from "components/ui/Button";
import { miningService, supabase } from "../../../config/supabase";

export default function ExportPanel() {
  const navigate = useNavigate();
  const [exporting, setExporting] = useState(null);
  const [dateRange, setDateRange] = useState("month");

  // Données réelles depuis Supabase
  const [productionData, setProductionData] = useState([]);
  const [fuelData, setFuelData] = useState([]);
  const [financialData, setFinancialData] = useState([]);
  const [equipmentData, setEquipmentData] = useState([]);

  // Calcul des bornes de date selon la période sélectionnée
  const getDateBounds = (range) => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    let from;
    if (range === 'day') {
      from = today;
    } else if (range === 'week') {
      const day = now.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      const monday = new Date(now);
      monday.setDate(now.getDate() + diff);
      from = monday.toISOString().split('T')[0];
    } else if (range === 'month') {
      from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    } else {
      // trimestre
      const q = Math.floor(now.getMonth() / 3);
      from = new Date(now.getFullYear(), q * 3, 1).toISOString().split('T')[0];
    }
    return { from, to: today };
  };

  const periodLabel = dateRange === 'day' ? "Aujourd'hui"
    : dateRange === 'week' ? "Cette semaine"
    : dateRange === 'month' ? "Ce mois"
    : "Trimestre";

  // Chargement des données depuis Supabase selon la période
  useEffect(() => {
    const { from, to } = getDateBounds(dateRange);
    fetchAllData(from, to);
  }, [dateRange]);

  const fetchAllData = async (from, to) => {
    const [prodRes, fuelRes, finRes, eqRes] = await Promise.all([
      supabase
        .from('production')
        .select('*, production_details(dimension, quantity)')
        .gte('date', from).lte('date', to)
        .order('date', { ascending: false }),
      supabase
        .from('fuel_transactions')
        .select('*, equipment:equipment_id(name)')
        .gte('transaction_date', from).lte('transaction_date', to)
        .order('transaction_date', { ascending: false }),
      supabase
        .from('financial_transactions')
        .select('*')
        .gte('transaction_date', from).lte('transaction_date', to),
      supabase
        .from('equipment')
        .select('*')
        .neq('status', 'retired'),
    ]);

    setProductionData(prodRes.data || []);
    setFuelData(fuelRes.data || []);
    setFinancialData(finRes.data || []);
    setEquipmentData(eqRes.data || []);
  };

  // ─── Générateurs de rapport ───────────────────────────────────

  const generateProductionReport = () => {
    // Agréger par dimension
    const dimMap = {};
    productionData.forEach(p => {
      (p.production_details || []).forEach(d => {
        dimMap[d.dimension] = (dimMap[d.dimension] || 0) + parseFloat(d.quantity || 0);
      });
    });

    const total = Object.values(dimMap).reduce((a, b) => a + b, 0);
    let content = "RAPPORT DE PRODUCTION\n";
    content += "=".repeat(50) + "\n";
    content += `Période: ${periodLabel}\n`;
    content += `Date: ${new Date().toLocaleDateString('fr-FR')}\n\n`;

    if (total === 0) {
      content += "Aucune donnée de production pour cette période.\n";
    } else {
      content += "PRODUCTION PAR DIMENSION\n";
      content += "-".repeat(50) + "\n";
      Object.entries(dimMap).sort((a, b) => b[1] - a[1]).forEach(([dim, qty]) => {
        const pct = ((qty / total) * 100).toFixed(1);
        content += `${dim}: ${qty.toFixed(2)} tonnes (${pct}%)\n`;
      });
      content += `\nTotal: ${total.toFixed(2)} tonnes\n`;
      content += `Nombre d'entrées: ${productionData.length}\n`;
    }

    content += `\nGénéré par Amp Mines et Carrieres Platform\n${new Date().toLocaleString('fr-FR')}`;
    return content;
  };

  const generateFuelReport = () => {
    const totalQty = fuelData.reduce((sum, f) => sum + parseFloat(f.quantity || 0), 0);
    const totalCost = fuelData.reduce((sum, f) => sum + parseFloat(f.total_cost || (f.quantity * f.cost_per_liter) || 0), 0);

    let content = "RAPPORT DE CARBURANT\n";
    content += "=".repeat(50) + "\n";
    content += `Période: ${periodLabel}\n`;
    content += `Date: ${new Date().toLocaleDateString('fr-FR')}\n\n`;

    if (fuelData.length === 0) {
      content += "Aucune transaction carburant pour cette période.\n";
    } else {
      content += "CONSOMMATION PAR ÉQUIPEMENT\n";
      content += "-".repeat(50) + "\n";
      fuelData.forEach(f => {
        const equipName = f.equipment?.name || 'Inconnu';
        const cost = parseFloat(f.total_cost || (f.quantity * f.cost_per_liter) || 0);
        content += `${f.transaction_date} - ${equipName}: ${parseFloat(f.quantity).toFixed(1)}L (${cost.toFixed(0)} FCFA)\n`;
      });
      content += `\nTotal: ${totalQty.toFixed(1)}L - Coût: ${totalCost.toFixed(0)} FCFA\n`;
    }

    content += `\nGénéré par Amp Mines et Carrieres Platform\n${new Date().toLocaleString('fr-FR')}`;
    return content;
  };

  const generateFinancialReport = () => {
    const income = financialData.filter(f => f.type === 'income');
    const expenses = financialData.filter(f => f.type === 'expense');
    const totalIncome = income.reduce((sum, f) => sum + parseFloat(f.amount || 0), 0);
    const totalExpenses = expenses.reduce((sum, f) => sum + parseFloat(f.amount || 0), 0);
    const profit = totalIncome - totalExpenses;

    let content = "RAPPORT FINANCIER\n";
    content += "=".repeat(50) + "\n";
    content += `Période: ${periodLabel}\n`;
    content += `Date: ${new Date().toLocaleDateString('fr-FR')}\n\n`;

    if (financialData.length === 0) {
      content += "Aucune transaction financière pour cette période.\n";
    } else {
      content += "REVENUS\n" + "-".repeat(30) + "\n";
      income.forEach(f => {
        content += `${f.transaction_date} - ${f.category || 'N/A'}: ${parseFloat(f.amount).toFixed(2)} FCFA\n`;
      });
      content += `Total Revenus: ${totalIncome.toFixed(2)} FCFA\n\n`;

      content += "DÉPENSES\n" + "-".repeat(30) + "\n";
      expenses.forEach(f => {
        content += `${f.transaction_date} - ${f.category || 'N/A'}: ${parseFloat(f.amount).toFixed(2)} FCFA\n`;
      });
      content += `Total Dépenses: ${totalExpenses.toFixed(2)} FCFA\n\n`;

      content += "RÉSULTAT\n" + "-".repeat(30) + "\n";
      content += `Bénéfice Net: ${profit.toFixed(2)} FCFA\n`;
      if (totalIncome > 0) {
        content += `Marge: ${((profit / totalIncome) * 100).toFixed(1)}%\n`;
      }
    }

    content += `\nGénéré par Amp Mines et Carrieres Platform\n${new Date().toLocaleString('fr-FR')}`;
    return content;
  };

  const generateEquipmentReport = () => {
    let content = "RAPPORT ÉQUIPEMENTS\n";
    content += "=".repeat(50) + "\n";
    content += `Période: ${periodLabel}\n`;
    content += `Date: ${new Date().toLocaleDateString('fr-FR')}\n\n`;

    if (equipmentData.length === 0) {
      content += "Aucun équipement trouvé.\n";
    } else {
      content += "STATUT DES ÉQUIPEMENTS\n" + "-".repeat(50) + "\n";
      equipmentData.forEach(e => {
        const statusLabel = e.status === 'active' ? 'Actif'
          : e.status === 'maintenance' ? 'Maintenance'
          : e.status === 'offline' ? 'Hors service'
          : e.status;
        content += `${e.name} (${e.model || ''})\n`;
        content += `  Statut: ${statusLabel}\n`;
        content += `  Type: ${e.type || '—'} | N° Série: ${e.serial_number || '—'}\n`;
        if (e.operating_hours) content += `  Heures: ${e.operating_hours}h\n`;
        content += "\n";
      });

      const activeCount = equipmentData.filter(e => e.status === 'active').length;
      const maintCount = equipmentData.filter(e => e.status === 'maintenance').length;
      content += `Résumé: ${activeCount} actif(s), ${maintCount} en maintenance, ${equipmentData.length - activeCount - maintCount} autre(s)\n`;
    }

    content += `\nGénéré par Amp Mines et Carrieres Platform\n${new Date().toLocaleString('fr-FR')}`;
    return content;
  };

  // ─── Download helpers ─────────────────────────────────────────

  const downloadFile = (content, filename, type = 'text/plain') => {
    const blob = new Blob([content], { type });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const generatePDF = (title, contentHtml) => {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
    h1 { color: #1a5c1a; border-bottom: 2px solid #1a5c1a; padding-bottom: 10px; }
    h2 { color: #333; margin-top: 20px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
    th { background-color: #1a5c1a; color: white; }
    tr:nth-child(even) { background-color: #f9f9f9; }
    .total { font-weight: bold; background-color: #e8f5e9; }
    .footer { margin-top: 30px; font-size: 12px; color: #666; text-align: center; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  ${contentHtml}
  <div class="footer">Généré par Amp Mines et Carrieres Platform le ${new Date().toLocaleString('fr-FR')}</div>
  <script>window.onload = function() { window.print(); }<\/script>
</body>
</html>`;
  };

  // ─── Export PDF (données réelles) ────────────────────────────

  const handleExportPDF = () => {
    setExporting("pdf");

    // Production par dimension
    const dimMap = {};
    productionData.forEach(p => {
      (p.production_details || []).forEach(d => {
        dimMap[d.dimension] = (dimMap[d.dimension] || 0) + parseFloat(d.quantity || 0);
      });
    });
    const totalProd = Object.values(dimMap).reduce((a, b) => a + b, 0);

    const income = financialData.filter(f => f.type === 'income').reduce((s, f) => s + parseFloat(f.amount || 0), 0);
    const expenses = financialData.filter(f => f.type === 'expense').reduce((s, f) => s + parseFloat(f.amount || 0), 0);

    const prodRows = Object.entries(dimMap).length > 0
      ? Object.entries(dimMap).sort((a, b) => b[1] - a[1]).map(([dim, qty]) =>
          `<tr><td>${dim}</td><td>${qty.toFixed(2)}</td><td>${totalProd > 0 ? ((qty / totalProd) * 100).toFixed(1) : 0}%</td></tr>`
        ).join('') + `<tr class="total"><td>TOTAL</td><td>${totalProd.toFixed(2)}</td><td>100%</td></tr>`
      : '<tr><td colspan="3">Aucune donnée</td></tr>';

    const contentHtml = `
      <h1>ROMBAT Mining Platform - Rapport Général</h1>
      <p><strong>Période:</strong> ${periodLabel}</p>
      <p><strong>Date:</strong> ${new Date().toLocaleDateString('fr-FR')}</p>
      <h2>Production par Dimension</h2>
      <table>
        <tr><th>Dimension</th><th>Quantité (tonnes)</th><th>Pourcentage</th></tr>
        ${prodRows}
      </table>
      <h2>Résumé Financier</h2>
      <table>
        <tr><th>Catégorie</th><th>Montant (FCFA)</th></tr>
        <tr><td>Revenus</td><td>${income.toFixed(2)}</td></tr>
        <tr><td>Dépenses</td><td>${expenses.toFixed(2)}</td></tr>
        <tr class="total"><td>Bénéfice Net</td><td>${(income - expenses).toFixed(2)}</td></tr>
      </table>
      <h2>Équipements</h2>
      <p>${equipmentData.filter(e => e.status === 'active').length} actif(s) sur ${equipmentData.length} total</p>
    `;

    const html = generatePDF('ROMBAT Rapport', contentHtml);
    downloadFile(html, `ROMBAT_Rapport_${dateRange}_${new Date().toISOString().split('T')[0]}.html`, 'text/html');
    setTimeout(() => setExporting(null), 1500);
  };

  // ─── Export Excel/CSV (données réelles) ──────────────────────

  const handleExportExcel = () => {
    setExporting("excel");

    const dimMap = {};
    productionData.forEach(p => {
      (p.production_details || []).forEach(d => {
        dimMap[d.dimension] = (dimMap[d.dimension] || 0) + parseFloat(d.quantity || 0);
      });
    });
    const totalProd = Object.values(dimMap).reduce((a, b) => a + b, 0);
    const income = financialData.filter(f => f.type === 'income').reduce((s, f) => s + parseFloat(f.amount || 0), 0);
    const expenses = financialData.filter(f => f.type === 'expense').reduce((s, f) => s + parseFloat(f.amount || 0), 0);
    const totalFuel = fuelData.reduce((s, f) => s + parseFloat(f.quantity || 0), 0);

    const csvData = [
      ['ROMBAT Mining Platform - Export Excel'],
      [`Période: ${periodLabel}`],
      [`Date: ${new Date().toLocaleDateString('fr-FR')}`],
      [],
      ['PRODUCTION'],
      ['DIMENSION', 'QUANTITÉ (tonnes)', 'POURCENTAGE'],
    ];

    if (Object.keys(dimMap).length === 0) {
      csvData.push(['Aucune donnée', '', '']);
    } else {
      Object.entries(dimMap).sort((a, b) => b[1] - a[1]).forEach(([dim, qty]) => {
        csvData.push([dim, qty.toFixed(2), totalProd > 0 ? ((qty / totalProd) * 100).toFixed(1) + '%' : '0%']);
      });
      csvData.push(['TOTAL', totalProd.toFixed(2), '100%']);
    }

    csvData.push([]);
    csvData.push(['FINANCES']);
    csvData.push(['Revenus', income.toFixed(2)]);
    csvData.push(['Dépenses', expenses.toFixed(2)]);
    csvData.push(['Bénéfice Net', (income - expenses).toFixed(2)]);

    csvData.push([]);
    csvData.push(['CARBURANT']);
    csvData.push(['Total consommé (L)', totalFuel.toFixed(1)]);

    const csvContent = csvData.map(row => row.join(';')).join('\n');
    downloadFile(csvContent, `ROMBAT_Export_${dateRange}_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
    setTimeout(() => setExporting(null), 1500);
  };

  // ─── Téléchargement rapport spécifique ────────────────────────

  const handleDownloadReport = (reportType) => {
    setExporting(reportType);

    let content, filename;
    switch (reportType) {
      case 'report-0':
        content = generateProductionReport();
        filename = `ROMBAT_Rapport_Production_${new Date().toISOString().split('T')[0]}.txt`;
        break;
      case 'report-1':
        content = generateFuelReport();
        filename = `ROMBAT_Rapport_Carburant_${new Date().toISOString().split('T')[0]}.txt`;
        break;
      case 'report-2':
        content = generateFinancialReport();
        filename = `ROMBAT_Rapport_Financier_${new Date().toISOString().split('T')[0]}.txt`;
        break;
      case 'report-3':
        content = generateEquipmentReport();
        filename = `ROMBAT_Rapport_Equipement_${new Date().toISOString().split('T')[0]}.txt`;
        break;
      default:
        content = "Rapport Amp Mines et Carrieres";
        filename = `ROMBAT_Rapport_${new Date().toISOString().split('T')[0]}.txt`;
    }

    downloadFile(content, filename);
    setTimeout(() => setExporting(null), 1500);
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
          ].map((p) => (
            <button
              key={p.key}
              onClick={() => setDateRange(p.key)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 border"
              style={{
                background: dateRange === p.key ? "var(--color-primary)" : "transparent",
                color: dateRange === p.key ? "#fff" : "var(--color-muted-foreground)",
                borderColor: dateRange === p.key ? "var(--color-primary)" : "var(--color-border)",
                fontFamily: "var(--font-caption)",
              }}
            >
              {p.label}
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
          { icon: "BarChart3", label: "Rapport de Production", badge: null },
          { icon: "Fuel",      label: "Rapport Carburant",    badge: null },
          { icon: "Calculator",label: "Rapport Financier",    badge: null },
          { icon: "Wrench",    label: "Rapport Équipement",   badge: null },
        ].map((r, i) => (
          <button
            key={i}
            onClick={() => handleDownloadReport(`report-${i}`)}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg border transition-all duration-200 hover:bg-muted/50"
            style={{ borderColor: "var(--color-border)" }}
          >
            <Icon name={r.icon} size={15} color="var(--color-primary)" />
            <span
              className="flex-1 text-left text-sm"
              style={{ color: "var(--color-foreground)", fontFamily: "var(--font-caption)" }}
            >
              {r.label}
            </span>
            {r.badge && (
              <span
                className="px-1.5 py-0.5 rounded text-xs font-semibold"
                style={{
                  background: "rgba(44,85,48,0.12)",
                  color: "var(--color-primary)",
                  fontFamily: "var(--font-caption)",
                }}
              >
                {r.badge}
              </span>
            )}
            <Icon name="Download" size={13} color="var(--color-muted-foreground)" />
          </button>
        ))}
      </div>
    </div>
  );
}
