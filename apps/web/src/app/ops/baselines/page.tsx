"use client";

import { useEffect, useState } from "react";
import type { CombinationBaseline, DecisionType } from "@coadjust/shared";
import { Shell } from "@/components/Shell";
import { ThreeLaneAccuracy } from "@/components/ThreeLaneAccuracy";
import { listData } from "@/lib/api";

export default function BaselinesPage() {
  const [baselines, setBaselines] = useState<CombinationBaseline[]>([]);
  const [types, setTypes] = useState<DecisionType[]>([]);
  const [selected, setSelected] = useState<string>("dt_motor_glass");

  useEffect(() => {
    Promise.all([
      listData<CombinationBaseline>("/v1/evidence/combination-baselines"),
      listData<DecisionType>("/v1/decision-types"),
    ]).then(([b, t]) => {
      setBaselines(b);
      setTypes(t);
      if (b[0]) setSelected(b[0].decisionTypeId);
    });
  }, []);

  const active = baselines.find((b) => b.decisionTypeId === selected);
  const dtype = types.find((t) => t.id === selected);
  const canModelOnly =
    active && (active.modelOnlyAccuracy ?? 0) >= (active.pairedAccuracy ?? 0);

  return (
    <Shell>
      <h1>Combination baselines</h1>
      <p className="muted" style={{ marginBottom: 24 }}>
        Fund the programme on the combination premium — not STP rate.
      </p>
      <div className="grid-2">
        <section className="panel">
          <table className="table">
            <thead>
              <tr>
                <th>Decision type</th>
                <th>Premium</th>
                <th>Gate</th>
              </tr>
            </thead>
            <tbody>
              {baselines.map((b) => (
                <tr
                  key={b.id}
                  onClick={() => setSelected(b.decisionTypeId)}
                  style={{
                    cursor: "pointer",
                    background:
                      selected === b.decisionTypeId
                        ? "rgba(43,184,163,0.08)"
                        : undefined,
                  }}
                >
                  <td>
                    {types.find((t) => t.id === b.decisionTypeId)?.name ?? b.decisionTypeId}
                  </td>
                  <td className="mono">
                    +{((b.combinationPremium ?? 0) * 100).toFixed(1)} pts
                  </td>
                  <td className="mono muted">
                    {(b.modelOnlyAccuracy ?? 0) >= (b.pairedAccuracy ?? 0)
                      ? "model-only ok"
                      : "paired better"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
        <section className="panel">
          <h2>{dtype?.name ?? selected}</h2>
          <ThreeLaneAccuracy baseline={active} hero />
          <p className="muted" style={{ marginTop: 16 }}>
            {active?.populationDefinition}
          </p>
          <p style={{ marginTop: 12 }}>
            Model-only move:{" "}
            <strong style={{ color: canModelOnly ? "var(--color-teal)" : "var(--color-coral)" }}>
              {canModelOnly ? "gate open" : "blocked — paired still better (BR-1)"}
            </strong>
          </p>
        </section>
      </div>
    </Shell>
  );
}
