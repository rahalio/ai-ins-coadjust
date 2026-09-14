"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { GovernanceEntry } from "@coadjust/shared";
import { Shell } from "@/components/Shell";
import { PolicyVersionChip } from "@/components/DomainChrome";
import { listData } from "@/lib/api";

export default function RegisterPage() {
  const [items, setItems] = useState<GovernanceEntry[]>([]);

  useEffect(() => {
    listData<GovernanceEntry>("/v1/governance/register").then(setItems);
  }, []);

  return (
    <Shell>
      <h1>Governance register</h1>
      <p className="muted" style={{ marginBottom: 24 }}>
        Decision types, modes, evidence, approvals, and policy versions.
      </p>
      <section className="panel">
        <table className="table">
          <thead>
            <tr>
              <th>Decision type</th>
              <th>Mode</th>
              <th>Premium</th>
              <th>Approved</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {items.map((e) => (
              <tr key={e.decisionTypeId}>
                <td>{e.decisionTypeName}</td>
                <td className="mono">{e.allocationMode}</td>
                <td className="mono">
                  {e.combinationPremium != null
                    ? `+${(e.combinationPremium * 100).toFixed(1)} pts`
                    : "—"}
                </td>
                <td>
                  <div>{e.lastApprovedBy ?? "—"}</div>
                  {e.activePolicyVersion != null && (
                    <PolicyVersionChip
                      policyId="active"
                      version={e.activePolicyVersion}
                    />
                  )}
                </td>
                <td>
                  <Link href={`/ops/policies/${e.decisionTypeId}`}>Policies</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </Shell>
  );
}
