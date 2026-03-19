import React from "react";
import Icon from "components/AppIcon";

const KPICard = ({ title, value, unit, icon, color, bgColor, subtitle, progress, progressColor }) => (
  <div
    className="rounded-xl border p-4 flex flex-col gap-2"
    style={{ background: "var(--color-card)", borderColor: "var(--color-border)", boxShadow: "var(--shadow-sm)" }}
  >
    <div className="flex items-start justify-between">
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide truncate" style={{ color: "var(--color-muted-foreground)", fontFamily: "var(--font-caption)" }}>
          {title}
        </p>
        <div className="flex items-baseline gap-1 mt-1">
          <span className="text-xl md:text-2xl font-bold whitespace-nowrap" style={{ color: "var(--color-foreground)", fontFamily: "var(--font-data)" }}>
            {value}
          </span>
          <span className="text-xs" style={{ color: "var(--color-muted-foreground)", fontFamily: "var(--font-caption)" }}>{unit}</span>
        </div>
        {subtitle && (
          <p className="text-xs mt-0.5" style={{ color: "var(--color-muted-foreground)", fontFamily: "var(--font-caption)" }}>{subtitle}</p>
        )}
      </div>
      <div className="flex items-center justify-center w-10 h-10 rounded-lg flex-shrink-0 ml-2" style={{ background: bgColor }}>
        <Icon name={icon} size={18} color={color} />
      </div>
    </div>
    {progress !== undefined && (
      <div>
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs" style={{ color: "var(--color-muted-foreground)", fontFamily: "var(--font-caption)" }}>Objectif</span>
          <span className="text-xs font-semibold" style={{ color: progressColor || color, fontFamily: "var(--font-data)" }}>{progress}%</span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--color-muted)" }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, progress)}%`, background: progressColor || color }}
          />
        </div>
      </div>
    )}
  </div>
);

export default function ProductionKPICards({ data }) {
  const cards = [
    {
      title: "Production du Jour",
      value: (data?.dailyProduction || 0)?.toLocaleString("fr-FR"),
      unit: "t",
      icon: "TrendingUp",
      color: "var(--color-primary)",
      bgColor: "rgba(44,85,48,0.12)",
      subtitle: `Objectif: ${(data?.dailyObjective || 0)?.toLocaleString("fr-FR")} t`,
      progress: data?.dailyObjective ? Math.round((data?.dailyProduction / data?.dailyObjective) * 100) : 0,
      progressColor: data?.dailyProduction >= data?.dailyObjective ? "var(--color-success)" : "var(--color-accent)",
    },
    {
      title: "Production Mensuelle",
      value: (data?.monthlyProduction || 0)?.toLocaleString("fr-FR"),
      unit: "t",
      icon: "BarChart3",
      color: "#3182CE",
      bgColor: "rgba(49,130,206,0.12)",
      subtitle: `Objectif: ${(data?.monthlyObjective || 0)?.toLocaleString("fr-FR")} t`,
      progress: data?.monthlyObjective ? Math.round((data?.monthlyProduction / data?.monthlyObjective) * 100) : 0,
      progressColor: data?.monthlyProduction >= data?.monthlyObjective ? "var(--color-success)" : "#3182CE",
    },
    {
      title: "Engins Actifs",
      value: data?.activeEquipment || 0,
      unit: `/ ${data?.totalEquipment || 0}`,
      icon: "Wrench",
      color: "var(--color-accent)",
      bgColor: "rgba(214,158,46,0.12)",
      subtitle: `${data?.totalEquipment - data?.activeEquipment || 0} en maintenance`,
    },
    {
      title: "Taux de Rendement",
      value: data?.efficiencyRate || 0,
      unit: "%",
      icon: "Gauge",
      color: data?.efficiencyRate >= 80 ? "var(--color-success)" : "var(--color-error)",
      bgColor: data?.efficiencyRate >= 80 ? "rgba(56,161,105,0.12)" : "rgba(229,62,62,0.12)",
      subtitle: data?.efficiencyRate >= 80 ? "Performance optimale" : "Amélioration requise",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards?.map((card, i) => (
        <KPICard key={i} {...card} />
      ))}
    </div>
  );
}