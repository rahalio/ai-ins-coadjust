import { nanoid } from "nanoid";
import type {
  Allocation,
  AllocationPolicy,
  AllocationPolicyCreate,
  CombinationBaseline,
  ConductGuardrail,
  DecisionRequest,
  DecisionRequestCreate,
  DecisionType,
  DecisionTypeCreate,
  DeferenceReport,
  GovernanceApprovalCreate,
  GovernanceEntry,
  HumanJudgement,
  HumanJudgementCreate,
  Outcome,
  OutcomeCreate,
  PolicyReproduction,
  QueueCapacityPlan,
  ReadinessAssessment,
  ReadinessAssessmentCreate,
  Recommendation,
  RedeploymentAssignment,
  RedeploymentAssignmentCreate,
  ExclusionFlag,
} from "@coadjust/shared";
import { FAIL_CLOSED_FLAGS } from "@coadjust/shared";
import { keys } from "../db/keys";
import {
  decodeCursor,
  encodeCursor,
  getItem,
  putItem,
  queryGsi,
  queryPk,
  scanEntity,
  updateItem,
} from "../db/repo";
import { conflict, notFound, unprocessable } from "../http/errors";

function stripKeys<T extends Record<string, unknown>>(item: T): Omit<T, "pk" | "sk" | "gsi1pk" | "gsi1sk" | "gsi2pk" | "gsi2sk" | "gsi3pk" | "gsi3sk" | "entityType" | "passwordHash"> {
  const {
    pk: _pk,
    sk: _sk,
    gsi1pk: _g1,
    gsi1sk: _g1s,
    gsi2pk: _g2,
    gsi2sk: _g2s,
    gsi3pk: _g3,
    gsi3sk: _g3s,
    entityType: _e,
    passwordHash: _p,
    ...rest
  } = item;
  return rest as Omit<T, "pk" | "sk" | "gsi1pk" | "gsi1sk" | "gsi2pk" | "gsi2sk" | "gsi3pk" | "gsi3sk" | "entityType" | "passwordHash">;
}

function now() {
  return new Date().toISOString();
}

function hasFailClosed(flags: ExclusionFlag[] = []) {
  return flags.some((f) => FAIL_CLOSED_FLAGS.includes(f.flag));
}

export async function listDecisionTypes(query: {
  allocationMode?: string;
  lineOfBusiness?: string;
  cursor?: string;
  limit?: number;
}) {
  const { items, lastKey } = await queryGsi("GSI1", "gsi1pk", "DTYPE", {
    limit: query.limit ?? 50,
    exclusiveStartKey: decodeCursor(query.cursor),
  });
  let list = items.map((i) => stripKeys(i) as unknown as DecisionType);
  if (query.allocationMode) {
    list = list.filter((d) => d.allocationMode === query.allocationMode);
  }
  if (query.lineOfBusiness) {
    list = list.filter((d) => d.lineOfBusiness === query.lineOfBusiness);
  }
  return { items: list, nextCursor: encodeCursor(lastKey) };
}

export async function getDecisionType(id: string) {
  const item = await getItem(`DTYPE#${id}`, "META");
  if (!item) throw notFound(`Decision type ${id} not found`);
  return stripKeys(item) as unknown as DecisionType;
}

export async function registerDecisionType(body: DecisionTypeCreate) {
  const id = `dt_${nanoid(10)}`;
  const dtype: DecisionType & Record<string, unknown> = {
    ...keys.decisionType(id),
    gsi1pk: "DTYPE",
    gsi1sk: `DTYPE#${id}`,
    entityType: "DTYPE",
    id,
    name: body.name,
    lineOfBusiness: body.lineOfBusiness,
    decisionStage: body.decisionStage,
    allocationMode: "human_only",
    humanMandatory: body.humanMandatory ?? false,
    authorityLimit: body.authorityLimit,
  };
  await putItem(dtype);
  await putItem({
    ...keys.governance(id),
    gsi1pk: "GOV",
    gsi1sk: `GOV#${id}`,
    entityType: "GOV",
    decisionTypeId: id,
    decisionTypeName: body.name,
    allocationMode: "human_only",
    openGuardrailBreaches: 0,
  });
  return stripKeys(dtype) as unknown as DecisionType;
}

