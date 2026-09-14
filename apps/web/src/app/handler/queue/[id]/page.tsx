"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type {
  DecisionRequest,
  HumanJudgementCreate,
  Recommendation,
} from "@coadjust/shared";
import { Shell } from "@/components/Shell";
import {
  AccountableNameplate,
  FailClosedLock,
  PolicyVersionChip,
} from "@/components/DomainChrome";
import { getData, getStoredUser, listData, postData } from "@/lib/api";

export default function PairedReviewPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [req, setReq] = useState<DecisionRequest | null>(null);
  const [rec, setRec] = useState<Recommendation | null>(null);
  const [overrideReason, setOverrideReason] = useState("estimate_quality");
  const [narrative, setNarrative] = useState("");
  const [showOverride, setShowOverride] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const user = getStoredUser();

  useEffect(() => {
    Promise.all([
      listData<DecisionRequest>("/v1/decision-requests"),
      getData<Recommendation>(`/v1/decision-requests/${id}/recommendation`),
    ])
      .then(([reqs, recommendation]) => {
        setReq(reqs.find((r) => r.id === id) ?? null);
        setRec(recommendation);
      })
      .catch((e) => setError(e.message));
  }, [id]);

  const locked = (req?.exclusionFlags ?? []).some((f) =>
    ["vulnerable_customer", "bodily_injury", "fatality"].includes(f.flag)
  );

  async function submit(disposition: HumanJudgementCreate["disposition"]) {
    setBusy(true);
    setError(null);
    try {
      const body: HumanJudgementCreate = {
        handlerId: user?.handlerId ?? user?.id ?? "handler_ava",
        disposition,
        decidedAmount:
          disposition === "overridden" && narrative
            ? rec?.recommendedAmount
            : rec?.recommendedAmount,
        overrideReason: disposition === "overridden" ? overrideReason : undefined,
        overrideNarrative: disposition === "overridden" ? narrative : undefined,
        timeOnDecisionSeconds: 120,
      };
      if (disposition === "overridden") {
        body.decidedAmount = {
          amount: Math.max(0, (rec?.recommendedAmount?.amount ?? 0) - 40),
          currency: rec?.recommendedAmount?.currency ?? "EUR",
        };
      }
      await postData(`/v1/decision-requests/${id}/judgement`, body);
      router.push("/handler");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Shell>
      <div className="row" style={{ justifyContent: "space-between", marginBottom: 8 }}>
        <h1>Paired review</h1>
        <PolicyVersionChip policyId="pol_motor_glass" version={1} />
      </div>
      {error && <p style={{ color: "var(--color-coral)" }}>{error}</p>}
      {!req || !rec ? (
        <p className="muted">Loading decision…</p>
      ) : (
        <div className="grid-2">
          <section className="panel stack">
            <div>
              <div className="muted">Claim</div>
              <div style={{ fontSize: "1.2rem" }}>{req.claimReference}</div>
              <div className="mono muted">{req.id}</div>
            </div>
            {locked && (
              <FailClosedLock reason="Vulnerable or bodily-injury flags force human-only handling. Auto-allocation is blocked." />
            )}
            <AccountableNameplate
              name={user?.name ?? "Handler"}
              handlerId={user?.handlerId}
            />
            <div>
              <div className="muted">Claimed</div>
              <div className="mono">
                {req.claimedAmount
                  ? `${req.claimedAmount.currency} ${req.claimedAmount.amount}`
                  : "—"}
              </div>
            </div>
          </section>
          <section
            className="panel stack"
            style={{ animation: "pairSettle var(--motion-pair)" }}
          >
            <h2>Model recommendation</h2>
            <div className="row" style={{ justifyContent: "space-between" }}>
              <span>{rec.recommendedAction}</span>
              <span className="mono">
                conf {(rec.confidence ?? 0).toFixed(2)} · {rec.modelId}
              </span>
            </div>
            <div className="mono" style={{ fontSize: "1.4rem", color: "var(--color-teal)" }}>
              {rec.recommendedAmount
                ? `${rec.recommendedAmount.currency} ${rec.recommendedAmount.amount}`
                : "—"}
            </div>
            <div>
              <div className="muted" style={{ marginBottom: 8 }}>
                Drivers
              </div>
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {(rec.drivers ?? []).map((d) => (
                  <li key={d.factor}>
                    {d.factor}{" "}
                    <span className="muted">
                      ({d.direction} {(d.contribution ?? 0).toFixed(2)})
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="muted" style={{ marginBottom: 8 }}>
                Comparable outcomes
              </div>
              {(rec.comparableOutcomes ?? []).map((c) => (
                <div key={c.claimReference} className="mono">
                  {c.claimReference}: {c.settledAmount?.currency}{" "}
                  {c.settledAmount?.amount}
                </div>
              ))}
            </div>
            {!locked && (
              <div className="row">
                <button className="btn" disabled={busy} onClick={() => submit("agreed")}>
                  Agree &amp; execute
                </button>
                <button
                  className="btn secondary"
                  disabled={busy}
                  onClick={() => setShowOverride(true)}
                >
                  Override
                </button>
                <button
                  className="btn danger"
                  disabled={busy}
                  onClick={() => submit("referred_to_siu")}
                >
                  Refer SIU
                </button>
              </div>
            )}
            {showOverride && (
              <div className="stack" style={{ borderTop: "1px solid var(--color-steel-700)", paddingTop: 16 }}>
                <h3>Override reason</h3>
                <select
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  style={{
                    background: "var(--color-steel-950)",
                    color: "var(--color-ink)",
                    border: "1px solid var(--color-steel-700)",
                    padding: 10,
                  }}
                >
                  {[
                    "evidence_not_in_model",
                    "policy_wording_interpretation",
                    "claimant_circumstance",
                    "suspected_fraud",
                    "estimate_quality",
                    "reserve_adequacy",
                    "other",
                  ].map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
                <textarea
                  value={narrative}
                  onChange={(e) => setNarrative(e.target.value)}
                  placeholder="Narrative for retraining"
                  rows={3}
                  style={{
                    background: "var(--color-steel-950)",
                    color: "var(--color-ink)",
                    border: "1px solid var(--color-steel-700)",
                    padding: 10,
                  }}
                />
                <button
                  className="btn"
                  disabled={busy}
                  onClick={() => submit("overridden")}
                >
                  Capture override
                </button>
              </div>
            )}
          </section>
        </div>
      )}
    </Shell>
  );
}
