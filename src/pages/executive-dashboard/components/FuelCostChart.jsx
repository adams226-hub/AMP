import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

const fuelData = [
  { engin: "EX-001", consommation: 420, cout: 756 },
  { engin: "EX-002", consommation: 380, cout: 684 },
  { engin: "BU-001", consommation: 290, cout: 522 },
  { engin: "BU-002", consommation: 310, cout: 558 },
  { engin: "GR-001", consommation: 180, cout: 324 },
  { engin: "CR-001", consommation: 240, cout: 432 },
];

const COLORS = [
  "var(--color-primary)",
  "#3182CE",
  "var(--color-accent)",
  "#805AD5",
  "var(--color-success)",
  "#E53E3E",
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
        <p className="text-xs font-semibold mb-1" style={{ color: "var(--color-foreground)" }}>
          {label}
        </p>
        <p className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>
          Consommation:{" "}
          <span className="font-medium" style={{ color: "var(--color-foreground)" }}>
            {payload?.[0]?.value} L
          </span>
        </p>
        <p className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>
          Coût:{" "}
          <span className="font-medium" style={{ color: "var(--color-foreground)" }}>
            {payload?.[0]?.payload?.cout?.toLocaleString("fr-FR")} €
          </span>
        </p>
      </div>
    );
  }
  return null;
};

export default function FuelCostChart() {
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
          Consommation Carburant par Engin
        </h3>
        <p
          className="text-xs mt-0.5"
          style={{ color: "var(--color-muted-foreground)", fontFamily: "var(--font-caption)" }}
        >
          Litres consommés ce mois
        </p>
      </div>
      <div className="w-full h-52 md:h-60" aria-label="Graphique consommation carburant par engin">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={fuelData} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
            <XAxis
              dataKey="engin"
              tick={{ fontSize: 11, fill: "var(--color-muted-foreground)", fontFamily: "var(--font-caption)" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "var(--color-muted-foreground)", fontFamily: "var(--font-caption)" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="consommation" radius={[4, 4, 0, 0]}>
              {fuelData?.map((_, index) => (
                <Cell key={index} fill={COLORS?.[index % COLORS?.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}