export async function listDecisionRequests(query: {
  claimReference?: string;
  status?: string;
  cursor?: string;
  limit?: number;
}) {
  if (query.claimReference) {
    const { items } = await queryGsi("GSI2", "gsi2pk", `CLAIM#${query.claimReference}`);
    return {
      items: items.map((i) => stripKeys(i) as unknown as DecisionRequest),
      nextCursor: undefined as string | undefined,
    };
  }
  const statusKey = query.status ? `STATUS#${query.status}` : "STATUS#ALL";
  const { items, lastKey } = await queryGsi("GSI1", "gsi1pk", statusKey, {
    limit: query.limit ?? 50,
    exclusiveStartKey: decodeCursor(query.cursor),
  });
  // Also try ALL if listing without status — scan STATUS indexes via multiple or use ALL
  let list = items.map((i) => stripKeys(i) as unknown as DecisionRequest);
  if (!query.status) {
    const allStatuses = [
      "raised",
      "allocated",
      "awaiting_human",
      "decided",
      "executed",
      "reconciled",
    ];
    const merged: DecisionRequest[] = [];
    for (const s of allStatuses) {
      const res = await queryGsi("GSI1", "gsi1pk", `STATUS#${s}`, {
        limit: query.limit ?? 50,
      });
      merged.push(...res.items.map((i) => stripKeys(i) as unknown as DecisionRequest));
    }
    list = merged;
  }
  return { items: list, nextCursor: encodeCursor(lastKey) };
}

export async function raiseDecisionRequest(body: DecisionRequestCreate) {
  const existing = await queryGsi("GSI2", "gsi2pk", `CLAIM#${body.claimReference}`, {
    skBeginsWith: "DREQ#",
    skName: "gsi2sk",
  });
  const dup = existing.items.find(
    (i) => i.claimEvent === body.claimEvent && i.decisionTypeId === body.decisionTypeId
  );
  if (dup) throw conflict("Decision request already exists for this claim event");

  await getDecisionType(body.decisionTypeId);

  const id = `dr_${nanoid(10)}`;
  const raisedAt = now();
  const flags = (body.exclusionFlags ?? []).map((f) => ({
    ...f,
    setAt: f.setAt ?? raisedAt,
  }));
  const item = {
    ...keys.decisionRequest(id),
    gsi1pk: "STATUS#raised",
    gsi1sk: raisedAt,
    gsi2pk: `CLAIM#${body.claimReference}`,
    gsi2sk: `DREQ#${id}`,
    gsi3pk: `HANDLERQUEUE#unassigned`,
    gsi3sk: raisedAt,
    entityType: "DREQ",
    id,
    decisionTypeId: body.decisionTypeId,
    claimReference: body.claimReference,
    claimEvent: body.claimEvent,
    status: "raised",
    claimedAmount: body.claimedAmount,
    exclusionFlags: flags,
    raisedAt,
    serviceDueAt: body.serviceDueAt,
  };
  await putItem(item);
  return stripKeys(item) as unknown as DecisionRequest;
}

