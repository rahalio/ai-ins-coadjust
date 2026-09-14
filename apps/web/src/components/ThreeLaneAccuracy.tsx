"use client";

import type { CombinationBaseline } from "@coadjust/shared";

export function ThreeLaneAccuracy({
  baseline,
  hero,
}: {
  baseline?: CombinationBaseline | null;
  hero?: boolean;
}) {
  if (!baseline) {
    return <p className="muted">Incomplete baseline — cannot approve mode change.</p>;
  }
  const lanes = [
    { label: "Model-only", value: baseline.modelOnlyAccuracy ?? 0, color: "var(--color-steel-700)" },
    { label: "Human-only", value: baseline.humanOnlyAccuracy ?? 0, color: "var(--color-slate-blue)" },
    { label: "Paired", value: baseline.pairedAccuracy ?? 0, color: "var(--color-teal)" },
  ];
  return (
    <div style={{ animation: "pairSettle var(--motion-pair)" }}>
      {hero && (
        <div style={{ marginBottom: 16 }}>
          <div className="muted" style={{ fontSize: "0.85rem" }}>
            Combination premium
          </div>
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "2.4rem",
              color: "var(--color-teal)",
            }}
          >
            +{((baseline.combinationPremium ?? 0) * 100).toFixed(1)} pts
          </div>
        </div>
      )}
      <div className="stack" style={{ gap: 10 }}>
        {lanes.map((lane) => (
          <div key={lane.label}>
            <div className="row" style={{ justifyContent: "space-between", marginBottom: 4 }}>
              <span>{lane.label}</span>
              <span className="mono">{(lane.value * 100).toFixed(1)}%</span>
            </div>
            <div
              style={{
                height: 8,
                background: "var(--color-steel-800)",
                borderRadius: 2,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${Math.min(100, lane.value * 100)}%`,
                  height: "100%",
                  background: lane.color,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
