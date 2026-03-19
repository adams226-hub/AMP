import React from 'react';
import Icon from 'components/AppIcon';

const mockSites = [
  { id: 1, name: 'Site A', status: 'Opérationnel', uptime: '99.2%' },
  { id: 2, name: 'Site B', status: 'Maintenance', uptime: '87.6%' },
  { id: 3, name: 'Site C', status: 'Arrêté', uptime: '0%' },
];

const SiteStatusTable = () => (
  <div className="site-status-table rounded-xl border p-4" style={{ borderColor: 'var(--color-border)' }}>
    <div className="flex items-center gap-2 mb-3">
      <Icon name="Server" size={16} color="var(--color-primary)" />
      <h3 className="text-sm font-semibold" style={{ color: 'var(--color-foreground)' }}>Statut des sites</h3>
    </div>
    <table className="w-full text-sm">
      <thead>
        <tr style={{ color: 'var(--color-muted-foreground)' }}>
          <th className="text-left pb-2">Site</th>
          <th className="text-left pb-2">Statut</th>
          <th className="text-left pb-2">Disponibilité</th>
        </tr>
      </thead>
      <tbody>
        {mockSites.map((s) => (
          <tr key={s.id} className="border-t" style={{ borderColor: 'var(--color-border)' }}>
            <td className="py-2">{s.name}</td>
            <td className="py-2">{s.status}</td>
            <td className="py-2">{s.uptime}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default SiteStatusTable;
