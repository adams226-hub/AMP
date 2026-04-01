import React from 'react';

const EquipmentUtilizationChart = () => (
  <div className="rounded-xl border p-4" style={{ background: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
    <h3 className="text-sm font-semibold mb-2">Utilisation des Engins</h3>
    <div style={{ height: 140 }}>
      {/* Placeholder chart area */}
      <div style={{ background: 'linear-gradient(90deg, #f3f4f6, #fff)', height: '100%', borderRadius: 8 }} />
    </div>
  </div>
);

export default EquipmentUtilizationChart;
