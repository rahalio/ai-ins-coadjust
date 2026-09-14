"use client";

import { useEffect, useState } from "react";
import type { RedeploymentAssignment } from "@coadjust/shared";
import { Shell } from "@/components/Shell";
import { RedeployGate } from "@/components/DomainChrome";
import { getStoredUser, listData } from "@/lib/api";

export default function HandlerPathPage() {
  const [item, setItem] = useState<RedeploymentAssignment | null>(null);

  useEffect(() => {
    const user = getStoredUser();
    listData<RedeploymentAssignment>("/v1/workforce/redeployments").then((rows) => {
      setItem(rows.find((r) => r.handlerId === user?.handlerId) ?? rows[0] ?? null);
    });
  }, []);

  return (
    <Shell>
      <h1>Redeployment path</h1>
      <p className="muted" style={{ marginBottom: 24 }}>
        Destination role, skills gap, and funded start — plan before volume drops.
      </p>
      {!item ? (
        <p className="muted">No redeployment assigned.</p>
      ) : (
        <section className="panel stack">
          <RedeployGate
            ok={Boolean(item.destinationRoleProfileId && item.fundedStartDate)}
            detail={`Status ${item.status}`}
          />
          <div className="grid-2">
            <div>
              <div className="muted">Released from</div>
              <div className="mono">{item.releasedFromDecisionTypeId}</div>
            </div>
            <div>
              <div className="muted">Destination</div>
              <div>{item.destinationQueue}</div>
              <div className="mono muted">{item.destinationRoleProfileId}</div>
            </div>
            <div>
              <div className="muted">Funded start</div>
              <div className="mono">{item.fundedStartDate}</div>
            </div>
            <div>
              <div className="muted">Reskilling cost</div>
              <div className="mono">
                {item.reskillingCost
                  ? `${item.reskillingCost.currency} ${item.reskillingCost.amount}`
                  : "—"}
              </div>
            </div>
          </div>
        </section>
      )}
    </Shell>
  );
}
