"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clearSession, getStoredUser, homeForRole } from "@/lib/api";
import type { UserRole } from "@coadjust/shared";
import { useEffect, useState } from "react";

const NAV: Record<UserRole, Array<{ href: string; label: string }>> = {
  handler: [
    { href: "/handler", label: "Home" },
    { href: "/handler/outcomes", label: "My outcomes" },
    { href: "/handler/path", label: "Redeployment path" },
  ],
  team_leader: [
    { href: "/leader", label: "Leader home" },
    { href: "/ops/guardrails", label: "Guardrails" },
    { href: "/workforce/capacity", label: "Capacity" },
  ],
  quality_conduct: [
    { href: "/ops/baselines", label: "Baselines" },
    { href: "/ops/guardrails", label: "Guardrails" },
    { href: "/ops/reproduce", label: "Reproduce" },
  ],
  workforce: [
    { href: "/workforce/readiness", label: "Readiness" },
    { href: "/workforce/redeploy", label: "Redeploy" },
    { href: "/workforce/capacity", label: "Capacity" },
  ],
  caio_governance: [
    { href: "/ops/register", label: "Register" },
    { href: "/ops/baselines", label: "Baselines" },
    { href: "/ops/reproduce", label: "Reproduce" },
  ],
  dpo: [
    { href: "/ops/reproduce", label: "Reproduce" },
    { href: "/ops/register", label: "Register" },
  ],
};

export function Shell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<ReturnType<typeof getStoredUser>>(null);

  useEffect(() => {
    const u = getStoredUser();
    if (!u) {
      router.replace("/login");
      return;
    }
    setUser(u);
  }, [router]);

  if (!user) {
    return (
      <div style={{ padding: 48 }} className="muted">
        Loading session…
      </div>
    );
  }

  const links = NAV[user.role] ?? NAV.handler;

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 28px",
          borderBottom: "1px solid var(--color-steel-700)",
          background: "rgba(10,18,24,0.92)",
          position: "sticky",
          top: 0,
          zIndex: 10,
          backdropFilter: "blur(8px)",
        }}
      >
        <div className="row" style={{ gap: 28 }}>
          <Link
            href={homeForRole(user.role)}
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "1.35rem",
              color: "var(--color-brand)",
              letterSpacing: "0.02em",
              textDecoration: "none",
            }}
          >
            Coadjust
          </Link>
          <nav className="row" style={{ gap: 16 }}>
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                style={{
                  color:
                    pathname === l.href || pathname.startsWith(l.href + "/")
                      ? "var(--color-ink)"
                      : "var(--color-slate-blue)",
                  textDecoration: "none",
                  borderBottom:
                    pathname === l.href
                      ? "2px solid var(--color-teal)"
                      : "2px solid transparent",
                  paddingBottom: 2,
                }}
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="row" style={{ gap: 16 }}>
          <span className="muted" style={{ fontSize: "0.9rem" }}>
            {user.name} · {user.role.replace("_", " ")}
          </span>
          <button
            className="btn secondary"
            type="button"
            onClick={() => {
              clearSession();
              router.replace("/login");
            }}
          >
            Sign out
          </button>
        </div>
      </header>
      <main style={{ padding: "28px 32px 64px", maxWidth: 1200, width: "100%", margin: "0 auto" }}>
        {children}
      </main>
    </div>
  );
}
