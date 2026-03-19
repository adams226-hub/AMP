import React from "react";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const profitData = [
  { mois: "Oct", revenus: 48000, depenses: 32000, benefice: 16000 },
  { mois: "Nov", revenus: 52000, depenses: 35000, benefice: 17000 },
  { mois: "Déc", revenus: 45000, depenses: 31000, benefice: 14000 },
  { mois: "Jan", revenus: 58000, depenses: 38000, benefice: 20000 },
  { mois: "Fév", revenus: 61000, depenses: 40000, benefice: 21000 },
  { mois: "Mar", revenus: 55000, depenses: 36000, benefice: 19000 },
];

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
              {entry?.value?.toLocaleString("fr-FR")} €
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function ProfitabilityChart() {
  return (
    <div
      className="rounded-xl border p-4 md:p-6"
      style={{
        background: "var(--color-card)",
        borderColor: "var(--color-border)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <div className="mb-5">
        <h3
          className="text-base font-semibold"
          style={{ color: "var(--color-foreground)", fontFamily: "var(--font-heading)" }}
        >
          Analyse de Rentabilité
        </h3>
        <p
          className="text-xs mt-0.5"
          style={{ color: "var(--color-muted-foreground)", fontFamily: "var(--font-caption)" }}
        >
          Revenus, Dépenses & Bénéfice (6 derniers mois)
        </p>
      </div>
      <div className="w-full h-56 md:h-64" aria-label="Graphique de rentabilité sur 6 mois">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={profitData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis
              dataKey="mois"
              tick={{ fontSize: 11, fill: "var(--color-muted-foreground)", fontFamily: "var(--font-caption)" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "var(--color-muted-foreground)", fontFamily: "var(--font-caption)" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${(v / 1000)?.toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: "11px", fontFamily: "var(--font-caption)", paddingTop: "12px" }}
            />
            <Bar dataKey="revenus" name="Revenus" fill="rgba(44,85,48,0.7)" radius={[3, 3, 0, 0]} />
            <Bar dataKey="depenses" name="Dépenses" fill="rgba(229,62,62,0.7)" radius={[3, 3, 0, 0]} />
            <Line
              type="monotone"
              dataKey="benefice"
              name="Bénéfice"
              stroke="var(--color-accent)"
              strokeWidth={2.5}
              dot={{ r: 4, fill: "var(--color-accent)" }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}