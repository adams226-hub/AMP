import React, { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import Icon from "../../../components/AppIcon";
import { miningService } from "../../../config/supabase";
const userRole = 'admin'; // Hardcoded for demo

const STATUS_COLORS = {
  actif: "var(--color-primary)",
  maintenance: "var(--color-warning)",
  panne: "var(--color-error)",
  inactif: "var(--color-secondary)",
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border p-3 shadow-lg" style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}>
      <p className="text-xs font-semibold mb-1" style={{ color: "var(--color-foreground)" }}>{label}</p>
      <p className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>
        {payload[0].name}: <strong style={{ color: "var(--color-foreground)" }}>{payload[0].value}</strong>
      </p>
    </div>
  );
};

export default function EquipmentUtility() {
  const [fuelSummary, setFuelSummary] = useState([]);
  const [loadingFuel, setLoadingFuel] = useState(true);

  useEffect(() => {
    const fetchFuelData = async () => {
      try {
        const { data } = await miningService.getEquipmentFuelSummary(userRole);
        setFuelSummary(data || []);
      } catch (error) {
        console.error('Fuel summary error:', error);
      } finally {
        setLoadingFuel(false);
      }
    };
    fetchFuelData();
  }, []);

  // Utilization mock data (can be fetched similarly)
  const utilizationData = [
    { id: "EX-001", hours: 7.5, target: 8, status: "actif" },
    { id: "EX-002", hours: 8.2, target: 8, status: "actif" },
    { id: "EX-003", hours: 3.1, target: 8, status: "maintenance" },
    { id: "BU-001", hours: 6.8, target: 8, status: "actif" },
    { id: "BU-002", hours: 7.9, target: 8, status: "actif" },
    { id: "CA-001", hours: 0, target: 8, status: "panne" },
    { id: "CA-002", hours: 5.4, target: 8, status: "actif" },
    { id: "FO-001", hours: 7.1, target: 8, status: "actif" },
  ];

  // Fuel chart data: top 5 by consumption
  const fuelChartData = fuelSummary.slice(0, 8).map(item => ({
    name: item.name || item.id?.slice(0,6),
    actual: parseFloat(item.actual_fuel_rate || 0),
    expected: parseFloat(item.fuel_consumption_rate || 8),
    consumed: parseFloat(item.total_fuel_consumed || 0),
    fill: item.actual_fuel_rate > item.fuel_consumption_rate ? '#ef4444' : '#10b981'
  }));

  const totalFuelConsumed = fuelSummary.reduce((sum, item) => sum + parseFloat(item.total_fuel_consumed || 0), 0);

  return (
    <div className="space-y-6">
      {/* Existing Utilization Chart */}
      <div className="rounded-xl border p-4 md:p-6" style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "rgba(49,130,206,0.12)" }}>
            <Icon name="Activity" size={18} color="#3182CE" />
          </div>
          <div>
            <h3 className="text-base font-semibold" style={{ color: "var(--color-foreground)" }}>
              Utilisation des Engins
            </h3>
            <p className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>Heures de fonctionnement aujourd'hui</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={utilizationData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
            <XAxis dataKey="id" tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }} tickLine={false} />
            <YAxis domain={[0, 10]} tickFormatter={(v) => `${v}h`} tick={{ fontSize: 10 }} axisLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="hours" radius={[4, 4, 0, 0]} maxBarSize={32}>
              {utilizationData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.status] || "#64748b"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* NEW Fuel Consumption Section */}
      <div className="rounded-xl border p-4 md:p-6" style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "rgba(239,68,68,0.12)" }}>
            <Icon name="Fuel" size={18} color="#ef4444" />
          </div>
          <div>
            <h3 className="text-base font-semibold" style={{ color: "var(--color-foreground)" }}>
              Consommation Carburant par Machine
            </h3>
            <p className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>
              Taux réel vs attendu (L/h) - Total: {totalFuelConsumed.toFixed(0)} L
            </p>
          </div>
        </div>
        {loadingFuel ? (
          <div className="h-48 flex items-center justify-center" style={{ color: "var(--color-muted-foreground)" }}>
            Chargement consommation...
          </div>
        ) : fuelSummary.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-sm" style={{ color: "var(--color-muted-foreground)" }}>
            Aucune donnée de consommation disponible
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={fuelChartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} angle={-45} textAnchor="end" height={70} />
                <YAxis tickFormatter={(v) => `${v} L/h`} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="actual" stackId="a" radius={[4, 4, 0, 0]} fill="#ef4444" name="Réel" />
                <Bar dataKey="expected" stackId="a" radius={[4, 4, 0, 0]} fill="#10b981" name="Attendu" />
              </BarChart>
            </ResponsiveContainer>
            {/* Top consumers table */}
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b" style={{ borderColor: "var(--color-border)" }}>
                    <th className="p-2 text-left" style={{ color: "var(--color-muted-foreground)" }}>Machine</th>
                    <th className="p-2 text-right" style={{ color: "var(--color-muted-foreground)" }}>Total L</th>
                    <th className="p-2 text-right" style={{ color: "var(--color-muted-foreground)" }}>Taux Réel L/h</th>
                    <th className="p-2 text-right" style={{ color: "var(--color-muted-foreground)" }}>Taux Attendu</th>
                  </tr>
                </thead>
                <tbody>
                  {fuelSummary.slice(0, 6).map((item) => (
                    <tr key={item.id} className="border-b last:border-b-0" style={{ borderColor: "var(--color-border)" }}>
                      <td className="p-2 font-medium max-w-32 truncate" style={{ color: "var(--color-foreground)" }}>
                        {item.name}
                      </td>
                      <td className="p-2 text-right font-mono" style={{ color: "var(--color-foreground)" }}>
                        {item.total_fuel_consumed?.toFixed(0) || 0} L
                      </td>
                      <td className="p-2 text-right" style={{ 
                        color: item.actual_fuel_rate > item.fuel_consumption_rate ? 'var(--color-error)' : 'var(--color-success)'
                      }}>
                        {item.actual_fuel_rate?.toFixed(1) || '--'} L/h
                      </td>
                      <td className="p-2 text-right font-mono" style={{ color: "var(--color-muted-foreground)" }}>
                        {item.fuel_consumption_rate?.toFixed(1) || '--'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

