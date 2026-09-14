"use client";

import { useEffect, useState } from "react";
import type { RedeploymentAssignment } from "@coadjust/shared";
import { Shell } from "@/components/Shell";
import { RedeployGate } from "@/components/DomainChrome";
import { listData } from "@/lib/api";

export default function RedeployPage() {
  const [items, setItems] = useState<RedeploymentAssignment[]>([]);

  useEffect(() => {
    listData<RedeploymentAssignment>("/v1/workforce/redeployments").then(setItems);
  }, []);

  const blocked = items.filter(
    (i) => !i.destinationRoleProfileId || !i.fundedStartDate
  );

  return (
    <Shell>
      <h1>Redeployment ledger</h1>
      <p className="muted" style={{ marginBottom: 24 }}>
        Every automation-released handler needs destination, funded start, tracked outcome.
      </p>
      <RedeployGate
        ok={blocked.length === 0}
        detail={
          blocked.length === 0
            ? "All released capacity has named destinations."
            : `${blocked.length} assignment(s) missing destination or funded start — blocks go-live.`
        }
      />
      <section className="panel" style={{ marginTop: 20 }}>
        <table className="table">
          <thead>
            <tr>
              <th>Handler</th>
              <th>From → To</th>
              <th>Start</th>
              <th>Status</th>
              <th>Hours</th>
            </tr>
          </thead>
          <tbody>
            {items.map((i) => (
              <tr key={i.id}>
                <td className="mono">{i.handlerId}</td>
                <td>
                  <span className="mono">{i.releasedFromDecisionTypeId}</span> →{" "}
                  {i.destinationQueue}
                </td>
                <td className="mono">{i.fundedStartDate ?? "—"}</td>
                <td>{i.status}</td>
                <td className="mono">{i.releasedCapacityHours}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </Shell>
  );
}
