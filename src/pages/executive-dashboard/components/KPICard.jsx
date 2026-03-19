import React from "react";
import Icon from "components/AppIcon";

export default function KPICard({ title, value, unit, trend, trendValue, icon, iconColor, bgColor, subtitle }) {
  const isPositive = trend === "up";
  const isNeutral = trend === "neutral";

  return (
    <div
      className="rounded-xl p-4 md:p-5 flex flex-col gap-3 border"
      style={{
        background: "var(--color-card)",
        borderColor: "var(--color-border)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p
            className="text-xs font-medium uppercase tracking-wider truncate"
            style={{ color: "var(--color-muted-foreground)", fontFamily: "var(--font-caption)" }}
          >
            {title}
          </p>
          <div className="flex items-baseline gap-1 mt-1 flex-wrap">
            <span
              className="text-2xl md:text-3xl font-bold whitespace-nowrap"
              style={{ color: "var(--color-foreground)", fontFamily: "var(--font-heading)" }}
            >
              {value}
            </span>
            {unit && (
              <span
                className="text-sm font-medium"
                style={{ color: "var(--color-muted-foreground)", fontFamily: "var(--font-caption)" }}
              >
                {unit}
              </span>
            )}
          </div>
          {subtitle && (
            <p
              className="text-xs mt-1 truncate"
              style={{ color: "var(--color-muted-foreground)", fontFamily: "var(--font-caption)" }}
            >
              {subtitle}
            </p>
          )}
        </div>
        <div
          className="flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-xl flex-shrink-0"
          style={{ background: bgColor || "rgba(44,85,48,0.12)" }}
        >
          <Icon name={icon} size={20} color={iconColor || "var(--color-primary)"} strokeWidth={2} />
        </div>
      </div>

      {trendValue !== undefined && (
        <div className="flex items-center gap-1.5">
          <div
            className="flex items-center gap-1 px-2 py-0.5 rounded-full"
            style={{
              background: isNeutral
                ? "rgba(74,85,104,0.1)"
                : isPositive
                ? "rgba(56,161,105,0.12)"
                : "rgba(229,62,62,0.12)",
            }}
          >
            <Icon
              name={isNeutral ? "Minus" : isPositive ? "TrendingUp" : "TrendingDown"}
              size={12}
              color={isNeutral ? "var(--color-secondary)" : isPositive ? "var(--color-success)" : "var(--color-error)"}
            />
            <span
              className="text-xs font-semibold"
              style={{
                color: isNeutral ? "var(--color-secondary)" : isPositive ? "var(--color-success)" : "var(--color-error)",
                fontFamily: "var(--font-caption)",
              }}
            >
              {trendValue}
            </span>
          </div>
          <span
            className="text-xs"
            style={{ color: "var(--color-muted-foreground)", fontFamily: "var(--font-caption)" }}
          >
            vs hier
          </span>
        </div>
      )}
    </div>
  );
}