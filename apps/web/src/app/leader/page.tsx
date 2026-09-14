"use client";

import { useEffect, useState } from "react";
import type {
  DecisionType,
  DeferenceReport,
  QueueCapacityPlan,
} from "@coadjust/shared";
import { Shell } from "@/components/Shell";
import { DeferenceAlert } from "@/components/DomainChrome";
import { getData, listData } from "@/lib/api";

export default function LeaderHomePage() {
  const [types, setTypes] = useState<DecisionType[]>([]);
  const [report, setReport] = useState<DeferenceReport | null>(null);
  const [capacity, setCapacity] = useState<QueueCapacityPlan | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      listData<DecisionType>("/v1/decision-types"),
      getData<DeferenceReport>(
        "/v1/evidence/deference-report?decisionTypeId=dt_motor_glass&purpose=pairing_design"
      ),
      getData<QueueCapacityPlan>("/v1/workforce/capacity-plans?period=2026Q2"),
    ])
      .then(([t, r, c]) => {
        setTypes(t);
        setReport(r);
        setCapacity(c);
      })
      .catch((e) => setError(e.message));
  }, []);

  return (
    <Shell>
      <h1>Team leader home</h1>
      <p className="muted" style={{ marginBottom: 24 }}>
        Mode map, deference alerts, and queue ageing vs service targets.
      </p>
      {error && <p style={{ color: "var(--color-coral)" }}>{error}</p>}
      <div className="grid-2">
        <section className="panel">
          <h2>Decision-type mode map</h2>
          <table className="table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Mode</th>
              </tr>
            </thead>
            <tbody>
              {types.map((t) => (
                <tr key={t.id}>
                  <td>{t.name}</td>
                  <td className="mono">{t.allocationMode}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
        <section className="stack">
          <DeferenceAlert
            divergence={report?.divergence}
            interpretation={report?.interpretation}
          />
          <div className="panel">
            <h2>Queue capacity</h2>
            {(capacity?.queues ?? []).map((q) => (
              <div key={q.queue} className="row" style={{ justifyContent: "space-between" }}>
                <span>{q.queue}</span>
                <span className="mono muted">
                  shortfall {q.shortfall ?? 0} · vol {q.projectedVolume}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </Shell>
  );
}
