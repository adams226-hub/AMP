import React from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, LabelList,
} from "recharts";

const COLOR = "#3182CE";
const TOP_N = 8;

function getWeekNumber(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg p-3 border shadow-lg" style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}>
      <p className="text-xs font-semibold mb-1" style={{ color: "var(--color-foreground)" }}>{label}</p>
      <p className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>
        Consommation : <span className="font-bold" style={{ color: COLOR }}>{payload[0]?.value?.toLocaleString("fr-FR")} L</span>
      </p>
      {payload[0]?.payload?.cout > 0 && (
        <p className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>
          Coût : <span className="font-medium" style={{ color: "var(--color-foreground)" }}>{payload[0].payload.cout.toLocaleString("fr-FR")} FCFA</span>
        </p>
      )}
    </div>
  );
};

export default function FuelCostChart({ data = [], weekStart, weekEnd, periodLabel }) {
  const sorted  = [...data].sort((a, b) => b.consommation - a.consommation);
  const top     = sorted.slice(0, TOP_N);
  const reste   = sorted.length - TOP_N;
  const isEmpty = top.length === 0;

  const weekNum = getWeekNumber(weekStart);
  const weekLabel = periodLabel
    ? periodLabel
    : weekNum
      ? `S${weekNum} · ${formatDate(weekStart)} – ${formatDate(weekEnd)}`
      : 'Semaine en cours';

  const maxVal = top[0]?.consommation || 1;

  return (
    <div className="rounded-xl border p-4 md:p-6" style={{ background: "var(--color-card)", borderColor: "var(--color-border)", boxShadow: "var(--shadow-sm)" }}>
      <div className="flex items-start justify-between mb-5">
        <div>
          <h3 className="text-base font-semibold" style={{ color: "var(--color-foreground)", fontFamily: "var(--font-heading)" }}>
            Consommation Carburant par Engin
          </h3>
          <p className="text-xs mt-0.5" style={{ color: "var(--color-muted-foreground)" }}>
            {weekLabel} · Top {Math.min(TOP_N, sorted.length)} consommateurs
          </p>
        </div>
        {reste > 0 && (
          <span className="text-xs px-2 py-1 rounded-full flex-shrink-0" style={{ background: "rgba(49,130,206,0.10)", color: COLOR }}>
            +{reste} autre{reste > 1 ? "s" : ""}
          </span>
        )}
      </div>

      {isEmpty ? (
        <div className="flex flex-col items-center justify-center h-48 gap-2">
          <span style={{ color: "var(--color-muted-foreground)", fontSize: 13 }}>
            Aucune sortie carburant cette semaine
          </span>
        </div>
      ) : (
        <div style={{ width: "100%", height: top.length * 44 + 24 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={top}
              margin={{ top: 0, right: 60, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
              <XAxis
                type="number"
                domain={[0, maxVal * 1.18]}
                tick={false}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="engin"
                width={115}
                tick={{ fontSize: 11, fill: "var(--color-muted-foreground)", fontFamily: "var(--font-caption)" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(0,0,0,0.04)" }} />
              <Bar dataKey="consommation" radius={[0, 4, 4, 0]} barSize={22}>
                {top.map((_, i) => {
                  const intensity = 0.40 + 0.60 * (1 - i / Math.max(top.length - 1, 1));
                  return <Cell key={i} fill={`rgba(49,130,206,${intensity.toFixed(2)})`} />;
                })}
                <LabelList
                  dataKey="consommation"
                  position="right"
                  formatter={v => `${v.toLocaleString("fr-FR")} L`}
                  style={{ fontSize: 11, fill: "var(--color-muted-foreground)", fontFamily: "var(--font-caption)" }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
