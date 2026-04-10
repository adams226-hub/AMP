import React, { useState } from "react";
import AppLayout from "components/navigation/AppLayout";
import Icon from "components/AppIcon";
import Button from "components/ui/Button";
import ProductionEntryForm from "./components/ProductionEntryForm";
import ProductionKPICards from "./components/ProductionKPICards";
import ProductionChart from "./components/ProductionChart";
import EquipmentCard from "./components/EquipmentCard";
import StockManagement from "./components/StockManagement";
import ObjectiveSettings from "./components/ObjectiveSettings";
import EquipmentUtilizationChart from "./components/EquipmentUtilizationChart";

const INITIAL_EQUIPMENT = [
  { id: "EX-001", type: "Excavatrice", model: "Caterpillar 390F", site: "Site Kamoto", status: "actif", totalHours: 4820, hoursToday: 7.5, fuelLevel: 680, fuelCapacity: 800, fuelConsumption: 85, lastMaintenance: "15/02/2026", nextService: "15/04/2026" },
  { id: "EX-002", type: "Excavatrice", model: "Komatsu PC800", site: "Site Kamoto", status: "actif", totalHours: 3210, hoursToday: 8.2, fuelLevel: 420, fuelCapacity: 750, fuelConsumption: 78, lastMaintenance: "20/02/2026", nextService: "20/04/2026" },
  { id: "EX-003", type: "Excavatrice", model: "Liebherr R9250", site: "Site Kolwezi", status: "maintenance", totalHours: 6540, hoursToday: 3.1, fuelLevel: 600, fuelCapacity: 900, fuelConsumption: 92, lastMaintenance: "01/03/2026", nextService: "01/05/2026" },
  { id: "BU-001", type: "Bulldozer", model: "CAT D10T", site: "Site Kamoto", status: "actif", totalHours: 2890, hoursToday: 6.8, fuelLevel: 350, fuelCapacity: 600, fuelConsumption: 65, lastMaintenance: "10/02/2026", nextService: "10/04/2026" },
  { id: "BU-002", type: "Bulldozer", model: "Komatsu D375A", site: "Site Tenke Fungurume", status: "actif", totalHours: 1980, hoursToday: 7.9, fuelLevel: 520, fuelCapacity: 650, fuelConsumption: 70, lastMaintenance: "25/02/2026", nextService: "25/04/2026" },
  { id: "CA-001", type: "Camion Minier", model: "Caterpillar 793F", site: "Site Kolwezi", status: "panne", totalHours: 8120, hoursToday: 0, fuelLevel: 200, fuelCapacity: 1200, fuelConsumption: 110, lastMaintenance: "05/02/2026", nextService: "05/04/2026" },
  { id: "CA-002", type: "Camion Minier", model: "Komatsu 930E", site: "Site Kamoto", status: "actif", totalHours: 5430, hoursToday: 5.4, fuelLevel: 900, fuelCapacity: 1100, fuelConsumption: 105, lastMaintenance: "18/02/2026", nextService: "18/04/2026" },
  { id: "FO-001", type: "Foreuse", model: "Atlas Copco DM45", site: "Site Mutanda", status: "actif", totalHours: 3670, hoursToday: 7.1, fuelLevel: 280, fuelCapacity: 400, fuelConsumption: 45, lastMaintenance: "12/02/2026", nextService: "12/04/2026" },
];

const INITIAL_PRODUCTION_LOG = [
  { id: 1, date: "05/03/2026", site: "Site Kamoto", quantity: 1150, team: "Équipe A", equipment: ["EX-001", "BU-001", "CA-002"], notes: "Conditions normales" },
  { id: 2, date: "04/03/2026", site: "Site Kolwezi", quantity: 860, team: "Équipe B", equipment: ["EX-002", "BU-002"], notes: "Pluie légère en fin de journée" },
  { id: 3, date: "03/03/2026", site: "Site Kamoto", quantity: 1280, team: "Équipe A", equipment: ["EX-001", "EX-002", "CA-002"], notes: "" },
  { id: 4, date: "02/03/2026", site: "Site Tenke Fungurume", quantity: 1450, team: "Équipe C", equipment: ["EX-003", "BU-001", "FO-001"], notes: "Excellente journée" },
  { id: 5, date: "01/03/2026", site: "Site Kamoto", quantity: 980, team: "Équipe B", equipment: ["EX-001", "BU-002"], notes: "Panne CA-001 en cours de journée" },
];

