import React, { useState } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine,  } from "recharts";
import Icon from "components/AppIcon";

const WEEKLY_DATA = [
  { day: "Lun 27/02", production: 1180, objectif: 1200 },
  { day: "Mar 28/02", production: 1320, objectif: 1200 },
  { day: "Mer 01/03", production: 980, objectif: 1200 },
  { day: "Jeu 02/03", production: 1450, objectif: 1200 },
  { day: "Ven 03/03", production: 1280, objectif: 1200 },
  { day: "Sam 04/03", production: 860, objectif: 1200 },
  { day: "Dim 05/03", production: 1150, objectif: 1200 },
];

const MONTHLY_DATA = [
  { week: "S1 Fév", production: 7800, objectif: 8400 },
  { week: "S2 Fév", production: 8200, objectif: 8400 },
  { week: "S3 Fév", production: 7600, objectif: 8400 },
  { week: "S4 Fév", production: 8900, objectif: 8400 },
  { week: "S1 Mar", production: 8100, objectif: 8400 },
  { week: "S2 Mar", production: 7200, objectif: 8400 },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border p-3 shadow-lg" style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}>
      <p className="text-xs font-semibold mb-2" style={{ color: "var(--color-foreground)", fontFamily: "var(--font-caption)" }}>{label}</p>
      {payload?.map((entry, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: entry?.color }} />
          <span className="text-xs" style={{ color: "var(--color-muted-foreground)", fontFamily: "var(--font-caption)" }}>
            {entry?.name}: <strong style={{ color: "var(--color-foreground)", fontFamily: "var(--font-data)" }}>{entry?.value?.toLocaleString("fr-FR")} t</strong>
          </span>
        </div>
      ))}
    </div>
  );
};

export default function ProductionChart() {
  const [view, setView] = useState("weekly");

  const data = view === "weekly" ? WEEKLY_DATA : MONTHLY_DATA;
  const xKey = view === "weekly" ? "day" : "week";

  return (
    <div className="rounded-xl border p-4 md:p-6" style={{ background: "var(--color-card)", borderColor: "var(--color-border)", boxShadow: "var(--shadow-md)" }}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg" style={{ background: "rgba(44,85,48,0.12)" }}>
            <Icon name="TrendingUp" size={18} color="var(--color-primary)" />
          </div>
          <div>
            <h3 className="text-base font-semibold" style={{ fontFamily: "var(--font-heading)", color: "var(--color-foreground)" }}>
              Tendance de Production
            </h3>
            <p className="text-xs" style={{ color: "var(--color-muted-foreground)", fontFamily: "var(--font-caption)" }}>
              Production vs Objectif
            </p>
          </div>
        </div>
        <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: "var(--color-border)" }}>
          {["weekly", "monthly"]?.map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className="px-3 py-1.5 text-xs font-medium transition-all"
              style={{
                background: view === v ? "var(--color-primary)" : "var(--color-background)",
                color: view === v ? "#fff" : "var(--color-muted-foreground)",
                fontFamily: "var(--font-caption)",
              }}
            >
              {v === "weekly" ? "7 Jours" : "Mensuel"}
            </button>
          ))}
        </div>
      </div>
      <div className="w-full h-56 md:h-64" aria-label="Graphique de tendance de production minière">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="prodGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey={xKey} tick={{ fontSize: 10, fill: "var(--color-muted-foreground)", fontFamily: "var(--font-caption)" }} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "var(--color-muted-foreground)", fontFamily: "var(--font-data)" }} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000)?.toFixed(1)}k`} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: "11px", fontFamily: "var(--font-caption)" }} />
            <ReferenceLine y={view === "weekly" ? 1200 : 8400} stroke="var(--color-accent)" strokeDasharray="4 4" label={{ value: "Obj.", fill: "var(--color-accent)", fontSize: 10 }} />
            <Area type="monotone" dataKey="production" name="Production" stroke="var(--color-primary)" fill="url(#prodGrad)" strokeWidth={2} dot={{ r: 3, fill: "var(--color-primary)" }} />
            <Area type="monotone" dataKey="objectif" name="Objectif" stroke="var(--color-accent)" fill="none" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}