export async function allocateDecisionRequest(decisionRequestId: string) {
  const raw = await getItem(`DREQ#${decisionRequestId}`, "META");
  if (!raw) throw notFound(`Decision request ${decisionRequestId} not found`);
  const dreq = stripKeys(raw) as unknown as DecisionRequest;
  const dtype = await getDecisionType(dreq.decisionTypeId);

  if (dtype.allocationMode === "suspended") {
    throw unprocessable("Decision type automation is suspended (BR-8)");
  }

  let mode: Allocation["mode"] = "human_only";
  let rationale = "Default human-only";
  let policyId = dtype.activePolicyId ?? "policy_none";
  let policyVersion = 0;

  if (hasFailClosed(dreq.exclusionFlags)) {
    mode = "human_only";
    rationale = "Fail-closed: vulnerable/BI/fatality exclusion (BR-4)";
  } else if (dtype.activePolicyId) {
    const policies = await queryPk(`POLICY#${dtype.activePolicyId}`, "VER#");
    const active = policies
      .map((p) => stripKeys(p) as unknown as AllocationPolicy)
      .find((p) => p.state === "active");
    if (active) {
      policyId = active.id;
      policyVersion = active.version;
      const excluded = new Set(active.excludedFlags ?? []);
      const hit = (dreq.exclusionFlags ?? []).some((f) => excluded.has(f.flag));
      if (hit) {
        mode = "human_only";
        rationale = "Policy excluded flag present";
      } else if (active.targetMode === "model_only" && dtype.humanMandatory) {
        mode = "paired";
        rationale = "Human mandatory decision type; cannot model-only";
      } else {
        mode = active.targetMode;
        rationale = `Active policy ${active.id} v${active.version} targetMode=${active.targetMode}`;
      }
    }
  } else if (dtype.allocationMode === "paired" || dtype.allocationMode === "model_only") {
    mode = dtype.allocationMode;
    rationale = `Decision type mode ${dtype.allocationMode}`;
  }

  const allocatedAt = now();
  const allocation: Allocation & Record<string, unknown> = {
    ...keys.allocation(decisionRequestId, allocatedAt),
    entityType: "ALLOC",
    decisionRequestId,
    mode,
    policyId,
    policyVersion,
    rationale,
    assignedQueue:
      mode === "paired" ? "paired_review" : mode === "human_only" ? "human_only" : "auto_execute",
    accountableHandlerId: mode === "model_only" ? undefined : "handler_ava",
    allocatedAt,
  };
  await putItem(allocation);

  const newStatus = mode === "paired" ? "awaiting_human" : mode === "model_only" ? "executed" : "allocated";
  await updateItem(`DREQ#${decisionRequestId}`, "META", {
    status: newStatus,
    gsi1pk: `STATUS#${newStatus}`,
    gsi1sk: allocatedAt,
    gsi3pk: mode === "paired" ? "HANDLERQUEUE#handler_ava" : "HANDLERQUEUE#none",
    gsi3sk: allocatedAt,
    lastAllocationMode: mode,
    lastPolicyId: policyId,
    lastPolicyVersion: policyVersion,
  });

  if (mode === "paired" || mode === "model_only") {
    await ensureRecommendation(decisionRequestId, dreq);
  }

  return stripKeys(allocation) as unknown as Allocation;
}

async function ensureRecommendation(decisionRequestId: string, dreq: DecisionRequest) {
  const existing = await getItem(`DREQ#${decisionRequestId}`, "REC");
  if (existing) return stripKeys(existing) as unknown as Recommendation;
  const rec: Recommendation & Record<string, unknown> = {
    ...keys.recommendation(decisionRequestId),
    entityType: "REC",
    decisionRequestId,
    modelId: "motor-glass-v3",
    modelVersion: "3.2.1",
    recommendedAction: "approve_at_estimate",
    recommendedAmount: dreq.claimedAmount ?? { amount: 420, currency: "EUR" },
    confidence: 0.87,
    drivers: [
      { factor: "photo_damage_consistency", direction: "increases", contribution: 0.41 },
      { factor: "parts_price_index", direction: "increases", contribution: 0.22 },
      { factor: "prior_claim_frequency", direction: "decreases", contribution: 0.11 },
    ],
    comparableOutcomes: [
      {
        claimReference: "CLM-DEMO-001",
        settledAmount: { amount: 410, currency: "EUR" },
      },
    ],
    issuedAt: now(),
  };
  await putItem(rec);
  return stripKeys(rec) as unknown as Recommendation;
}

export async function getRecommendation(decisionRequestId: string) {
  const raw = await getItem(`DREQ#${decisionRequestId}`, "META");
  if (!raw) throw notFound(`Decision request ${decisionRequestId} not found`);
  const existing = await getItem(`DREQ#${decisionRequestId}`, "REC");
  if (existing) return stripKeys(existing) as unknown as Recommendation;
  return ensureRecommendation(decisionRequestId, stripKeys(raw) as unknown as DecisionRequest);
}

