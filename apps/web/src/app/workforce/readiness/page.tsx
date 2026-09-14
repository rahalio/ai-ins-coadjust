"use client";

import { useEffect, useState } from "react";
import type { ReadinessAssessment } from "@coadjust/shared";
import { Shell } from "@/components/Shell";
import { listData } from "@/lib/api";

export default function ReadinessPage() {
  const [items, setItems] = useState<ReadinessAssessment[]>([]);

  useEffect(() => {
    listData<ReadinessAssessment>("/v1/workforce/readiness-assessments").then(setItems);
  }, []);

  const readyShare =
    items.length === 0
      ? 0
      : items.filter((i) => i.state === "ready" || i.state === "certified").length /
        items.length;

  return (
    <Shell>
      <h1>Readiness and certification</h1>
      <p className="muted" style={{ marginBottom: 24 }}>
        Per-role readiness from production quality — not course ticks alone.
      </p>
      <section className="panel" style={{ marginBottom: 20 }}>
        <div className="muted">Ready / certified vs one-in-four baseline</div>
        <div style={{ fontFamily: "var(--font-display)", fontSize: "2rem" }}>
          {(readyShare * 100).toFixed(0)}%
        </div>
      </section>
      <section className="panel">
        <table className="table">
          <thead>
            <tr>
              <th>Handler</th>
              <th>Role</th>
              <th>State</th>
              <th>Accuracy</th>
            </tr>
          </thead>
          <tbody>
            {items.map((i) => (
              <tr key={i.id}>
                <td className="mono">{i.handlerId}</td>
                <td className="mono">{i.roleProfileId}</td>
                <td>{i.state}</td>
                <td className="mono">
                  {((i.productionAccuracy ?? 0) * 100).toFixed(1)}% · n=
                  {i.productionDecisionCount}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </Shell>
  );
}
