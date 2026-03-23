import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { miningService } from "../../config/supabase";
import AppLayout from "components/navigation/AppLayout";
import Icon from "components/AppIcon";
import Button from "components/ui/Button";
import KPICard from "./components/KPICard";
import ProductionChart from "./components/ProductionChart";
import FuelCostChart from "./components/FuelCostChart";
import ProfitabilityChart from "./components/ProfitabilityChart";
import AlertsPanel from "./components/AlertsPanel";
import FinancialSummary from "./components/FinancialSummary";
import SiteStatusTable from "./components/SiteStatusTable";
import ExportPanel from "./components/ExportPanel";

export default function ExecutiveDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentUser, setCurrentUser] = useState(null);
  const [kpiData, setKpiData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    // Récupérer l'utilisateur connecté
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setCurrentUser(user);
    }
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const { data, error } = await miningService.getDashboardStats(user?.role);

      if (error) {
        console.error('Erreur chargement dashboard:', error);
        setKpiData([
          {
            id: 1,
            title: "Production du Jour",
            value: "0",
            unit: "t",
            trend: "down",
            trendValue: "-",
            icon: "Mountain",
            iconColor: "var(--color-primary)",
            bgColor: "rgba(44,85,48,0.12)",
            subtitle: "Pas de données disponibles",
            color: "var(--color-primary)",
            progress: 0,
            progressColor: "var(--color-primary)",
          },
        ]);
        return;
      }

      if (!data) {
        setKpiData([
          {
            id: 1,
            title: "Production du Jour",
            value: "0",
            unit: "t",
            trend: "stable",
            trendValue: "0%",
            icon: "Mountain",
            iconColor: "var(--color-primary)",
            bgColor: "rgba(44,85,48,0.12)",
            subtitle: "Aucune donnée disponible",
            color: "var(--color-primary)",
            progress: 0,
            progressColor: "var(--color-primary)",
          },
        ]);
        return;
      }

      const productionDay = Number(data.total_production || 0);
      const revenue = Number(data.total_revenue || 0);
      const expenses = Number(data.total_expenses || 0);
      const costPerTon = productionDay > 0 ? (revenue / productionDay).toFixed(2) : 0;
      const availability = Number(data.equipment_availability || 0);

      const transformedKpis = [
        {
          id: 1,
          title: "Production du Jour",
          value: productionDay.toLocaleString('fr-FR'),
          unit: "t",
          trend: productionDay >= 0 ? "up" : "down",
          trendValue: productionDay > 0 ? "+0%" : "0%",
          icon: "Mountain",
          iconColor: "var(--color-primary)",
          bgColor: "rgba(44,85,48,0.12)",
          subtitle: "Production actuelle",
          color: "var(--color-primary)",
          progress: Math.min(100, productionDay > 0 ? 100 : 0),
          progressColor: "var(--color-primary)",
        },
        {
          id: 2,
          title: "Production du Mois",
          value: data.total_production_month?.toLocaleString?.('fr-FR') || "0",
          unit: "t",
          trend: "up",
          trendValue: "+0%",
          icon: "BarChart3",
          iconColor: "#3182CE",
          bgColor: "rgba(49,130,206,0.12)",
          subtitle: "Production cumulée",
          color: "#3182CE",
          progress: data.total_production_month ? Math.min(100, (Number(data.total_production_month) / 50000) * 100) : 0,
          progressColor: "#3182CE",
        },
        {
          id: 3,
          title: "Engins Actifs",
          value: availability ? `${availability.toFixed(1)} %` : "0 %",
          unit: "",
          trend: "stable",
          trendValue: "0%",
          icon: "Activity",
          iconColor: "#F59E0B",
          bgColor: "rgba(245,158,11,0.12)",
          subtitle: "Taux de disponibilité",
          color: "#F59E0B",
          progress: availability,
          progressColor: "#F59E0B",
        },
        {
          id: 4,
          title: "Coût par Tonne",
          value: costPerTon.toString(),
          unit: "€",
          trend: "down",
          trendValue: "-",
          icon: "DollarSign",
          iconColor: "#22C55E",
          bgColor: "rgba(34,197,94,0.12)",
          subtitle: "Économie actuelle",
          color: "#22C55E",
          progress: costPerTon > 0 ? Math.min(100, (3 / costPerTon) * 100) : 0,
          progressColor: "#22C55E",
        },
      ];

      setKpiData(transformedKpis);
    } catch (err) {
      console.error('Erreur:', err);
      setKpiData([]);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  return (
    <AppLayout userRole={currentUser?.role || 'admin'} userName={currentUser?.full_name || 'Utilisateur'} userSite={currentUser?.department || 'RomBat'}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--color-foreground)" }}>
            Tableau de Bord Direction
          </h1>
          <p
            className="text-sm mt-1"
            style={{ color: "var(--color-muted-foreground)", fontFamily: "var(--font-caption)" }}
          >
            Vue exécutive en temps réel — Jeudi 05 mars 2026
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs"
            style={{
              background: "var(--color-muted)",
              borderColor: "var(--color-border)",
              color: "var(--color-muted-foreground)",
              fontFamily: "var(--font-caption)",
            }}
          >
            <div
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ background: "var(--color-success)" }}
            />
            Mis à jour: {formatTime(lastRefresh)}
          </div>
          <Button
            variant="outline"
            size="sm"
            iconName="RefreshCw"
            iconPosition="left"
            loading={refreshing}
            onClick={handleRefresh}
          >
            Actualiser
          </Button>
          <Button
            variant="default"
            size="sm"
            iconName="BarChart3"
            iconPosition="left"
            onClick={() => navigate("/production-management")}
          >
            Production
          </Button>
        </div>
      </div>
      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
        {kpiData?.map((kpi) => (
          <div key={kpi?.id} className="col-span-1">
            <KPICard
              title={kpi?.title}
              value={kpi?.value}
              unit={kpi?.unit}
              trend={kpi?.trend}
              trendValue={kpi?.trendValue}
              icon={kpi?.icon}
              iconColor={kpi?.iconColor}
              bgColor={kpi?.bgColor}
              subtitle={kpi?.subtitle}
              color={kpi?.color}
              progress={kpi?.progress}
              progressColor={kpi?.progressColor}
            />
          </div>
        ))}
      </div>
      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
        {/* Production chart - 2 cols */}
        <div className="lg:col-span-2">
          <ProductionChart />
        </div>
        {/* Alerts panel - 1 col */}
        <div className="lg:col-span-1">
          <AlertsPanel onNavigate={navigate} />
        </div>
      </div>
      {/* Second row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
        <FuelCostChart />
        <ProfitabilityChart />
      </div>
      {/* Financial summary + Export */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
        <div className="lg:col-span-2">
          <FinancialSummary />
        </div>
        <div className="lg:col-span-1">
          <ExportPanel />
        </div>
      </div>
      {/* Site status table */}
      <div className="mb-6 md:mb-8">
        <SiteStatusTable />
      </div>
      {/* Quick navigation footer */}
      <div
        className="rounded-xl border p-4 md:p-5"
        style={{
          background: "var(--color-card)",
          borderColor: "var(--color-border)",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Icon name="Navigation" size={16} color="var(--color-primary)" />
          <h3
            className="text-sm font-semibold"
            style={{ color: "var(--color-foreground)", fontFamily: "var(--font-heading)" }}
          >
            Navigation Rapide
          </h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {[
            { label: "Production", icon: "BarChart3", path: "/production-management", color: "var(--color-primary)" },
            { label: "Équipement", icon: "Wrench", path: "/equipment-management", color: "#3182CE" },
            { label: "Carburant", icon: "Fuel", path: "/fuel-management", color: "var(--color-warning)" },
            { label: "Comptabilité", icon: "Calculator", path: "/accounting", color: "#805AD5" },
            { label: "Rapports", icon: "FileText", path: "/reports", color: "var(--color-accent)" },
            { label: "Administration", icon: "Settings", path: "/administration", color: "var(--color-secondary)" },
          ]?.map((item) => (
            <button
              key={item?.path}
              onClick={() => navigate(item?.path)}
              className="flex flex-col items-center gap-2 p-3 rounded-xl border transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 active:scale-95"
              style={{
                borderColor: "var(--color-border)",
                background: "var(--color-muted)",
              }}
            >
              <div
                className="flex items-center justify-center w-10 h-10 rounded-xl"
                style={{ background: `${item?.color}15` }}
              >
                <Icon name={item?.icon} size={18} color={item?.color} />
              </div>
              <span
                className="text-xs font-medium text-center"
                style={{ color: "var(--color-foreground)", fontFamily: "var(--font-caption)" }}
              >
                {item?.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}