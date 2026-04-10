import React, { useState } from "react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import Icon from "components/AppIcon";

const COLORS = [
  "#1a5c1a", "#2d8b2d", "#e53e3e", "#dd6b20", "#3182ce",
  "#805ad5", "#d69e2e", "#38a169", "#e91e63", "#00bcd4",
];

const fmt = (n) => Number(n).toLocaleString("fr-FR", { maximumFractionDigits: 0 });

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div
      className="rounded-lg border px-3 py-2 text-xs shadow-lg"
      style={{ background: "var(--color-card)", borderColor: "var(--color-border)", color: "var(--color-foreground)" }}
    >
      <p className="font-semibold mb-1">{d.name}</p>
      <p>{fmt(d.value)} <span style={{ color: "var(--color-muted-foreground)" }}>FCFA</span></p>
      <p style={{ color: "var(--color-muted-foreground)" }}>
        {d.payload.pct}%
      </p>
    </div>
  );
};

export default function ExpensesChart({ data = [] }) {
  const [activeIdx, setActiveIdx] = useState(null);

  const total = data.reduce((s, d) => s + d.value, 0);
  const enriched = data.map(d => ({ ...d, pct: total > 0 ? ((d.value / total) * 100).toFixed(1) : "0.0" }));

  const empty = enriched.length === 0;

  return (
    <div
      className="rounded-xl border p-4 md:p-5 h-full"
      style={{ background: "var(--color-card)", borderColor: "var(--color-border)", boxShadow: "var(--shadow-sm)" }}
    >
      <div className="flex items-center gap-2 mb-4">
        <Icon name="PieChart" size={18} color="var(--color-error)" />
        <h3
          className="text-base font-semibold"
          style={{ color: "var(--color-foreground)", fontFamily: "var(--font-heading)" }}
        >
          Répartition des Dépenses
        </h3>
        <span
          className="ml-auto text-xs px-2 py-0.5 rounded-full"
          style={{ background: "rgba(229,62,62,0.1)", color: "var(--color-error)", fontFamily: "var(--font-caption)" }}
        >
          Ce mois
        </span>
      </div>

      {empty ? (
        <div className="flex flex-col items-center justify-center h-40 gap-2">
          <Icon name="PieChart" size={32} color="var(--color-muted-foreground)" />
          <p className="text-sm" style={{ color: "var(--color-muted-foreground)", fontFamily: "var(--font-caption)" }}>
            Aucune dépense enregistrée ce mois
          </p>
        </div>
      ) : (
        <>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={enriched}
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  onMouseEnter={(_, idx) => setActiveIdx(idx)}
                  onMouseLeave={() => setActiveIdx(null)}
                >
                  {enriched.map((entry, idx) => (
                    <Cell
                      key={idx}
                      fill={COLORS[idx % COLORS.length]}
                      opacity={activeIdx === null || activeIdx === idx ? 1 : 0.55}
                      stroke="none"
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Total centré (légende) */}
          <div className="text-center -mt-2 mb-3">
            <p className="text-xs" style={{ color: "var(--color-muted-foreground)", fontFamily: "var(--font-caption)" }}>
              Total dépenses
            </p>
            <p className="text-lg font-bold" style={{ color: "var(--color-error)", fontFamily: "var(--font-heading)" }}>
              {fmt(total)} <span className="text-xs font-normal">FCFA</span>
            </p>
          </div>

          {/* Légende catégories */}
          <div className="space-y-1.5 max-h-36 overflow-y-auto">
            {enriched.map((d, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs">
                <div
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ background: COLORS[idx % COLORS.length] }}
                />
                <span className="flex-1 truncate" style={{ color: "var(--color-foreground)", fontFamily: "var(--font-caption)" }}>
                  {d.name}
                </span>
                <span className="font-semibold" style={{ color: "var(--color-foreground)", fontFamily: "var(--font-data)" }}>
                  {d.pct}%
                </span>
                <span style={{ color: "var(--color-muted-foreground)", fontFamily: "var(--font-caption)" }}>
                  {fmt(d.value)}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
