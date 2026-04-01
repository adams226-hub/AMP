import React from "react";
import Icon from "components/AppIcon";

const ROLE_CONFIG = {
  admin: { label: "Administrateur", icon: "ShieldCheck", color: "var(--color-primary)", bg: "rgba(44,85,48,0.12)" },
  directeur: { label: "Directeur", icon: "TrendingUp", color: "var(--color-accent)", bg: "rgba(214,158,46,0.12)" },
  chef_de_site: { label: "Chef de Site", icon: "HardHat", color: "#3182CE", bg: "rgba(49,130,206,0.12)" },
  comptable: { label: "Comptable", icon: "Calculator", color: "#805AD5", bg: "rgba(128,90,213,0.12)" },
};

const PERMISSIONS = {
  admin: ["Tableau de bord", "Production", "Équipement", "Carburant", "Comptabilité", "Rapports", "Administration"],
  directeur: ["Tableau de bord", "Production", "Équipement", "Comptabilité", "Rapports"],
  chef_de_site: ["Production", "Équipement", "Carburant"],
  comptable: ["Comptabilité", "Rapports"],
};

export default function RoleBadge({ role, userName, userSite }) {
  const cfg = ROLE_CONFIG?.[role] || ROLE_CONFIG?.admin;
  const perms = PERMISSIONS?.[role] || [];

  return (
    <div
      className="rounded-xl p-4 border"
      style={{ background: cfg?.bg, borderColor: `${cfg?.color}30` }}
    >
      <div className="flex items-center gap-3 mb-3">
        <div
          className="flex items-center justify-center w-10 h-10 rounded-lg flex-shrink-0"
          style={{ background: `${cfg?.color}20` }}
        >
          <Icon name={cfg?.icon} size={20} color={cfg?.color} />
        </div>
        <div>
          <p className="text-sm font-semibold" style={{ color: "var(--color-foreground)", fontFamily: "var(--font-heading)" }}>
            {userName}
          </p>
          <p className="text-xs" style={{ color: cfg?.color, fontFamily: "var(--font-caption)", fontWeight: 600 }}>
            {cfg?.label}
          </p>
        </div>
        <div className="ml-auto text-right">
          <p className="text-xs" style={{ color: "var(--color-muted-foreground)", fontFamily: "var(--font-caption)" }}>
            {userSite}
          </p>
        </div>
      </div>
      <div>
        <p className="text-xs font-medium mb-2" style={{ color: "var(--color-muted-foreground)", fontFamily: "var(--font-caption)" }}>
          Accès autorisés :
        </p>
        <div className="flex flex-wrap gap-1.5">
          {perms?.map((p) => (
            <span
              key={p}
              className="text-xs px-2 py-0.5 rounded-full"
              style={{ background: `${cfg?.color}15`, color: cfg?.color, fontFamily: "var(--font-caption)", fontWeight: 500 }}
            >
              {p}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}