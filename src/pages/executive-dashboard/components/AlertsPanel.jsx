import React, { useState } from "react";
import Icon from "components/AppIcon";


const initialAlerts = [
  {
    id: 1,
    type: "critical",
    title: "Stock Carburant Critique — Site Kamoto",
    message: "Niveau carburant à 12% (180 L restants). Livraison urgente requise sous 24h.",
    time: "Il y a 5 min",
    icon: "Fuel",
    acknowledged: false,
  },
  {
    id: 2,
    type: "warning",
    title: "Maintenance Préventive — EX-003",
    message: "Excavatrice EX-003 atteint 450h de fonctionnement. Révision planifiée dans 48h.",
    time: "Il y a 1h",
    icon: "Wrench",
    acknowledged: false,
  },
  {
    id: 3,
    type: "warning",
    title: "Objectif Production Non Atteint",
    message: "Production journalière à 78% de l'objectif (1 170 t / 1 500 t). Écart: -330 t.",
    time: "Il y a 2h",
    icon: "BarChart3",
    acknowledged: false,
  },
  {
    id: 4,
    type: "info",
    title: "Rapport Mensuel Disponible",
    message: "Le rapport de production de février 2026 est prêt pour export PDF/Excel.",
    time: "Il y a 3h",
    icon: "FileText",
    acknowledged: true,
  },
  {
    id: 5,
    type: "warning",
    title: "Équipement BU-002 Hors Service",
    message: "Bulldozer BU-002 signalé hors service depuis 06h00. Impact sur production Site B.",
    time: "Il y a 4h",
    icon: "AlertTriangle",
    acknowledged: false,
  },
];

const TYPE_CONFIG = {
  critical: {
    bg: "rgba(229,62,62,0.06)",
    border: "#E53E3E",
    iconColor: "var(--color-error)",
    badgeBg: "rgba(229,62,62,0.12)",
    badgeText: "var(--color-error)",
    label: "Critique",
  },
  warning: {
    bg: "rgba(214,158,46,0.06)",
    border: "var(--color-accent)",
    iconColor: "var(--color-warning)",
    badgeBg: "rgba(214,158,46,0.12)",
    badgeText: "var(--color-warning)",
    label: "Attention",
  },
  info: {
    bg: "rgba(49,130,206,0.06)",
    border: "#3182CE",
    iconColor: "#3182CE",
    badgeBg: "rgba(49,130,206,0.12)",
    badgeText: "#3182CE",
    label: "Info",
  },
};

export default function AlertsPanel({ onNavigate }) {
  const [alerts, setAlerts] = useState(initialAlerts);
  const [filter, setFilter] = useState("all");

  const filtered = alerts?.filter((a) => {
    if (filter === "all") return true;
    if (filter === "unread") return !a?.acknowledged;
    return a?.type === filter;
  });

  const unreadCount = alerts?.filter((a) => !a?.acknowledged)?.length;

  const acknowledge = (id) => {
    setAlerts((prev) => prev?.map((a) => (a?.id === id ? { ...a, acknowledged: true } : a)));
  };

  const acknowledgeAll = () => {
    setAlerts((prev) => prev?.map((a) => ({ ...a, acknowledged: true })));
  };

  return (
    <div
      className="rounded-xl border flex flex-col"
      style={{
        background: "var(--color-card)",
        borderColor: "var(--color-border)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 md:px-5 py-4 border-b"
        style={{ borderColor: "var(--color-border)" }}
      >
        <div className="flex items-center gap-2">
          <Icon name="Bell" size={18} color="var(--color-primary)" />
          <h3
            className="text-base font-semibold"
            style={{ color: "var(--color-foreground)", fontFamily: "var(--font-heading)" }}
          >
            Alertes Opérationnelles
          </h3>
          {unreadCount > 0 && (
            <span
              className="px-2 py-0.5 rounded-full text-xs font-bold"
              style={{
                background: "var(--color-error)",
                color: "#fff",
                fontFamily: "var(--font-caption)",
              }}
            >
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={acknowledgeAll}
            className="text-xs font-medium hover:underline transition-colors"
            style={{ color: "var(--color-primary)", fontFamily: "var(--font-caption)" }}
          >
            Tout acquitter
          </button>
        )}
      </div>
      {/* Filter tabs */}
      <div
        className="flex items-center gap-1 px-4 md:px-5 py-2 border-b overflow-x-auto"
        style={{ borderColor: "var(--color-border)" }}
      >
        {[
          { key: "all", label: "Toutes" },
          { key: "unread", label: "Non lues" },
          { key: "critical", label: "Critiques" },
          { key: "warning", label: "Attention" },
        ]?.map((f) => (
          <button
            key={f?.key}
            onClick={() => setFilter(f?.key)}
            className="px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 transition-all duration-200"
            style={{
              background: filter === f?.key ? "var(--color-primary)" : "var(--color-muted)",
              color: filter === f?.key ? "#fff" : "var(--color-muted-foreground)",
              fontFamily: "var(--font-caption)",
            }}
          >
            {f?.label}
          </button>
        ))}
      </div>
      {/* Alert list */}
      <div className="flex-1 overflow-y-auto max-h-80 md:max-h-96">
        {filtered?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2">
            <Icon name="CheckCircle" size={36} color="var(--color-success)" />
            <p
              className="text-sm"
              style={{ color: "var(--color-muted-foreground)", fontFamily: "var(--font-caption)" }}
            >
              Aucune alerte active
            </p>
          </div>
        ) : (
          filtered?.map((alert) => {
            const cfg = TYPE_CONFIG?.[alert?.type];
            return (
              <div
                key={alert?.id}
                className="flex items-start gap-3 px-4 md:px-5 py-3 border-b transition-all duration-200"
                style={{
                  borderBottomColor: "var(--color-border)",
                  background: alert?.acknowledged ? "transparent" : cfg?.bg,
                  borderLeft: `3px solid ${alert?.acknowledged ? "transparent" : cfg?.border}`,
                  opacity: alert?.acknowledged ? 0.6 : 1,
                }}
              >
                <div
                  className="flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0 mt-0.5"
                  style={{ background: cfg?.badgeBg }}
                >
                  <Icon name={alert?.icon} size={15} color={cfg?.iconColor} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <p
                      className="text-xs font-semibold leading-tight"
                      style={{ color: "var(--color-foreground)", fontFamily: "var(--font-caption)" }}
                    >
                      {alert?.title}
                    </p>
                    <span
                      className="text-xs flex-shrink-0"
                      style={{ color: "var(--color-muted-foreground)", fontFamily: "var(--font-caption)" }}
                    >
                      {alert?.time}
                    </span>
                  </div>
                  <p
                    className="text-xs mt-1 leading-relaxed"
                    style={{ color: "var(--color-muted-foreground)", fontFamily: "var(--font-caption)" }}
                  >
                    {alert?.message}
                  </p>
                  {!alert?.acknowledged && (
                    <button
                      onClick={() => acknowledge(alert?.id)}
                      className="mt-2 text-xs font-medium hover:underline transition-colors"
                      style={{ color: cfg?.iconColor, fontFamily: "var(--font-caption)" }}
                    >
                      Acquitter
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}