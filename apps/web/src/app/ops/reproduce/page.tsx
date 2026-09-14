"use client";

import { FormEvent, useState } from "react";
import type { PolicyReproduction } from "@coadjust/shared";
import { Shell } from "@/components/Shell";
import { AccountableNameplate, PolicyVersionChip } from "@/components/DomainChrome";
import { getData } from "@/lib/api";

export default function ReproducePage() {
  const [id, setId] = useState("dr_done_001");
  const [result, setResult] = useState<PolicyReproduction | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const data = await getData<PolicyReproduction>(
        `/v1/governance/policy-reproduction?decisionRequestId=${encodeURIComponent(id)}`
      );
      setResult(data);
    } catch (err) {
      setResult(null);
      setError(err instanceof Error ? err.message : "Not found");
    }
  }

  return (
    <Shell>
      <h1>Policy reproduction</h1>
      <p className="muted" style={{ marginBottom: 24 }}>
        For any historic decision: which policy version and accountable human applied.
      </p>
      <form className="panel row" onSubmit={onSubmit}>
        <input
          className="mono"
          value={id}
          onChange={(e) => setId(e.target.value)}
          style={{
            flex: 1,
            background: "var(--color-steel-950)",
            color: "var(--color-ink)",
            border: "1px solid var(--color-steel-700)",
            padding: 10,
            borderRadius: 4,
          }}
          placeholder="decisionRequestId"
        />
        <button className="btn" type="submit">
          Reproduce
        </button>
      </form>
      {error && <p style={{ color: "var(--color-coral)" }}>{error}</p>}
      {result && (
        <section className="panel stack" style={{ marginTop: 20 }}>
          <div className="row" style={{ justifyContent: "space-between" }}>
            <span className="mono">{result.decisionRequestId}</span>
            <PolicyVersionChip
              policyId={result.policyId}
              version={result.policyVersion}
            />
          </div>
          <div>
            Mode applied: <strong className="mono">{result.modeApplied}</strong>
          </div>
          <AccountableNameplate
            name={result.accountableHandlerId ?? "unknown"}
            handlerId={result.accountableHandlerId}
          />
          <div>
            <div className="muted">Exclusion flags at decision</div>
            {(result.exclusionFlagsAtDecision ?? []).length === 0 ? (
              <span className="muted">None</span>
            ) : (
              result.exclusionFlagsAtDecision?.map((f) => (
                <div key={f.flag} className="mono">
                  {f.flag} · {f.source}
                </div>
              ))
            )}
          </div>
        </section>
      )}
    </Shell>
  );
}