export async function recordJudgement(
  decisionRequestId: string,
  body: HumanJudgementCreate
) {
  const raw = await getItem(`DREQ#${decisionRequestId}`, "META");
  if (!raw) throw notFound(`Decision request ${decisionRequestId} not found`);
  const dreq = stripKeys(raw) as unknown as DecisionRequest;

  if (body.disposition === "overridden" && !body.overrideReason) {
    throw unprocessable("overrideReason required when disposition is overridden (BR-10)");
  }

  const adverse =
    body.disposition === "declined_cover" ||
    body.disposition === "referred_to_siu" ||
    (body.decidedAmount &&
      dreq.claimedAmount &&
      body.decidedAmount.amount < dreq.claimedAmount.amount);

  if (adverse && !body.handlerId) {
    throw unprocessable("Named accountable human required for adverse decisions (BR-3)");
  }

  if (hasFailClosed(dreq.exclusionFlags) && body.disposition === "agreed") {
    // still ok — human agreed in human path
  }

  const decidedAt = now();
  const judgement: HumanJudgement & Record<string, unknown> = {
    ...keys.judgement(decisionRequestId),
    entityType: "JUDGE",
    decisionRequestId,
    handlerId: body.handlerId,
    disposition: body.disposition,
    decidedAmount: body.decidedAmount,
    overrideReason: body.overrideReason,
    overrideNarrative: body.overrideNarrative,
    timeOnDecisionSeconds: body.timeOnDecisionSeconds,
    decidedAt,
  };
  await putItem(judgement);
  await updateItem(`DREQ#${decisionRequestId}`, "META", {
    status: "executed",
    gsi1pk: "STATUS#executed",
    gsi1sk: decidedAt,
    accountableHandlerId: body.handlerId,
  });
  return stripKeys(judgement) as unknown as HumanJudgement;
}

export async function listPolicies(query: {
  decisionTypeId?: string;
  state?: string;
  cursor?: string;
  limit?: number;
}) {
  const { items, lastKey } = await queryGsi("GSI1", "gsi1pk", "POLICY", {
    limit: query.limit ?? 50,
    exclusiveStartKey: decodeCursor(query.cursor),
  });
  let list = items.map((i) => stripKeys(i) as unknown as AllocationPolicy);
  if (query.decisionTypeId) {
    list = list.filter((p) => p.decisionTypeId === query.decisionTypeId);
  }
  if (query.state) {
    list = list.filter((p) => p.state === query.state);
  }
  return { items: list, nextCursor: encodeCursor(lastKey) };
}

export async function createPolicy(body: AllocationPolicyCreate) {
  const baselineRaw = await scanEntity("BASELINE");
  const baseline = baselineRaw
    .map((b) => stripKeys(b) as unknown as CombinationBaseline)
    .find((b) => b.id === body.supportingBaselineId);
  if (!baseline) throw unprocessable("supportingBaselineId not found (BR-1)");

  if (body.targetMode === "model_only") {
    const model = baseline.modelOnlyAccuracy ?? 0;
    const paired = baseline.pairedAccuracy ?? 0;
    if (model < paired) {
      throw unprocessable(
        "Model-only blocked: modelOnlyAccuracy must be >= pairedAccuracy (BR-1)"
      );
    }
  }

  // Redeploy gate when moving toward automation
  if (body.targetMode === "model_only" || body.targetMode === "paired") {
    const redeploys = await scanEntity("REDEPLOY");
    const open = redeploys
      .map((r) => stripKeys(r) as unknown as RedeploymentAssignment)
      .filter(
        (r) =>
          r.releasedFromDecisionTypeId === body.decisionTypeId &&
          (r.status === "proposed" || !r.fundedStartDate || !r.destinationRoleProfileId)
      );
    const capacityReleasing = body.targetMode === "model_only";
    if (capacityReleasing) {
      const funded = redeploys
        .map((r) => stripKeys(r) as unknown as RedeploymentAssignment)
        .filter(
          (r) =>
            r.releasedFromDecisionTypeId === body.decisionTypeId &&
            r.fundedStartDate &&
            r.destinationRoleProfileId &&
            (r.status === "funded" || r.status === "in_training" || r.status === "placed")
        );
      if (funded.length === 0) {
        throw unprocessable(
          "Redeploy gate: named destination + funded start required before automation go-live (BR-6)"
        );
      }
    }
    void open;
  }

  const id = `pol_${nanoid(8)}`;
  const version = 1;
  const policy: AllocationPolicy & Record<string, unknown> = {
    ...keys.policy(id, version),
    gsi1pk: "POLICY",
    gsi1sk: `POLICY#${id}#${version}`,
    gsi3pk: `DTYPEPOL#${body.decisionTypeId}`,
    gsi3sk: `VER#${version}`,
    entityType: "POLICY",
    id,
    decisionTypeId: body.decisionTypeId,
    version,
    state: "draft",
    targetMode: body.targetMode,
    minimumCombinedAccuracy: body.minimumCombinedAccuracy,
    minimumConfidence: body.minimumConfidence,
    excludedFlags: body.excludedFlags ?? [
      "vulnerable_customer",
      "bodily_injury",
      "fatality",
    ],
    supportingBaselineId: body.supportingBaselineId,
  };
  await putItem(policy);
  return stripKeys(policy) as unknown as AllocationPolicy;
}

