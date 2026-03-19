import React from "react";
import Icon from "components/AppIcon";

const financialData = [
  {
    id: 1,
    label: "Revenus Totaux",
    value: "55 000",
    unit: "€",
    icon: "TrendingUp",
    iconColor: "var(--color-success)",
    bgColor: "rgba(56,161,105,0.12)",
    trend: "+8,3%",
    trendUp: true,
    subtitle: "Ventes minerai ce mois",
  },
  {
    id: 2,
    label: "Dépenses Totales",
    value: "36 000",
    unit: "€",
    icon: "Receipt",
    iconColor: "var(--color-error)",
    bgColor: "rgba(229,62,62,0.12)",
    trend: "+4,1%",
    trendUp: false,
    subtitle: "Carburant + pièces + charges",
  },
  {
    id: 3,
    label: "Bénéfice Net",
    value: "19 000",
    unit: "€",
    icon: "DollarSign",
    iconColor: "var(--color-accent)",
    bgColor: "rgba(214,158,46,0.12)",
    trend: "+14,2%",
    trendUp: true,
    subtitle: "Marge: 34,5%",
  },
  {
    id: 4,
    label: "Coût / Tonne",
    value: "8,72",
    unit: "€/t",
    icon: "Calculator",
    iconColor: "#3182CE",
    bgColor: "rgba(49,130,206,0.12)",
    trend: "-2,1%",
    trendUp: true,
    subtitle: "Objectif: &lt; 9,00 €/t",
  },
];

export default function FinancialSummary() {
  return (
    <div
      className="rounded-xl border p-4 md:p-6"
      style={{
        background: "var(--color-card)",
        borderColor: "var(--color-border)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <div className="flex items-center gap-2 mb-5">
        <Icon name="BarChart2" size={18} color="var(--color-primary)" />
        <h3
          className="text-base font-semibold"
          style={{ color: "var(--color-foreground)", fontFamily: "var(--font-heading)" }}
        >
          Résumé Financier — Mars 2026
        </h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
        {financialData?.map((item) => (
          <div
            key={item?.id}
            className="flex items-start gap-3 p-3 rounded-lg border"
            style={{
              background: item?.bgColor,
              borderColor: "var(--color-border)",
            }}
          >
            <div
              className="flex items-center justify-center w-9 h-9 rounded-lg flex-shrink-0"
              style={{ background: "var(--color-card)" }}
            >
              <Icon name={item?.icon} size={16} color={item?.iconColor} />
            </div>
            <div className="flex-1 min-w-0">
              <p
                className="text-xs font-medium"
                style={{ color: "var(--color-muted-foreground)", fontFamily: "var(--font-caption)" }}
              >
                {item?.label}
              </p>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span
                  className="text-lg font-bold whitespace-nowrap"
                  style={{ color: "var(--color-foreground)", fontFamily: "var(--font-heading)" }}
                >
                  {item?.value}
                </span>
                <span
                  className="text-xs"
                  style={{ color: "var(--color-muted-foreground)", fontFamily: "var(--font-caption)" }}
                >
                  {item?.unit}
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                <span
                  className="text-xs font-semibold"
                  style={{
                    color: item?.trendUp ? "var(--color-success)" : "var(--color-error)",
                    fontFamily: "var(--font-caption)",
                  }}
                >
                  {item?.trend}
                </span>
                <span
                  className="text-xs"
                  style={{ color: "var(--color-muted-foreground)", fontFamily: "var(--font-caption)" }}
                  dangerouslySetInnerHTML={{ __html: item?.subtitle }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
      {/* Profitability bar */}
      <div className="mt-5">
        <div className="flex items-center justify-between mb-2">
          <span
            className="text-xs font-medium"
            style={{ color: "var(--color-muted-foreground)", fontFamily: "var(--font-caption)" }}
          >
            Rentabilité Globale
          </span>
          <span
            className="text-xs font-bold"
            style={{ color: "var(--color-success)", fontFamily: "var(--font-data)" }}
          >
            34,5%
          </span>
        </div>
        <div
          className="w-full h-2.5 rounded-full overflow-hidden"
          style={{ background: "var(--color-muted)" }}
        >
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: "34.5%", background: "var(--color-success)" }}
          />
        </div>
        <div className="flex items-center justify-between mt-1">
          <span
            className="text-xs"
            style={{ color: "var(--color-muted-foreground)", fontFamily: "var(--font-caption)" }}
          >
            0%
          </span>
          <span
            className="text-xs"
            style={{ color: "var(--color-muted-foreground)", fontFamily: "var(--font-caption)" }}
          >
            Objectif: 40%
          </span>
        </div>
      </div>
    </div>
  );
}