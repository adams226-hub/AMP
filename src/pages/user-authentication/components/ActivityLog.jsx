import React, { useState, useEffect } from "react";
import Icon from "components/AppIcon";
import { miningService } from "../../../config/supabase";

const ROLE_LABELS = {
  admin:        { label: 'Admin',        color: 'var(--color-primary)',  bg: 'rgba(44,85,48,0.10)' },
  directeur:    { label: 'Directeur',    color: '#D97706',               bg: 'rgba(217,119,6,0.10)' },
  chef_de_site: { label: 'Chef de Site', color: '#3182CE',               bg: 'rgba(49,130,206,0.10)' },
  comptable:    { label: 'Comptable',    color: '#805AD5',               bg: 'rgba(128,90,213,0.10)' },
  equipement:   { label: 'Équipement',   color: '#DD6B20',               bg: 'rgba(221,107,32,0.10)' },
  supervisor:   { label: 'Superviseur',  color: '#0EA5E9',               bg: 'rgba(14,165,233,0.10)' },
  operator:     { label: 'Opérateur',    color: '#6B7280',               bg: 'rgba(107,114,128,0.10)' },
};

function formatDate(isoStr) {
  if (!isoStr) return '—';
  return new Date(isoStr).toLocaleString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function ActivityLog() {
  const [users, setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    miningService.getUsers().then(({ data }) => {
      setUsers(data || []);
      setLoading(false);
    });
  }, []);

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Icon name="Users" size={18} color="var(--color-primary)" />
        <h3 className="text-sm font-semibold" style={{ color: 'var(--color-foreground)', fontFamily: 'var(--font-heading)' }}>
          Utilisateurs enregistrés
        </h3>
        <span className="ml-auto text-xs px-2 py-0.5 rounded-full"
          style={{ background: 'var(--color-muted)', color: 'var(--color-muted-foreground)', fontFamily: 'var(--font-caption)' }}>
          {loading ? '…' : `${users.length} compte${users.length > 1 ? 's' : ''}`}
        </span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-24">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2" style={{ borderColor: 'var(--color-primary)' }} />
        </div>
      ) : users.length === 0 ? (
        <p className="text-sm text-center py-6" style={{ color: 'var(--color-muted-foreground)' }}>
          Aucun utilisateur trouvé
        </p>
      ) : (
        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {users.map(u => {
            const roleMeta = ROLE_LABELS[u.role] || { label: u.role || '—', color: '#6B7280', bg: 'rgba(107,114,128,0.08)' };
            return (
              <div key={u.id} className="flex items-start gap-3 p-3 rounded-lg border"
                style={{ background: roleMeta.bg, borderColor: 'var(--color-border)' }}>
                <div className="flex items-center justify-center w-8 h-8 rounded-full flex-shrink-0"
                  style={{ background: `${roleMeta.color}20` }}>
                  <Icon name="User" size={15} color={roleMeta.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold truncate"
                      style={{ color: 'var(--color-foreground)', fontFamily: 'var(--font-caption)' }}>
                      {u.full_name || u.username || '—'}
                    </span>
                    <span className="text-xs px-1.5 py-0.5 rounded font-medium"
                      style={{ background: roleMeta.color + '20', color: roleMeta.color, fontFamily: 'var(--font-caption)' }}>
                      {roleMeta.label}
                    </span>
                    <span className="text-xs px-1.5 py-0.5 rounded"
                      style={{
                        background: u.is_active ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
                        color: u.is_active ? 'var(--color-success)' : 'var(--color-error)',
                      }}>
                      {u.is_active ? 'Actif' : 'Inactif'}
                    </span>
                  </div>
                  {u.department && (
                    <p className="text-xs mt-0.5" style={{ color: 'var(--color-muted-foreground)', fontFamily: 'var(--font-caption)' }}>
                      {u.department}
                    </p>
                  )}
                </div>
                <div className="flex-shrink-0 text-right">
                  <p className="text-xs whitespace-nowrap" style={{ color: 'var(--color-muted-foreground)', fontFamily: 'var(--font-data)' }}>
                    {formatDate(u.created_at)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
