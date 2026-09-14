"use client";

import { useEffect, useState } from "react";
import type { QueueCapacityPlan } from "@coadjust/shared";
import { Shell } from "@/components/Shell";
import { getData } from "@/lib/api";

export default function CapacityPage() {
  const [plan, setPlan] = useState<QueueCapacityPlan | null>(null);

  useEffect(() => {
    getData<QueueCapacityPlan>("/v1/workforce/capacity-plans?period=2026Q2").then(setPlan);
  }, []);

  return (
    <Shell>
      <h1>Queue capacity planning</h1>
      <p className="muted" style={{ marginBottom: 24 }}>
        Project demand under proposed allocation changes so automation and redeployment are
        one decision.
      </p>
      {!plan ? (
        <p className="muted">Loading plan…</p>
      ) : (
        <section className="panel stack">
          <div className="row" style={{ justifyContent: "space-between" }}>
            <span>Period {plan.period}</span>
            <span className="mono muted">
              released {plan.releasedCapacityHours}h · unassigned{" "}
              {plan.unassignedCapacityHours}h
            </span>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>Queue</th>
                <th>Volume</th>
                <th>Required</th>
                <th>Certified</th>
                <th>Shortfall</th>
              </tr>
            </thead>
            <tbody>
              {(plan.queues ?? []).map((q) => (
                <tr key={q.queue}>
                  <td>{q.queue}</td>
                  <td className="mono">{q.projectedVolume}</td>
                  <td className="mono">{q.requiredHandlers}</td>
                  <td className="mono">{q.certifiedHandlers}</td>
                  <td
                    className="mono"
                    style={{
                      color:
                        (q.shortfall ?? 0) > 0
                          ? "var(--color-coral)"
                          : "var(--color-teal)",
                    }}
                  >
                    {q.shortfall}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </Shell>
  );
}