export async function approvePolicy(policyId: string, body: GovernanceApprovalCreate) {
  const { items } = await queryGsi("GSI1", "gsi1pk", "POLICY", {
    skBeginsWith: `POLICY#${policyId}`,
    skName: "gsi1sk",
  });
  // Also query by pk
  const versions = await queryPk(`POLICY#${policyId}`, "VER#");
  const latest = versions
    .map((p) => stripKeys(p) as unknown as AllocationPolicy)
    .sort((a, b) => b.version - a.version)[0];
  if (!latest) throw notFound(`Policy ${policyId} not found`);

  if (latest.targetMode === "model_only") {
    const baselines = await scanEntity("BASELINE");
    const baseline = baselines
      .map((b) => stripKeys(b) as unknown as CombinationBaseline)
      .find((b) => b.id === latest.supportingBaselineId);
    if (!baseline || (baseline.modelOnlyAccuracy ?? 0) < (baseline.pairedAccuracy ?? 0)) {
      throw unprocessable("Cannot approve model-only: baseline gate failed (BR-1)");
    }
  }

  const effectiveFrom = now();
  await updateItem(`POLICY#${policyId}`, `VER#${String(latest.version).padStart(6, "0")}`, {
    state: "active",
    approvedBy: body.approverId,
    effectiveFrom,
    approvalForum: body.forum,
    approvalRationale: body.rationale,
    approvalConditions: body.conditions,
  });

  // supersede other active for same decision type
  const allPolicies = await scanEntity("POLICY");
  for (const p of allPolicies) {
    const pol = stripKeys(p) as unknown as AllocationPolicy & { pk?: string; sk?: string };
    if (
      pol.decisionTypeId === latest.decisionTypeId &&
      pol.id !== policyId &&
      pol.state === "active"
    ) {
      await updateItem(String(p.pk), String(p.sk), { state: "superseded" });
    }
  }

  await updateItem(`DTYPE#${latest.decisionTypeId}`, "META", {
    allocationMode: latest.targetMode,
    activePolicyId: policyId,
  });
  await updateItem(`GOV#${latest.decisionTypeId}`, "ENTRY", {
    allocationMode: latest.targetMode,
    activePolicyVersion: latest.version,
    lastApprovedBy: body.approverId,
    lastApprovedAt: effectiveFrom,
  });

  const updated = await getItem(
    `POLICY#${policyId}`,
    `VER#${String(latest.version).padStart(6, "0")}`
  );
  void items;
  return stripKeys(updated!) as unknown as AllocationPolicy;
}

export async function createOutcome(body: OutcomeCreate) {
  const raw = await getItem(`DREQ#${body.decisionRequestId}`, "META");
  if (!raw) throw notFound(`Decision request ${body.decisionRequestId} not found`);
  const outcome: Outcome & Record<string, unknown> = {
    ...keys.outcome(body.decisionRequestId),
    entityType: "OUTCOME",
    decisionRequestId: body.decisionRequestId,
    outcomeType: body.outcomeType,
    settledAmount: body.settledAmount,
    leakageAmount: body.leakageAmount,
    reserveVariance: body.reserveVariance,
    observedAt: body.observedAt,
  };
  await putItem(outcome);
  await updateItem(`DREQ#${body.decisionRequestId}`, "META", {
    status: "reconciled",
    gsi1pk: "STATUS#reconciled",
    gsi1sk: body.observedAt,
  });
  return stripKeys(outcome) as unknown as Outcome;
}

