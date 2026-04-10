import React, { useState } from "react";
import Icon from "components/AppIcon";
import Button from "components/ui/Button";

const STATUS_CONFIG = {
  actif: { label: "Actif", color: "var(--color-success)", bg: "rgba(56, 161, 84, 0.12)", icon: "CheckCircle" },
  maintenance: { label: "Maintenance", color: "var(--color-warning)", bg: "rgba(214,158,46,0.12)", icon: "Wrench" },
  panne: { label: "En Panne", color: "var(--color-error)", bg: "rgba(229,62,62,0.12)", icon: "AlertTriangle" },
  inactif: { label: "Inactif", color: "var(--color-secondary)", bg: "rgba(74,85,104,0.12)", icon: "PauseCircle" },
};

export default function EquipmentCard({ equipment, onStatusChange }) {
  const [expanded, setExpanded] = useState(false);
  const status = STATUS_CONFIG?.[equipment?.status] || STATUS_CONFIG?.inactif;
  const fuelPct = Math.round((equipment?.fuelLevel / equipment?.fuelCapacity) * 100);

  return (
    <div
      className="rounded-xl border transition-all duration-200"
      style={{
        background: "var(--color-card)",
        borderColor: equipment?.status === "panne" ? "var(--color-error)" : "var(--color-border)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg flex-shrink-0" style={{ background: "rgba(44,85,48,0.1)" }}>
              <Icon name="Truck" size={18} color="var(--color-primary)" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate" style={{ color: "var(--color-foreground)", fontFamily: "var(--font-heading)" }}>
                {equipment?.id}
              </p>
              <p className="text-xs truncate" style={{ color: "var(--color-muted-foreground)", fontFamily: "var(--font-caption)" }}>
                {equipment?.type}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full flex-shrink-0" style={{ background: status?.bg }}>
            <Icon name={status?.icon} size={12} color={status?.color} />
            <span className="text-xs font-medium whitespace-nowrap" style={{ color: status?.color, fontFamily: "var(--font-caption)" }}>
              {status?.label}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="rounded-lg p-2.5" style={{ background: "var(--color-muted)" }}>
            <p className="text-xs" style={{ color: "var(--color-muted-foreground)", fontFamily: "var(--font-caption)" }}>Heures totales</p>
            <p className="text-sm font-bold mt-0.5" style={{ color: "var(--color-foreground)", fontFamily: "var(--font-data)" }}>
              {equipment?.totalHours?.toLocaleString("fr-FR")} h
            </p>
          </div>
          <div className="rounded-lg p-2.5" style={{ background: "var(--color-muted)" }}>
            <p className="text-xs" style={{ color: "var(--color-muted-foreground)", fontFamily: "var(--font-caption)" }}>Conso. carburant</p>
            <p className="text-sm font-bold mt-0.5" style={{ color: "var(--color-foreground)", fontFamily: "var(--font-data)" }}>
              {equipment?.fuelConsumption} L/h
            </p>
          </div>
        </div>

        <div className="mt-3">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs" style={{ color: "var(--color-muted-foreground)", fontFamily: "var(--font-caption)" }}>
              <Icon name="Fuel" size={11} color="var(--color-muted-foreground)" className="inline mr-1" />
              Carburant
            </span>
            <span className="text-xs font-semibold" style={{ color: fuelPct < 20 ? "var(--color-error)" : "var(--color-foreground)", fontFamily: "var(--font-data)" }}>
              {fuelPct}% ({equipment?.fuelLevel}L)
            </span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--color-muted)" }}>
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${fuelPct}%`,
                background: fuelPct < 20 ? "var(--color-error)" : fuelPct < 40 ? "var(--color-warning)" : "var(--color-success)",
              }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between mt-3">
          <span className="text-xs" style={{ color: "var(--color-muted-foreground)", fontFamily: "var(--font-caption)" }}>
            <Icon name="MapPin" size={11} color="var(--color-muted-foreground)" className="inline mr-1" />
            {equipment?.site}
          </span>
          <button
            onClick={() => setExpanded((p) => !p)}
            className="flex items-center gap-1 text-xs transition-colors"
            style={{ color: "var(--color-primary)", fontFamily: "var(--font-caption)" }}
          >
            {expanded ? "Moins" : "Détails"}
            <Icon name={expanded ? "ChevronUp" : "ChevronDown"} size={12} color="var(--color-primary)" />
          </button>
        </div>
      </div>
      {expanded && (
        <div className="border-t px-4 pb-4 pt-3 space-y-3" style={{ borderColor: "var(--color-border)" }}>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span style={{ color: "var(--color-muted-foreground)", fontFamily: "var(--font-caption)" }}>Modèle:</span>
              <p className="font-medium mt-0.5" style={{ color: "var(--color-foreground)", fontFamily: "var(--font-caption)" }}>{equipment?.model}</p>
            </div>
            <div>
              <span style={{ color: "var(--color-muted-foreground)", fontFamily: "var(--font-caption)" }}>Dernière maintenance:</span>
              <p className="font-medium mt-0.5" style={{ color: "var(--color-foreground)", fontFamily: "var(--font-caption)" }}>{equipment?.lastMaintenance}</p>
            </div>
            <div>
              <span style={{ color: "var(--color-muted-foreground)", fontFamily: "var(--font-caption)" }}>Heures aujourd'hui:</span>
              <p className="font-medium mt-0.5" style={{ color: "var(--color-foreground)", fontFamily: "var(--font-data)" }}>{equipment?.hoursToday} h</p>
            </div>
            <div>
              <span style={{ color: "var(--color-muted-foreground)", fontFamily: "var(--font-caption)" }}>Prochaine révision:</span>
              <p className="font-medium mt-0.5" style={{ color: "var(--color-foreground)", fontFamily: "var(--font-caption)" }}>{equipment?.nextService}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant={equipment?.status === "actif" ? "warning" : "success"}
              size="sm"
              iconName={equipment?.status === "actif" ? "PauseCircle" : "PlayCircle"}
              iconPosition="left"
              onClick={() => onStatusChange(equipment?.id, equipment?.status === "actif" ? "maintenance" : "actif")}
            >
              {equipment?.status === "actif" ? "Mettre en maintenance" : "Activer"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}