import React, { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { supabase } from "../../../config/supabase";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg p-3 border shadow-lg" style={{ background: "var(--color-card)", borderColor: "var(--color-border)", fontFamily: "var(--font-caption)" }}>
      <p className="text-xs font-semibold mb-2" style={{ color: "var(--color-foreground)" }}>{label}</p>
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2 text-xs">
          <span className="font-medium" style={{ color: entry.color }}>{entry.name}:</span>
          <span style={{ color: "var(--color-muted-foreground)" }}>{Number(entry.value || 0).toLocaleString('fr-FR')} L</span>
        </div>
      ))}
    </div>
  );
};

export default function OilManagementChart() {
  const [chartData, setChartData] = useState([]);

  const loadChartData = async () => {
    const { data, error } = await supabase
      .from('oil_transactions')
      .select('equipment_id, transaction_type, quantity, equipment:equipment_id(name)')
      .eq('transaction_type', 'exit');

    if (error || !data) return;

    const equipmentMap = {};
    data.forEach((tx) => {
      const label = tx.equipment?.name || `Engin ${tx.equipment_id}`;
      if (!equipmentMap[label]) equipmentMap[label] = { engin: label, consommation: 0 };
      equipmentMap[label].consommation += Number(tx.quantity || 0);
    });

    setChartData(
      Object.values(equipmentMap)
        .map(item => ({ ...item, consommation: Number(item.consommation || 0) }))
        .sort((a, b) => b.consommation - a.consommation)
    );
  };

  useEffect(() => {
    loadChartData();

    // Actualisation en temps réel via Supabase realtime
    const channel = supabase
      .channel('oil_chart')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'oil_transactions' }, loadChartData)
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  const isEmpty = chartData.length === 0;

  return (
    <div className="rounded-xl border p-4 md:p-6" style={{ background: "var(--color-card)", borderColor: "var(--color-border)", boxShadow: "var(--shadow-sm)" }}>
      <div className="mb-5">
        <h3 className="text-base font-semibold" style={{ color: "var(--color-foreground)", fontFamily: "var(--font-heading)" }}>
          Consommation Huile par Engin
        </h3>
        <p className="text-xs mt-0.5" style={{ color: "var(--color-muted-foreground)", fontFamily: "var(--font-caption)" }}>
          Sorties d'huile par engin enregistrées
        </p>
      </div>
      {isEmpty ? (
        <div className="flex flex-col items-center justify-center h-52 md:h-60 gap-2">
          <span style={{ color: "var(--color-muted-foreground)", fontSize: 13, fontFamily: "var(--font-caption)" }}>
            Aucune transaction huile enregistrée
          </span>
        </div>
      ) : (
        <div className="w-full h-52 md:h-60">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="engin" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)", fontFamily: "var(--font-caption)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "var(--color-muted-foreground)", fontFamily: "var(--font-caption)" }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: "11px", fontFamily: "var(--font-caption)", paddingTop: "8px" }} />
              <Bar dataKey="consommation" name="Consommation" fill="rgba(34,197,94,0.85)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
