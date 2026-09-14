"use client";

import { useEffect, useState } from "react";
import type { ConductGuardrail, DecisionType } from "@coadjust/shared";
import { Shell } from "@/components/Shell";
import { SuspensionBanner } from "@/components/DomainChrome";
import { listData, postData } from "@/lib/api";

export default function GuardrailsPage() {
  const [guards, setGuards] = useState<ConductGuardrail[]>([]);
  const [types, setTypes] = useState<DecisionType[]>([]);
  const [msg, setMsg] = useState<string | null>(null);

  async function refresh() {
    const [g, t] = await Promise.all([
      listData<ConductGuardrail>("/v1/evidence/guardrail-breaches"),
      listData<DecisionType>("/v1/decision-types"),
    ]);
    setGuards(g);
    setTypes(t);
  }

  useEffect(() => {
    refresh().catch((e) => setMsg(e.message));
  }, []);

  const suspended = types.filter((t) => t.allocationMode === "suspended");

  return (
    <Shell>
      <h1>Conduct guardrails</h1>
      <p className="muted" style={{ marginBottom: 24 }}>
        Auto-suspend automation when cycle time or complaints deteriorate.
      </p>
      {suspended.map((s) => (
        <SuspensionBanner key={s.id} decisionTypeId={s.id} reason="governance hold" />
      ))}
      {msg && <p className="muted">{msg}</p>}
      <section className="panel">
        <table className="table">
          <thead>
            <tr>
              <th>Decision type</th>
              <th>Metric</th>
              <th>Observed</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {guards.map((g) => (
              <tr key={g.id}>
                <td className="mono">{g.decisionTypeId}</td>
                <td>{g.metric}</td>
                <td className="mono">
                  {g.observedValue} / {g.threshold}
                </td>
                <td>{g.status}</td>
                <td>
                  {g.status === "open" && (
                    <button
                      className="btn danger"
                      type="button"
                      onClick={async () => {
                        await postData(`/v1/decision-types/${g.decisionTypeId}/suspension`, {
                          reason: `${g.metric} breach`,
                          guardrailId: g.id,
                          resumeRequiresApproval: true,
                        });
                        setMsg(`Suspended ${g.decisionTypeId}`);
                        await refresh();
                      }}
                    >
                      Suspend automation
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </Shell>
  );
}
