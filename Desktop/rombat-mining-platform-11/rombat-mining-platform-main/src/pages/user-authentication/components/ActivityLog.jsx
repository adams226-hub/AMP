import React from "react";
import Icon from "components/AppIcon";

const ACTIVITY_LOG = [
  { id: 1, user: "Jean Dupont", role: "admin", action: "Connexion réussie", time: "05/03/2026 16:42", type: "success", ip: "192.168.1.10" },
  { id: 2, user: "Marie Leclerc", role: "directeur", action: "Connexion réussie", time: "05/03/2026 15:30", type: "success", ip: "192.168.1.22" },
  { id: 3, user: "Inconnu", role: "-", action: "Tentative échouée", time: "05/03/2026 14:15", type: "error", ip: "192.168.1.55" },
  { id: 4, user: "Paul Martin", role: "chef_de_site", action: "Connexion réussie", time: "05/03/2026 09:00", type: "success", ip: "192.168.1.33" },
  { id: 5, user: "Sophie Bernard", role: "comptable", action: "Déconnexion", time: "04/03/2026 18:00", type: "info", ip: "192.168.1.44" },
  { id: 6, user: "Jean Dupont", role: "admin", action: "Compte créé: Paul Martin", time: "04/03/2026 10:05", type: "info", ip: "192.168.1.10" },
];

const TYPE_CONFIG = {
  success: { icon: "CheckCircle", color: "var(--color-success)", bg: "rgba(56,161,105,0.1)" },
  error: { icon: "XCircle", color: "var(--color-error)", bg: "rgba(229,62,62,0.1)" },
  info: { icon: "Info", color: "#3182CE", bg: "rgba(49,130,206,0.1)" },
};

const ROLE_LABELS = {
  admin: "Admin",
  directeur: "Directeur",
  chef_de_site: "Chef",
  comptable: "Comptable",
  "-": "-",
};

export default function ActivityLog() {
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Icon name="Activity" size={18} color="var(--color-primary)" />
        <h3 className="text-sm font-semibold" style={{ color: "var(--color-foreground)", fontFamily: "var(--font-heading)" }}>
          Journal des activités
        </h3>
        <span
          className="ml-auto text-xs px-2 py-0.5 rounded-full"
          style={{ background: "var(--color-muted)", color: "var(--color-muted-foreground)", fontFamily: "var(--font-caption)" }}
        >
          {ACTIVITY_LOG?.length} entrées
        </span>
      </div>
      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
        {ACTIVITY_LOG?.map((entry) => {
          const cfg = TYPE_CONFIG?.[entry?.type] || TYPE_CONFIG?.info;
          return (
            <div
              key={entry?.id}
              className="flex items-start gap-3 p-3 rounded-lg border"
              style={{ background: cfg?.bg, borderColor: "var(--color-border)" }}
            >
              <div className="flex-shrink-0 mt-0.5">
                <Icon name={cfg?.icon} size={15} color={cfg?.color} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold truncate" style={{ color: "var(--color-foreground)", fontFamily: "var(--font-caption)" }}>
                    {entry?.user}
                  </span>
                  {entry?.role !== "-" && (
                    <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: "var(--color-muted)", color: "var(--color-muted-foreground)", fontFamily: "var(--font-caption)" }}>
                      {ROLE_LABELS?.[entry?.role] || entry?.role}
                    </span>
                  )}
                </div>
                <p className="text-xs mt-0.5" style={{ color: "var(--color-muted-foreground)", fontFamily: "var(--font-caption)" }}>
                  {entry?.action}
                </p>
              </div>
              <div className="flex-shrink-0 text-right">
                <p className="text-xs whitespace-nowrap" style={{ color: "var(--color-muted-foreground)", fontFamily: "var(--font-data)" }}>
                  {entry?.time}
                </p>
                <p className="text-xs whitespace-nowrap" style={{ color: "var(--color-muted-foreground)", fontFamily: "var(--font-data)" }}>
                  {entry?.ip}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}