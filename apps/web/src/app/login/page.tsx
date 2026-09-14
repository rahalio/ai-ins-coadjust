"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { homeForRole, login } from "@/lib/api";

const DEMO_USERS = [
  { email: "ava.handler@coadjust.demo", role: "Handler" },
  { email: "leo.leader@coadjust.demo", role: "Team leader" },
  { email: "nina.quality@coadjust.demo", role: "Quality / conduct" },
  { email: "sam.workforce@coadjust.demo", role: "Workforce" },
  { email: "jordan.caio@coadjust.demo", role: "CAIO / governance" },
  { email: "priya.dpo@coadjust.demo", role: "DPO" },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState(DEMO_USERS[0].email);
  const [password, setPassword] = useState("coadjust");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data = await login(email, password);
      router.replace(homeForRole(data.user.role));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 24,
        background:
          "radial-gradient(ellipse at 30% 20%, rgba(43,184,163,0.12), transparent 50%), var(--color-steel-950)",
      }}
    >
      <div style={{ width: "100%", maxWidth: 440 }}>
        <div
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "2.8rem",
            color: "var(--color-brand)",
            marginBottom: 8,
          }}
        >
          Coadjust
        </div>
        <h1 style={{ fontSize: "1.8rem", marginBottom: 8 }}>Pair for accuracy</h1>
        <p className="muted" style={{ marginBottom: 28, lineHeight: 1.5 }}>
          The machine alone is worse than the expert. Together they beat both — book the
          combination premium, not the automation rate.
        </p>
        <form className="panel stack" onSubmit={onSubmit}>
          <label className="stack" style={{ gap: 6 }}>
            <span className="muted">Email</span>
            <select
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                background: "var(--color-steel-950)",
                color: "var(--color-ink)",
                border: "1px solid var(--color-steel-700)",
                padding: 10,
                borderRadius: 4,
              }}
            >
              {DEMO_USERS.map((u) => (
                <option key={u.email} value={u.email}>
                  {u.role} — {u.email}
                </option>
              ))}
            </select>
          </label>
          <label className="stack" style={{ gap: 6 }}>
            <span className="muted">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                background: "var(--color-steel-950)",
                color: "var(--color-ink)",
                border: "1px solid var(--color-steel-700)",
                padding: 10,
                borderRadius: 4,
              }}
            />
          </label>
          {error && (
            <div style={{ color: "var(--color-coral)" }} role="alert">
              {error}
            </div>
          )}
          <button className="btn" type="submit" disabled={loading}>
            {loading ? "Signing in…" : "Enter console"}
          </button>
        </form>
      </div>
    </div>
  );
}