export async function listBaselines(query: {
  decisionTypeId?: string;
  period?: string;
  cursor?: string;
}) {
  if (query.decisionTypeId) {
    const items = await queryPk(`BASELINE#${query.decisionTypeId}`, "PERIOD#");
    let list = items.map((i) => stripKeys(i) as unknown as CombinationBaseline);
    if (query.period) list = list.filter((b) => b.period === query.period);
    return { items: list, nextCursor: undefined as string | undefined };
  }
  const items = await scanEntity("BASELINE");
  let list = items.map((i) => stripKeys(i) as unknown as CombinationBaseline);
  if (query.period) list = list.filter((b) => b.period === query.period);
  return { items: list, nextCursor: undefined as string | undefined };
}

export async function deferenceReport(query: {
  decisionTypeId?: string;
  period?: string;
  purpose?: string;
}): Promise<DeferenceReport> {
  // Seeded / computed demo report
  const acceptanceRate = 0.94;
  const demonstratedModelAccuracy = 0.88;
  const divergence = acceptanceRate - demonstratedModelAccuracy;
  return {
    decisionTypeId: query.decisionTypeId,
    period: query.period ?? "2026Q1",
    acceptanceRate,
    demonstratedModelAccuracy,
    divergence,
    overrideUpheldRate: 0.62,
    interpretation: divergence > 0.05 ? "over_deference" : "calibrated",
  };
}

export async function listGuardrails(query: {
  decisionTypeId?: string;
  status?: string;
}) {
  let items: Record<string, unknown>[] = [];
  if (query.decisionTypeId) {
    items = await queryPk(`GUARD#${query.decisionTypeId}`, "EVENT#");
  } else {
    items = await scanEntity("GUARD");
  }
  let list = items.map((i) => stripKeys(i) as unknown as ConductGuardrail);
  if (query.status) list = list.filter((g) => g.status === query.status);
  return { items: list, nextCursor: undefined as string | undefined };
}

export async function suspendDecisionType(
  decisionTypeId: string,
  body: { reason: string; guardrailId?: string; resumeRequiresApproval?: boolean }
) {
  await getDecisionType(decisionTypeId);
  const suspendedAt = now();
  await updateItem(`DTYPE#${decisionTypeId}`, "META", {
    allocationMode: "suspended",
    suspensionReason: body.reason,
    suspendedAt,
  });
  if (body.guardrailId) {
    const guards = await queryPk(`GUARD#${decisionTypeId}`, "EVENT#");
    const g = guards.find((x) => x.id === body.guardrailId);
    if (g) {
      await updateItem(String(g.pk), String(g.sk), {
        status: "suspended",
        suspendedAt,
      });
    }
  }
  await updateItem(`GOV#${decisionTypeId}`, "ENTRY", {
    allocationMode: "suspended",
    openGuardrailBreaches: 1,
  });
  return getDecisionType(decisionTypeId);
}

export async function listReadiness(query: {
  roleProfileId?: string;
  state?: string;
  handlerId?: string;
}) {
  const items = await scanEntity("READY");
  let list = items.map((i) => stripKeys(i) as unknown as ReadinessAssessment);
  if (query.roleProfileId) list = list.filter((r) => r.roleProfileId === query.roleProfileId);
  if (query.state) list = list.filter((r) => r.state === query.state);
  if (query.handlerId) list = list.filter((r) => r.handlerId === query.handlerId);
  return { items: list, nextCursor: undefined as string | undefined };
}

export async function createReadiness(body: ReadinessAssessmentCreate) {
  const id = `ready_${nanoid(8)}`;
  const assessedAt = now();
  const item = {
    ...keys.readiness(body.handlerId, body.roleProfileId),
    gsi1pk: "READY",
    gsi1sk: `READY#${id}`,
    entityType: "READY",
    id,
    handlerId: body.handlerId,
    roleProfileId: body.roleProfileId,
    capabilityPathId: body.capabilityPathId,
    state: "developing" as const,
    productionDecisionCount: 0,
    productionAccuracy: 0,
    assessedAt,
  };
  await putItem(item);
  return stripKeys(item) as unknown as ReadinessAssessment;
}

export async function listRedeployments(query: {
  status?: string;
  releasedFromDecisionTypeId?: string;
}) {
  const items = await scanEntity("REDEPLOY");
  let list = items.map((i) => stripKeys(i) as unknown as RedeploymentAssignment);
  if (query.status) list = list.filter((r) => r.status === query.status);
  if (query.releasedFromDecisionTypeId) {
    list = list.filter((r) => r.releasedFromDecisionTypeId === query.releasedFromDecisionTypeId);
  }
  return { items: list, nextCursor: undefined as string | undefined };
}

