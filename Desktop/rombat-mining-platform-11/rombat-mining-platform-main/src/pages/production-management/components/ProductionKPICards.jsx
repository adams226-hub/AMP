import React from 'react';
import KPICard from '../../executive-dashboard/components/KPICard';

const ProductionKPICards = ({ data = {} }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
    <KPICard title="Production du Jour" value={data?.dailyProduction} unit="t" />
    <KPICard title="Objectif Journ." value={data?.dailyObjective} unit="t" />
    <KPICard title="Production Mois" value={data?.monthlyProduction} unit="t" />
    <KPICard title="Taux Efficacité" value={`${data?.efficiencyRate || 0}%`} />
  </div>
);

export default ProductionKPICards;
