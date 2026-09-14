"use client";

import { useEffect, useState } from "react";
import type { DecisionRequest } from "@coadjust/shared";
import { Shell } from "@/components/Shell";
import { listData } from "@/lib/api";

export default function OutcomesPage() {
  const [items, setItems] = useState<DecisionRequest[]>([]);

  useEffect(() => {
    listData<DecisionRequest>("/v1/decision-requests?status=reconciled").then(setItems);
  }, []);

  return (
    <Shell>
      <h1>My paired outcomes</h1>
      <p className="muted" style={{ marginBottom: 24 }}>
        Calibrate scepticism against settled outcomes — no peer league tables.
      </p>
      <section className="panel">
        {items.length === 0 ? (
          <p className="muted">Awaiting ground truth.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Claim</th>
                <th>Decision</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map((i) => (
                <tr key={i.id}>
                  <td>{i.claimReference}</td>
                  <td className="mono">{i.id}</td>
                  <td>{i.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </Shell>
  );
}