export async function createRedeployment(body: RedeploymentAssignmentCreate) {
  const id = `rd_${nanoid(8)}`;
  const item = {
    ...keys.redeploy(id),
    gsi1pk: "REDEPLOY",
    gsi1sk: `REDEPLOY#${id}`,
    entityType: "REDEPLOY",
    id,
    handlerId: body.handlerId,
    releasedFromDecisionTypeId: body.releasedFromDecisionTypeId,
    destinationRoleProfileId: body.destinationRoleProfileId,
    destinationQueue: body.destinationQueue,
    capabilityPathId: body.capabilityPathId,
    fundedStartDate: body.fundedStartDate,
    releasedCapacityHours: body.releasedCapacityHours,
    reskillingCost: body.reskillingCost,
    status: body.fundedStartDate ? ("funded" as const) : ("proposed" as const),
  };
  await putItem(item);
  return stripKeys(item) as unknown as RedeploymentAssignment;
}

export async function getCapacityPlan(query: {
  period?: string;
  proposedPolicyId?: string;
}): Promise<QueueCapacityPlan> {
  const items = await scanEntity("CAP");
  if (items.length) {
    const plan = stripKeys(items[0]) as unknown as QueueCapacityPlan & { id?: string };
    return plan;
  }
  return {
    period: query.period ?? "2026Q2",
    proposedPolicyId: query.proposedPolicyId,
    queues: [
      {
        queue: "motor_glass",
        projectedVolume: 1200,
        requiredHandlers: 8,
        certifiedHandlers: 11,
        shortfall: 0,
      },
      {
        queue: "bodily_injury",
        projectedVolume: 420,
        requiredHandlers: 14,
        certifiedHandlers: 9,
        shortfall: 5,
      },
    ],
    releasedCapacityHours: 160,
    unassignedCapacityHours: 0,
  };
}

export async function governanceRegister(query: { cursor?: string; limit?: number }) {
  const { items, lastKey } = await queryGsi("GSI1", "gsi1pk", "GOV", {
    limit: query.limit ?? 50,
    exclusiveStartKey: decodeCursor(query.cursor),
  });
  return {
    items: items.map((i) => stripKeys(i) as unknown as GovernanceEntry),
    nextCursor: encodeCursor(lastKey),
  };
}

export async function reproducePolicy(decisionRequestId: string): Promise<PolicyReproduction> {
  const raw = await getItem(`DREQ#${decisionRequestId}`, "META");
  if (!raw) throw notFound(`Decision request ${decisionRequestId} not found`);
  const dreq = stripKeys(raw) as unknown as DecisionRequest & {
    lastPolicyId?: string;
    lastPolicyVersion?: number;
    lastAllocationMode?: string;
    accountableHandlerId?: string;
  };
  const allocs = await queryPk(`DREQ#${decisionRequestId}`, "ALLOC#");
  const latestAlloc = allocs.sort((a, b) =>
    String(b.sk).localeCompare(String(a.sk))
  )[0];
  const allocation = latestAlloc
    ? (stripKeys(latestAlloc) as unknown as Allocation)
    : undefined;

  let baseline: CombinationBaseline | undefined;
  const baselines = await queryPk(`BASELINE#${dreq.decisionTypeId}`, "PERIOD#");
  if (baselines[0]) baseline = stripKeys(baselines[0]) as unknown as CombinationBaseline;

  const judge = await getItem(`DREQ#${decisionRequestId}`, "JUDGE");

  return {
    decisionRequestId,
    policyId: allocation?.policyId ?? dreq.lastPolicyId,
    policyVersion: allocation?.policyVersion ?? dreq.lastPolicyVersion,
    modeApplied: allocation?.mode ?? dreq.lastAllocationMode,
    thresholdsInForce: {
      minimumConfidence: 0.75,
      minimumCombinedAccuracy: 0.97,
    },
    exclusionFlagsAtDecision: dreq.exclusionFlags,
    accountableHandlerId:
      (judge?.handlerId as string | undefined) ??
      dreq.accountableHandlerId ??
      allocation?.accountableHandlerId,
    baselineAtDecision: baseline,
  };
}
