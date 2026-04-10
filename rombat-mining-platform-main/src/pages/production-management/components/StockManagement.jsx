import React from "react";
import Icon from "components/AppIcon";

const STOCK_DATA = [
  { dimension: "0/4 mm", available: 2450, moved: 1200, unit: "t", alert: false },
  { dimension: "4/8 mm", available: 1820, moved: 980, unit: "t", alert: false },
  { dimension: "8/16 mm", available: 3100, moved: 1540, unit: "t", alert: false },
  { dimension: "16/32 mm", available: 890, moved: 2100, unit: "t", alert: true },
  { dimension: "32/63 mm", available: 4200, moved: 800, unit: "t", alert: false },
  { dimension: "Tout-venant", available: 6800, moved: 3200, unit: "t", alert: false },
];

export default function StockManagement() {
  const totalAvailable = STOCK_DATA?.reduce((s, d) => s + d?.available, 0);
  const totalMoved = STOCK_DATA?.reduce((s, d) => s + d?.moved, 0);

  return (
    <div className="rounded-xl border p-4 md:p-6" style={{ background: "var(--color-card)", borderColor: "var(--color-border)", boxShadow: "var(--shadow-md)" }}>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg" style={{ background: "rgba(214,158,46,0.12)" }}>
            <Icon name="Package" size={18} color="var(--color-accent)" />
          </div>
          <div>
            <h3 className="text-base font-semibold" style={{ fontFamily: "var(--font-heading)", color: "var(--color-foreground)" }}>
              Stock de Granulats
            </h3>
            <p className="text-xs" style={{ color: "var(--color-muted-foreground)", fontFamily: "var(--font-caption)" }}>
              Disponibilité par dimension
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs" style={{ color: "var(--color-muted-foreground)", fontFamily: "var(--font-caption)" }}>Total disponible</p>
          <p className="text-lg font-bold" style={{ color: "var(--color-foreground)", fontFamily: "var(--font-data)" }}>
            {totalAvailable?.toLocaleString("fr-FR")} t
          </p>
        </div>
      </div>
      <div className="space-y-3">
        {STOCK_DATA?.map((item) => {
          const total = item?.available + item?.moved;
          const pct = Math.round((item?.available / total) * 100);
          return (
            <div key={item?.dimension} className="rounded-lg p-3" style={{ background: "var(--color-muted)" }}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {item?.alert && <Icon name="AlertTriangle" size={13} color="var(--color-error)" />}
                  <span className="text-sm font-medium" style={{ color: "var(--color-foreground)", fontFamily: "var(--font-caption)" }}>
                    {item?.dimension}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs" style={{ fontFamily: "var(--font-data)" }}>
                  <span style={{ color: "var(--color-success)" }}>
                    ↑ {item?.available?.toLocaleString("fr-FR")} t
                  </span>
                  <span style={{ color: "var(--color-muted-foreground)" }}>
                    ↓ {item?.moved?.toLocaleString("fr-FR")} t
                  </span>
                </div>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--color-border)" }}>
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${pct}%`,
                    background: item?.alert ? "var(--color-error)" : pct > 60 ? "var(--color-success)" : "var(--color-accent)",
                  }}
                />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-xs" style={{ color: "var(--color-muted-foreground)", fontFamily: "var(--font-caption)" }}>
                  {item?.alert ? "⚠ Stock faible" : "Disponible"}
                </span>
                <span className="text-xs font-semibold" style={{ color: "var(--color-muted-foreground)", fontFamily: "var(--font-data)" }}>
                  {pct}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
      <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t" style={{ borderColor: "var(--color-border)" }}>
        <div className="text-center">
          <p className="text-xs" style={{ color: "var(--color-muted-foreground)", fontFamily: "var(--font-caption)" }}>Total Écoulé (mois)</p>
          <p className="text-base font-bold" style={{ color: "var(--color-foreground)", fontFamily: "var(--font-data)" }}>
            {totalMoved?.toLocaleString("fr-FR")} t
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs" style={{ color: "var(--color-muted-foreground)", fontFamily: "var(--font-caption)" }}>Alertes Stock</p>
          <p className="text-base font-bold" style={{ color: "var(--color-error)", fontFamily: "var(--font-data)" }}>
            {STOCK_DATA?.filter((d) => d?.alert)?.length}
          </p>
        </div>
      </div>
    </div>
  );
}