export default function ProductionManagement() {
  const [equipment, setEquipment] = useState(INITIAL_EQUIPMENT);
  const [productionLog, setProductionLog] = useState(INITIAL_PRODUCTION_LOG);
  const [objectives, setObjectives] = useState({ daily: 1200, monthly: 36000 });
  const [activeTab, setActiveTab] = useState("saisie");
  const [filterStatus, setFilterStatus] = useState("all");

  const dailyProduction = productionLog?.filter((p) => p?.date === "05/03/2026")?.reduce((s, p) => s + p?.quantity, 0);
  const monthlyProduction = productionLog?.reduce((s, p) => s + p?.quantity, 0);
  const activeEquipment = equipment?.filter((e) => e?.status === "actif")?.length;
  const efficiencyRate = Math.round((dailyProduction / objectives?.daily) * 100);

  const kpiData = {
    dailyProduction,
    dailyObjective: objectives?.daily,
    monthlyProduction,
    monthlyObjective: objectives?.monthly,
    activeEquipment,
    totalEquipment: equipment?.length,
    efficiencyRate,
  };

  const handleProductionSubmit = (formData) => {
    const newEntry = {
      id: productionLog?.length + 1,
      date: "05/03/2026",
      site: formData?.site,
      quantity: Number(formData?.quantity),
      team: formData?.team,
      equipment: formData?.equipment,
      notes: formData?.notes,
    };
    setProductionLog((prev) => [newEntry, ...prev]);
  };

  const handleStatusChange = (equipmentId, newStatus) => {
    setEquipment((prev) => prev?.map((e) => e?.id === equipmentId ? { ...e, status: newStatus } : e));
  };

  const filteredEquipment = filterStatus === "all" ? equipment : equipment?.filter((e) => e?.status === filterStatus);

  const TABS = [
    { id: "saisie", label: "Saisie Production", icon: "ClipboardList" },
    { id: "engins", label: "Parc d\'Engins", icon: "Truck" },
    { id: "stock", label: "Stock Granulats", icon: "Package" },
    { id: "historique", label: "Historique", icon: "History" },
  ];

  return (
    <AppLayout userRole="chef_de_site" userName="Marc Dubois" userSite="Site Kamoto">
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold" style={{ fontFamily: "var(--font-heading)", color: "var(--color-foreground)" }}>
              Gestion de Production
            </h1>
            <p className="text-sm mt-1" style={{ color: "var(--color-muted-foreground)", fontFamily: "var(--font-caption)" }}>
              Jeudi 05 mars 2026 — Site Kamoto
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: "rgba(56,161,105,0.12)", border: "1px solid var(--color-success)" }}>
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: "var(--color-success)" }} />
              <span className="text-xs font-medium" style={{ color: "var(--color-success)", fontFamily: "var(--font-caption)" }}>
                {activeEquipment} engins actifs
              </span>
            </div>
            <Button variant="outline" size="sm" iconName="RefreshCw" iconPosition="left">
              Actualiser
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <ProductionKPICards data={kpiData} />

        {/* Tabs */}
        <div className="overflow-x-auto">
          <div className="flex gap-1 p-1 rounded-xl min-w-max" style={{ background: "var(--color-muted)" }}>
            {TABS?.map((tab) => (
              <button
                key={tab?.id}
                onClick={() => setActiveTab(tab?.id)}
                className="flex items-center gap-2 px-3 md:px-4 py-2 rounded-lg text-sm font-medium transition-all flex-shrink-0"
                style={{
                  background: activeTab === tab?.id ? "var(--color-card)" : "transparent",
                  color: activeTab === tab?.id ? "var(--color-primary)" : "var(--color-muted-foreground)",
                  fontFamily: "var(--font-caption)",
                  boxShadow: activeTab === tab?.id ? "var(--shadow-sm)" : "none",
                }}
              >
                <Icon name={tab?.icon} size={15} color={activeTab === tab?.id ? "var(--color-primary)" : "var(--color-muted-foreground)"} />
                <span className="hidden sm:inline">{tab?.label}</span>
                <span className="sm:hidden">{tab?.label?.split(" ")?.[0]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === "saisie" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <ProductionEntryForm onSubmit={handleProductionSubmit} objectives={objectives} />
              <ProductionChart />
            </div>
            <div className="space-y-6">
              <ObjectiveSettings objectives={objectives} onSave={setObjectives} />
              <div className="rounded-xl border p-4" style={{ background: "var(--color-card)", borderColor: "var(--color-border)", boxShadow: "var(--shadow-sm)" }}>
                <div className="flex items-center gap-2 mb-3">
                  <Icon name="Clock" size={16} color="var(--color-primary)" />
                  <h3 className="text-sm font-semibold" style={{ fontFamily: "var(--font-heading)", color: "var(--color-foreground)" }}>
                    Dernières Saisies
                  </h3>
                </div>
                <div className="space-y-2">
                  {productionLog?.slice(0, 4)?.map((entry) => (
                    <div key={entry?.id} className="flex items-center justify-between p-2 rounded-lg" style={{ background: "var(--color-muted)" }}>
                      <div className="min-w-0">
                        <p className="text-xs font-medium truncate" style={{ color: "var(--color-foreground)", fontFamily: "var(--font-caption)" }}>
                          {entry?.site}
                        </p>
                        <p className="text-xs" style={{ color: "var(--color-muted-foreground)", fontFamily: "var(--font-caption)" }}>
                          {entry?.date}
                        </p>
                      </div>
                      <span className="text-sm font-bold whitespace-nowrap ml-2" style={{ color: "var(--color-primary)", fontFamily: "var(--font-data)" }}>
                        {entry?.quantity?.toLocaleString("fr-FR")} t
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "engins" && (
          <div className="space-y-6">
            <EquipmentUtilizationChart />
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="text-base font-semibold" style={{ fontFamily: "var(--font-heading)", color: "var(--color-foreground)" }}>
                Fiches Engins ({filteredEquipment?.length})
              </h3>
              <div className="flex gap-2 overflow-x-auto">
                {["all", "actif", "maintenance", "panne"]?.map((s) => (
                  <button
                    key={s}
                    onClick={() => setFilterStatus(s)}
                    className="px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all flex-shrink-0"
                    style={{
                      background: filterStatus === s ? "var(--color-primary)" : "var(--color-muted)",
                      color: filterStatus === s ? "#fff" : "var(--color-muted-foreground)",
                      fontFamily: "var(--font-caption)",
                    }}
                  >
                    {s === "all" ? "Tous" : s === "actif" ? "Actifs" : s === "maintenance" ? "Maintenance" : "En panne"}
                    <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-xs" style={{ background: filterStatus === s ? "rgba(255,255,255,0.2)" : "var(--color-border)" }}>
                      {s === "all" ? equipment?.length : equipment?.filter((e) => e?.status === s)?.length}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredEquipment?.map((eq) => (
                <EquipmentCard key={eq?.id} equipment={eq} onStatusChange={handleStatusChange} />
              ))}
            </div>
          </div>
        )}

        {activeTab === "stock" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <StockManagement />
            <div className="rounded-xl border p-4 md:p-6" style={{ background: "var(--color-card)", borderColor: "var(--color-border)", boxShadow: "var(--shadow-md)" }}>
              <div className="flex items-center gap-3 mb-5">
                <div className="flex items-center justify-center w-9 h-9 rounded-lg" style={{ background: "rgba(229,62,62,0.12)" }}>
                  <Icon name="AlertTriangle" size={18} color="var(--color-error)" />
                </div>
                <div>
                  <h3 className="text-base font-semibold" style={{ fontFamily: "var(--font-heading)", color: "var(--color-foreground)" }}>
                    Alertes & Recommandations
                  </h3>
                  <p className="text-xs" style={{ color: "var(--color-muted-foreground)", fontFamily: "var(--font-caption)" }}>
                    Actions requises
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                {[
                  { type: "error", icon: "AlertTriangle", title: "Stock 16/32 mm critique", desc: "Niveau à 30% — Réapprovisionnement urgent requis", action: "Commander" },
                  { type: "warning", icon: "Wrench", title: "EX-003 en maintenance", desc: "Révision planifiée — Retour prévu le 08/03/2026", action: "Voir détails" },
                  { type: "warning", icon: "Fuel", title: "CA-001 en panne", desc: "Panne moteur signalée — Technicien en route", action: "Suivi" },
                  { type: "info", icon: "TrendingUp", title: "Objectif mensuel à 87%", desc: "13% restant pour atteindre l'objectif de mars", action: "Voir rapport" },
                ]?.map((alert, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 p-3 rounded-lg border-l-4"
                    style={{
                      background: alert?.type === "error" ? "rgba(229,62,62,0.06)" : alert?.type === "warning" ? "rgba(214,158,46,0.06)" : "rgba(49,130,206,0.06)",
                      borderLeftColor: alert?.type === "error" ? "var(--color-error)" : alert?.type === "warning" ? "var(--color-warning)" : "#3182CE",
                    }}
                  >
                    <Icon
                      name={alert?.icon}
                      size={16}
                      color={alert?.type === "error" ? "var(--color-error)" : alert?.type === "warning" ? "var(--color-warning)" : "#3182CE"}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium" style={{ color: "var(--color-foreground)", fontFamily: "var(--font-caption)" }}>{alert?.title}</p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--color-muted-foreground)", fontFamily: "var(--font-caption)" }}>{alert?.desc}</p>
                    </div>
                    <button
                      className="text-xs font-medium whitespace-nowrap flex-shrink-0 transition-colors"
                      style={{ color: "var(--color-primary)", fontFamily: "var(--font-caption)" }}
                    >
                      {alert?.action}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "historique" && (
          <div className="rounded-xl border overflow-hidden" style={{ background: "var(--color-card)", borderColor: "var(--color-border)", boxShadow: "var(--shadow-md)" }}>
            <div className="flex items-center justify-between p-4 md:p-6 border-b" style={{ borderColor: "var(--color-border)" }}>
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-9 h-9 rounded-lg" style={{ background: "rgba(44,85,48,0.12)" }}>
                  <Icon name="History" size={18} color="var(--color-primary)" />
                </div>
                <div>
                  <h3 className="text-base font-semibold" style={{ fontFamily: "var(--font-heading)", color: "var(--color-foreground)" }}>
                    Historique de Production
                  </h3>
                  <p className="text-xs" style={{ color: "var(--color-muted-foreground)", fontFamily: "var(--font-caption)" }}>
                    {productionLog?.length} entrées enregistrées
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" iconName="Download" iconPosition="left">
                Exporter
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ background: "var(--color-muted)" }}>
                    {["Date", "Site", "Quantité (t)", "Équipe", "Engins", "Notes"]?.map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--color-muted-foreground)", fontFamily: "var(--font-caption)" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {productionLog?.map((entry, i) => (
                    <tr
                      key={entry?.id}
                      className="border-t transition-colors hover:bg-opacity-50"
                      style={{ borderColor: "var(--color-border)", background: i % 2 === 0 ? "transparent" : "rgba(0,0,0,0.01)" }}
                    >
                      <td className="px-4 py-3 text-sm whitespace-nowrap" style={{ color: "var(--color-foreground)", fontFamily: "var(--font-data)" }}>{entry?.date}</td>
                      <td className="px-4 py-3 text-sm" style={{ color: "var(--color-foreground)", fontFamily: "var(--font-caption)" }}>{entry?.site}</td>
                      <td className="px-4 py-3 text-sm font-semibold whitespace-nowrap" style={{ color: entry?.quantity >= objectives?.daily ? "var(--color-success)" : "var(--color-accent)", fontFamily: "var(--font-data)" }}>
                        {entry?.quantity?.toLocaleString("fr-FR")}
                      </td>
                      <td className="px-4 py-3 text-sm" style={{ color: "var(--color-foreground)", fontFamily: "var(--font-caption)" }}>{entry?.team}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {entry?.equipment?.slice(0, 3)?.map((eq) => (
                            <span key={eq} className="px-1.5 py-0.5 rounded text-xs" style={{ background: "rgba(44,85,48,0.1)", color: "var(--color-primary)", fontFamily: "var(--font-data)" }}>
                              {eq}
                            </span>
                          ))}
                          {entry?.equipment?.length > 3 && (
                            <span className="px-1.5 py-0.5 rounded text-xs" style={{ background: "var(--color-muted)", color: "var(--color-muted-foreground)", fontFamily: "var(--font-caption)" }}>
                              +{entry?.equipment?.length - 3}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs max-w-xs truncate" style={{ color: "var(--color-muted-foreground)", fontFamily: "var(--font-caption)" }}>
                        {entry?.notes || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}