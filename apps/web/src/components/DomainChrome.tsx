export function AccountableNameplate({
  name,
  handlerId,
}: {
  name: string;
  handlerId?: string;
}) {
  return (
    <div
      style={{
        border: "1px solid var(--color-teal-dim)",
        borderLeft: "3px solid var(--color-teal)",
        padding: "12px 14px",
        borderRadius: "var(--radius-sm)",
        background: "rgba(43,184,163,0.06)",
      }}
    >
      <div className="muted" style={{ fontSize: "0.75rem", letterSpacing: "0.06em" }}>
        ACCOUNTABLE HUMAN
      </div>
      <div style={{ fontFamily: "var(--font-display)", fontSize: "1.15rem" }}>{name}</div>
      {handlerId && <div className="mono muted">{handlerId}</div>}
    </div>
  );
}

export function FailClosedLock({ reason }: { reason: string }) {
  return (
    <div
      role="alert"
      style={{
        border: "1px solid var(--color-coral)",
        background: "rgba(217,75,75,0.12)",
        padding: "14px 16px",
        borderRadius: "var(--radius-sm)",
        animation: "lockSnap var(--motion-lock)",
      }}
    >
      <strong>Fail-closed lock</strong>
      <p style={{ margin: "6px 0 0" }}>{reason}</p>
    </div>
  );
}

export function SuspensionBanner({ decisionTypeId, reason }: { decisionTypeId: string; reason?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        border: "1px solid var(--color-coral)",
        background: "rgba(217,75,75,0.15)",
        padding: "12px 16px",
        borderRadius: "var(--radius-sm)",
        animation: "suspendPulse var(--motion-suspend) infinite",
        marginBottom: 16,
      }}
    >
      <strong>Automation suspended</strong> on{" "}
      <span className="mono">{decisionTypeId}</span>
      {reason ? ` — ${reason}` : ""}. Resume requires governance approval.
    </div>
  );
}

export function PolicyVersionChip({
  policyId,
  version,
}: {
  policyId?: string;
  version?: number;
}) {
  if (!policyId) return null;
  return (
    <span
      className="mono"
      style={{
        display: "inline-block",
        border: "1px solid var(--color-steel-700)",
        padding: "4px 8px",
        borderRadius: 4,
        color: "var(--color-slate-blue)",
        fontSize: "0.85rem",
      }}
    >
      {policyId}
      {version != null ? ` · v${version}` : ""}
    </span>
  );
}

export function DeferenceAlert({
  divergence,
  interpretation,
}: {
  divergence?: number;
  interpretation?: string;
}) {
  const warn = (divergence ?? 0) > 0.05;
  return (
    <div
      style={{
        border: `1px solid ${warn ? "var(--color-amber)" : "var(--color-steel-700)"}`,
        padding: "14px 16px",
        borderRadius: "var(--radius-sm)",
        background: warn ? "rgba(212,160,23,0.1)" : "var(--color-steel-900)",
      }}
    >
      <div style={{ fontFamily: "var(--font-display)" }}>Deference divergence</div>
      <p className="muted" style={{ margin: "6px 0 0" }}>
        {interpretation?.replace("_", " ") ?? "unknown"} · Δ{" "}
        {((divergence ?? 0) * 100).toFixed(1)} pts vs demonstrated model accuracy
      </p>
    </div>
  );
}

export function RedeployGate({ ok, detail }: { ok: boolean; detail: string }) {
  return (
    <div
      style={{
        border: `1px solid ${ok ? "var(--color-teal-dim)" : "var(--color-coral)"}`,
        padding: "12px 14px",
        borderRadius: "var(--radius-sm)",
      }}
    >
      <strong>{ok ? "Redeploy gate clear" : "Redeploy gate blocking"}</strong>
      <p className="muted" style={{ margin: "6px 0 0" }}>
        {detail}
      </p>
    </div>
  );
}
