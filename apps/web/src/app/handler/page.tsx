"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { DecisionRequest, RedeploymentAssignment } from "@coadjust/shared";
import { Shell } from "@/components/Shell";
import { RedeployGate } from "@/components/DomainChrome";
import { getStoredUser, listData } from "@/lib/api";

export default function HandlerHomePage() {
  const [queue, setQueue] = useState<DecisionRequest[]>([]);
  const [path, setPath] = useState<RedeploymentAssignment | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const user = getStoredUser();
    Promise.all([
      listData<DecisionRequest>("/v1/decision-requests?status=awaiting_human"),
      listData<RedeploymentAssignment>("/v1/workforce/redeployments"),
    ])
      .then(([reqs, redeploys]) => {
        setQueue(reqs);
        const mine = redeploys.find((r) => r.handlerId === user?.handlerId) ?? null;
        setPath(mine);
      })
      .catch((e) => setError(e.message));
  }, []);

  return (
    <Shell>
      <h1>Handler home</h1>
      <p className="muted" style={{ marginBottom: 24 }}>
        Today&apos;s paired queue, service timers, and redeployment status.
      </p>
      {error && <p style={{ color: "var(--color-coral)" }}>{error}</p>}
      <div className="grid-2">
        <section className="panel">
          <h2>Paired review queue</h2>
          {queue.length === 0 ? (
            <p className="muted">No paired work — check human-only assignments.</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Claim</th>
                  <th>Due</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {queue.map((q) => (
                  <tr key={q.id}>
                    <td>
                      <div>{q.claimReference}</div>
                      <div className="mono muted">{q.id}</div>
                    </td>
                    <td className="mono">
                      {q.serviceDueAt
                        ? new Date(q.serviceDueAt).toLocaleDateString()
                        : "—"}
                    </td>
                    <td>
                      <Link className="btn" href={`/handler/queue/${q.id}`}>
                        Open
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
        <section className="panel stack">
          <h2>Redeployment path</h2>
          {path ? (
            <>
              <RedeployGate
                ok={Boolean(path.destinationRoleProfileId && path.fundedStartDate)}
                detail={`Destination ${path.destinationQueue ?? path.destinationRoleProfileId} · funded ${path.fundedStartDate}`}
              />
              <Link href="/handler/path">View path details</Link>
            </>
          ) : (
            <p className="muted">No capacity release assigned to you.</p>
          )}
          <Link className="btn secondary" href="/handler/outcomes">
            My paired outcomes
          </Link>
        </section>
      </div>
    </Shell>
  );
}
