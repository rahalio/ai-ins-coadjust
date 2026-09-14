"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { AllocationPolicy, CombinationBaseline } from "@coadjust/shared";
import { Shell } from "@/components/Shell";
import { RedeployGate } from "@/components/DomainChrome";
import { getStoredUser, listData, postData } from "@/lib/api";

export default function PolicyEditorPage() {
  const { id: decisionTypeId } = useParams<{ id: string }>();
  const [policies, setPolicies] = useState<AllocationPolicy[]>([]);
  const [baselines, setBaselines] = useState<CombinationBaseline[]>([]);
  const [targetMode, setTargetMode] = useState<"paired" | "model_only" | "human_only">(
    "paired"
  );
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function refresh() {
    const [p, b] = await Promise.all([
      listData<AllocationPolicy>(
        `/v1/allocation-policies?decisionTypeId=${decisionTypeId}`
      ),
      listData<CombinationBaseline>(
        `/v1/evidence/combination-baselines?decisionTypeId=${decisionTypeId}`
      ),
    ]);
    setPolicies(p);
    setBaselines(b);
  }

  useEffect(() => {
    refresh().catch((e) => setErr(e.message));
  }, [decisionTypeId]);

  const baseline = baselines[0];
  const modelOk =
    baseline && (baseline.modelOnlyAccuracy ?? 0) >= (baseline.pairedAccuracy ?? 0);

  return (
    <Shell>
      <h1>Allocation policy</h1>
      <p className="muted mono" style={{ marginBottom: 24 }}>
        {decisionTypeId}
      </p>
      {err && <p style={{ color: "var(--color-coral)" }}>{err}</p>}
      {msg && <p style={{ color: "var(--color-teal)" }}>{msg}</p>}
      <div className="grid-2">
        <section className="panel stack">
          <h2>Versions</h2>
          {policies.map((p) => (
            <div
              key={`${p.id}-${p.version}`}
              style={{
                borderBottom: "1px solid var(--color-steel-700)",
                paddingBottom: 12,
              }}
            >
              <div className="row" style={{ justifyContent: "space-between" }}>
                <span className="mono">
                  {p.id} v{p.version}
                </span>
                <span>{p.state}</span>
              </div>
              <div className="muted">
                target {p.targetMode}
                {p.state === "draft" && (
                  <>
                    {" · "}
                    <button
                      className="btn secondary"
                      type="button"
                      onClick={async () => {
                        try {
                          const user = getStoredUser();
                          await postData(`/v1/allocation-policies/${p.id}/approval`, {
                            approverId: user?.id ?? "user_jordan",
                            forum: "model_governance_committee",
                            rationale: "Baseline supports mode change",
                          });
                          setMsg(`Approved ${p.id}`);
                          await refresh();
                        } catch (e) {
                          setErr(e instanceof Error ? e.message : "Approve failed");
                        }
                      }}
                    >
                      Approve
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </section>
        <section className="panel stack">
          <h2>New draft</h2>
          <RedeployGate
            ok={targetMode !== "model_only"}
            detail={
              targetMode === "model_only"
                ? "Model-only requires funded redeployments (BR-6) and model≥paired (BR-1)."
                : "Paired / human-only drafts do not release capacity."
            }
          />
          <label className="stack" style={{ gap: 6 }}>
            <span className="muted">Target mode</span>
            <select
              value={targetMode}
              onChange={(e) =>
                setTargetMode(e.target.value as typeof targetMode)
              }
              style={{
                background: "var(--color-steel-950)",
                color: "var(--color-ink)",
                border: "1px solid var(--color-steel-700)",
                padding: 10,
              }}
            >
              <option value="paired">paired</option>
              <option value="human_only">human_only</option>
              <option value="model_only">model_only</option>
            </select>
          </label>
          <p className="muted">
            BR-1 gate: {modelOk ? "model-only eligible" : "paired still better"}
          </p>
          <button
            className="btn"
            type="button"
            onClick={async () => {
              setErr(null);
              try {
                if (!baseline) throw new Error("No baseline");
                const created = await postData<AllocationPolicy>("/v1/allocation-policies", {
                  decisionTypeId,
                  targetMode,
                  supportingBaselineId: baseline.id,
                  minimumCombinedAccuracy: 0.97,
                  minimumConfidence: 0.75,
                });
                setMsg(`Created draft ${created.id}`);
                await refresh();
              } catch (e) {
                setErr(e instanceof Error ? e.message : "Create failed");
              }
            }}
          >
            Save draft
          </button>
        </section>
      </div>
    </Shell>
  );
}
