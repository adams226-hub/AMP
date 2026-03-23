import React, { useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

// Fonction pour générer les données depuis localStorage (synchronisé avec le module production)
const getProductionData = () => {
  try {
    // Essayer de récupérer les données du module production
    const productionData = JSON.parse(localStorage.getItem('production_final') || '[]');
    
    if (productionData.length > 0) {
      // Grouper par jour pour le graphique
      const dailyData = {};
      
      productionData.forEach(item => {
        const date = new Date(item.date);
        const dayName = date.toLocaleDateString('fr-FR', { weekday: 'short' });
        
        if (!dailyData[dayName]) {
          // Utiliser l'objectif saisi dans le module production
          const objective = item.objective || 1500;
          
          dailyData[dayName] = {
            jour: dayName,
            production: 0,
            objectif: objective, // Objectif depuis le module production
            carburant: 0
          };
        }
        
        dailyData[dayName].production += item.total || 0;
        dailyData[dayName].carburant += Math.floor((item.total || 0) * 2.5); // Estimation carburant
      });
      
      // Convertir en tableau et trier
      return Object.values(dailyData);
    }
  } catch (error) {
    console.warn('ProductionChart: Error reading localStorage, using fallback data');
  }
  
  // Données par défaut si localStorage vide
  return [
    { jour: "Lun", production: 1240, objectif: 1500, carburant: 3200 },
    { jour: "Mar", production: 1580, objectif: 1500, carburant: 3800 },
    { jour: "Mer", production: 1320, objectif: 1500, carburant: 3100 },
    { jour: "Jeu", production: 1750, objectif: 1500, carburant: 4200 },
    { jour: "Ven", production: 1620, objectif: 1500, carburant: 3900 },
    { jour: "Sam", production: 980, objectif: 1500, carburant: 2400 },
    { jour: "Dim", production: 420, objectif: 1500, carburant: 1100 },
  ];
};

// Données mensuelles (synchronisées)
const getMonthlyData = () => {
  try {
    const productionData = JSON.parse(localStorage.getItem('production_final') || '[]');
    
    if (productionData.length > 0) {
      // Grouper par semaine
      const weeklyData = {};
      
      productionData.forEach(item => {
        const date = new Date(item.date);
        const weekNumber = Math.ceil((date.getDate() + new Date(date.getFullYear(), date.getMonth(), 1).getDay()) / 7);
        const weekKey = `S${weekNumber}`;
        
        if (!weeklyData[weekKey]) {
          weeklyData[weekKey] = {
            jour: weekKey,
            production: 0,
            objectif: item.objective || 1500, // Objectif depuis le module production
            carburant: 0
          };
        }
        
        weeklyData[weekKey].production += item.total || 0;
        weeklyData[weekKey].carburant += Math.floor((item.total || 0) * 2.5);
      });
      
      return Object.values(weeklyData);
    }
  } catch (error) {
    console.warn('ProductionChart: Error reading monthly data, using fallback');
  }
  
  // Données par défaut
  return [
    { jour: "S1", production: 8200, objectif: 10500, carburant: 22000 },
    { jour: "S2", production: 9800, objectif: 10500, carburant: 25000 },
    { jour: "S3", production: 11200, objectif: 10500, carburant: 28000 },
    { jour: "S4", production: 10100, objectif: 10500, carburant: 26000 },
  ];
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload?.length) {
    return (
      <div
        className="rounded-lg p-3 border shadow-lg"
        style={{
          background: "var(--color-card)",
          borderColor: "var(--color-border)",
          fontFamily: "var(--font-caption)",
        }}
      >
        <p className="text-xs font-semibold mb-2" style={{ color: "var(--color-foreground)" }}>
          {label}
        </p>
        {payload?.map((entry, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <div className="w-2 h-2 rounded-full" style={{ background: entry?.color }} />
            <span style={{ color: "var(--color-muted-foreground)" }}>{entry?.name}:</span>
            <span className="font-medium" style={{ color: "var(--color-foreground)" }}>
              {entry?.value?.toLocaleString("fr-FR")}
              {entry?.name === "Production" || entry?.name === "Objectif" ? " t" : " L"}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function ProductionChart() {
  const [period, setPeriod] = useState("week");
  const [data, setData] = useState([]);

  useEffect(() => {
    // Mettre à jour les données quand la période change
    const newData = period === "week" ? getProductionData() : getMonthlyData();
    setData(newData);
  }, [period]);

  // Écouter les changements dans localStorage pour mise à jour automatique
  useEffect(() => {
    const handleStorageChange = () => {
      const newData = period === "week" ? getProductionData() : getMonthlyData();
      setData(newData);
    };

    // Écouter les changements de localStorage
    window.addEventListener('storage', handleStorageChange);
    
    // Vérifier périodiquement les changements (pour les changements dans le même onglet)
    const interval = setInterval(handleStorageChange, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [period]);

  return (
    <div
      className="rounded-xl border p-4 md:p-6"
      style={{
        background: "var(--color-card)",
        borderColor: "var(--color-border)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h3
            className="text-base font-semibold"
            style={{ color: "var(--color-foreground)", fontFamily: "var(--font-heading)" }}
          >
            Tendance de Production
          </h3>
          <p
            className="text-xs mt-0.5"
            style={{ color: "var(--color-muted-foreground)", fontFamily: "var(--font-caption)" }}
          >
            Production vs Objectif (tonnes)
          </p>
        </div>
        <div
          className="flex items-center gap-1 p-1 rounded-lg"
          style={{ background: "var(--color-muted)" }}
        >
          {["week", "month"]?.map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className="px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200"
              style={{
                background: period === p ? "var(--color-card)" : "transparent",
                color: period === p ? "var(--color-foreground)" : "var(--color-muted-foreground)",
                fontFamily: "var(--font-caption)",
                boxShadow: period === p ? "var(--shadow-sm)" : "none",
              }}
            >
              {p === "week" ? "Semaine" : "Mois"}
            </button>
          ))}
        </div>
      </div>
      <div className="w-full h-56 md:h-64" aria-label="Graphique de tendance de production">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="prodGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="objGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-accent)" stopOpacity={0.2} />
                <stop offset="95%" stopColor="var(--color-accent)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis
              dataKey="jour"
              tick={{ fontSize: 11, fill: "var(--color-muted-foreground)", fontFamily: "var(--font-caption)" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "var(--color-muted-foreground)", fontFamily: "var(--font-caption)" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => v?.toLocaleString("fr-FR")}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: "11px", fontFamily: "var(--font-caption)", paddingTop: "12px" }}
            />
            <Area
              type="monotone"
              dataKey="production"
              name="Production"
              stroke="var(--color-primary)"
              strokeWidth={2.5}
              fill="url(#prodGrad)"
              dot={{ r: 3, fill: "var(--color-primary)" }}
            />
            <Area
              type="monotone"
              dataKey="objectif"
              name="Objectif"
              stroke="var(--color-accent)"
              strokeWidth={2}
              strokeDasharray="5 5"
              fill="url(#objGrad)"
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}