import bcrypt from "bcryptjs";
import { createHash } from "crypto";
import { putItem } from "../db/repo";
import { keys } from "../db/keys";

const password = "coadjust";
const DEMO_API_KEY = "coadjust-demo-api-key";

async function seed() {
  const passwordHash = await bcrypt.hash(password, 10);
  const apiKeyHash = createHash("sha256").update(DEMO_API_KEY).digest("hex");

  const users = [
    {
      id: "user_ava",
      email: "ava.handler@coadjust.demo",
      name: "Ava Chen",
      role: "handler",
      handlerId: "handler_ava",
    },
    {
      id: "user_leo",
      email: "leo.leader@coadjust.demo",
      name: "Leo Martins",
      role: "team_leader",
    },
    {
      id: "user_nina",
      email: "nina.quality@coadjust.demo",
      name: "Nina Okonkwo",
      role: "quality_conduct",
    },
    {
      id: "user_sam",
      email: "sam.workforce@coadjust.demo",
      name: "Sam Reid",
      role: "workforce",
    },
    {
      id: "user_jordan",
      email: "jordan.caio@coadjust.demo",
      name: "Jordan Hale",
      role: "caio_governance",
    },
    {
      id: "user_priya",
      email: "priya.dpo@coadjust.demo",
      name: "Priya Nair",
      role: "dpo",
    },
  ];

  for (const u of users) {
    await putItem({
      ...keys.user(u.id),
      gsi1pk: `EMAIL#${u.email.toLowerCase()}`,
      gsi1sk: "USER",
      entityType: "USER",
      ...u,
      passwordHash,
    });
  }

  await putItem({
    ...keys.apiKey(apiKeyHash),
    entityType: "APIKEY",
    principalId: "claims_platform",
    name: "Claims platform integration",
    keyHint: DEMO_API_KEY.slice(0, 8) + "…",
  });

  const dtGlass = {
    id: "dt_motor_glass",
    name: "Motor glass indemnity approval",
    lineOfBusiness: "motor",
    decisionStage: "indemnity_approval",
    allocationMode: "paired",
    humanMandatory: false,
    authorityLimit: { amount: 2500, currency: "EUR" },
    activeBaselineId: "bl_motor_glass_2026q1",
    activePolicyId: "pol_motor_glass",
  };
  const dtEow = {
    id: "dt_eow",
    name: "Escape of water damage assessment",
    lineOfBusiness: "property",
    decisionStage: "damage_assessment",
    allocationMode: "human_only",
    humanMandatory: false,
    authorityLimit: { amount: 5000, currency: "EUR" },
    activeBaselineId: "bl_eow_2026q1",
  };
  const dtMedical = {
    id: "dt_medical_bill",
    name: "Medical bill adjudication",
    lineOfBusiness: "health",
    decisionStage: "bill_adjudication",
    allocationMode: "paired",
    humanMandatory: false,
    authorityLimit: { amount: 1500, currency: "EUR" },
    activeBaselineId: "bl_medical_2026q1",
    activePolicyId: "pol_medical",
  };
  const dtBi = {
    id: "dt_bodily_injury",
    name: "Bodily injury reserve review",
    lineOfBusiness: "motor",
    decisionStage: "indemnity_approval",
    allocationMode: "human_only",
    humanMandatory: true,
    authorityLimit: { amount: 50000, currency: "EUR" },
  };

  const decisionTypes = [dtGlass, dtEow, dtMedical, dtBi] as Array<{
    id: string;
    name: string;
    lineOfBusiness: string;
    decisionStage: string;
    allocationMode: string;
    humanMandatory: boolean;
    authorityLimit: { amount: number; currency: string };
    activeBaselineId?: string;
    activePolicyId?: string;
  }>;

  for (const dt of decisionTypes) {
    await putItem({
      ...keys.decisionType(dt.id),
      gsi1pk: "DTYPE",
      gsi1sk: `DTYPE#${dt.id}`,
      entityType: "DTYPE",
      ...dt,
    });
    await putItem({
      ...keys.governance(dt.id),
      gsi1pk: "GOV",
      gsi1sk: `GOV#${dt.id}`,
      entityType: "GOV",
      decisionTypeId: dt.id,
      decisionTypeName: dt.name,
      allocationMode: dt.allocationMode,
      activePolicyVersion: dt.activePolicyId ? 1 : undefined,
      combinationPremium:
        dt.id === "dt_motor_glass" ? 0.035 : dt.id === "dt_medical_bill" ? 0.028 : 0.02,
      lastApprovedBy: dt.activePolicyId ? "user_jordan" : undefined,
      lastApprovedAt: dt.activePolicyId ? "2026-01-15T10:00:00.000Z" : undefined,
      openGuardrailBreaches: dt.id === "dt_eow" ? 1 : 0,
    });
  }

  const baselines = [
    {
      id: "bl_motor_glass_2026q1",
      decisionTypeId: "dt_motor_glass",
      period: "2026Q1",
      populationSize: 1840,
      modelOnlyAccuracy: 0.91,
      humanOnlyAccuracy: 0.945,
      pairedAccuracy: 0.98,
      combinationPremium: 0.035,
      leakagePerDecision: { amount: 18, currency: "EUR" },
      populationDefinition: "Personal motor glass claims < €2,500 excl. vulnerable/BI",
      decayFlag: false,
    },
    {
      id: "bl_eow_2026q1",
      decisionTypeId: "dt_eow",
      period: "2026Q1",
      populationSize: 620,
      modelOnlyAccuracy: 0.86,
      humanOnlyAccuracy: 0.93,
      pairedAccuracy: 0.97,
      combinationPremium: 0.04,
      populationDefinition: "Domestic EoW damage assessments",
      decayFlag: false,
    },
    {
      id: "bl_medical_2026q1",
      decisionTypeId: "dt_medical_bill",
      period: "2026Q1",
      populationSize: 2210,
      modelOnlyAccuracy: 0.89,
      humanOnlyAccuracy: 0.94,
      pairedAccuracy: 0.968,
      combinationPremium: 0.028,
      populationDefinition: "Outpatient medical bills < €1,500",
      decayFlag: false,
    },
  ];

  for (const b of baselines) {
    await putItem({
      ...keys.baseline(b.decisionTypeId, b.period),
      gsi1pk: "BASELINE",
      gsi1sk: `BASELINE#${b.id}`,
      entityType: "BASELINE",
      ...b,
    });
  }

  await putItem({
    ...keys.policy("pol_motor_glass", 1),
    gsi1pk: "POLICY",
    gsi1sk: "POLICY#pol_motor_glass#1",
    gsi3pk: "DTYPEPOL#dt_motor_glass",
    gsi3sk: "VER#1",
    entityType: "POLICY",
    id: "pol_motor_glass",
    decisionTypeId: "dt_motor_glass",
    version: 1,
    state: "active",
    targetMode: "paired",
    minimumCombinedAccuracy: 0.97,
    minimumConfidence: 0.75,
    excludedFlags: ["vulnerable_customer", "bodily_injury", "fatality"],
    supportingBaselineId: "bl_motor_glass_2026q1",
    approvedBy: "user_jordan",
    effectiveFrom: "2026-01-15T10:00:00.000Z",
  });

  await putItem({
    ...keys.policy("pol_medical", 1),
    gsi1pk: "POLICY",
    gsi1sk: "POLICY#pol_medical#1",
    gsi3pk: "DTYPEPOL#dt_medical_bill",
    gsi3sk: "VER#1",
    entityType: "POLICY",
    id: "pol_medical",
    decisionTypeId: "dt_medical_bill",
    version: 1,
    state: "active",
    targetMode: "paired",
    minimumCombinedAccuracy: 0.96,
    minimumConfidence: 0.8,
    excludedFlags: ["vulnerable_customer", "bodily_injury", "fatality"],
    supportingBaselineId: "bl_medical_2026q1",
    approvedBy: "user_jordan",
    effectiveFrom: "2026-01-20T10:00:00.000Z",
  });

  await putItem({
    ...keys.guardrail("dt_eow", "gr_eow_cycle"),
    gsi1pk: "GUARD",
    gsi1sk: "GUARD#gr_eow_cycle",
    entityType: "GUARD",
    id: "gr_eow_cycle",
    decisionTypeId: "dt_eow",
    metric: "cycle_time",
    threshold: 4.0,
    observedValue: 5.2,
    status: "open",
    breachedAt: "2026-03-01T09:00:00.000Z",
  });

  await putItem({
    ...keys.roleProfile("role_bi_paired"),
    gsi1pk: "ROLEPROF",
    gsi1sk: "ROLEPROF#role_bi_paired",
    entityType: "ROLEPROF",
    id: "role_bi_paired",
    name: "Bodily injury paired reviewer",
    pairedDecisionTypes: ["dt_bodily_injury"],
    requiredCapabilities: ["bi_negotiation", "vulnerable_customer"],
  });

  await putItem({
    ...keys.readiness("handler_ava", "role_bi_paired"),
    gsi1pk: "READY",
    gsi1sk: "READY#ready_ava_bi",
    entityType: "READY",
    id: "ready_ava_bi",
    handlerId: "handler_ava",
    roleProfileId: "role_bi_paired",
    state: "developing",
    productionDecisionCount: 42,
    productionAccuracy: 0.96,
    overrideUpheldRate: 0.58,
    capabilityPathId: "path_bi_2026",
    assessedAt: "2026-03-10T12:00:00.000Z",
  });

  await putItem({
    ...keys.redeploy("rd_ava_glass"),
    gsi1pk: "REDEPLOY",
    gsi1sk: "REDEPLOY#rd_ava_glass",
    entityType: "REDEPLOY",
    id: "rd_ava_glass",
    handlerId: "handler_ava",
    releasedFromDecisionTypeId: "dt_motor_glass",
    destinationRoleProfileId: "role_bi_paired",
    destinationQueue: "bodily_injury",
    capabilityPathId: "path_bi_2026",
    fundedStartDate: "2026-04-01",
    status: "funded",
    releasedCapacityHours: 20,
    reskillingCost: { amount: 4200, currency: "EUR" },
  });

  await putItem({
    ...keys.capacity("motor_glass", "plan_2026q2"),
    gsi1pk: "CAP",
    gsi1sk: "CAP#plan_2026q2",
    entityType: "CAP",
    id: "plan_2026q2",
    period: "2026Q2",
    proposedPolicyId: "pol_motor_glass",
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
  });

  const now = new Date().toISOString();
  const queueItems = [
    {
      id: "dr_glass_001",
      decisionTypeId: "dt_motor_glass",
      claimReference: "CLM-2026-44101",
      claimEvent: "estimate_received",
      status: "awaiting_human",
      claimedAmount: { amount: 680, currency: "EUR" },
      exclusionFlags: [],
      raisedAt: now,
      serviceDueAt: new Date(Date.now() + 2 * 86400000).toISOString(),
      lastAllocationMode: "paired",
      lastPolicyId: "pol_motor_glass",
      lastPolicyVersion: 1,
      accountableHandlerId: "handler_ava",
    },
    {
      id: "dr_glass_002",
      decisionTypeId: "dt_motor_glass",
      claimReference: "CLM-2026-44188",
      claimEvent: "estimate_received",
      status: "awaiting_human",
      claimedAmount: { amount: 420, currency: "EUR" },
      exclusionFlags: [],
      raisedAt: now,
      serviceDueAt: new Date(Date.now() + 1 * 86400000).toISOString(),
      lastAllocationMode: "paired",
      lastPolicyId: "pol_motor_glass",
      lastPolicyVersion: 1,
      accountableHandlerId: "handler_ava",
    },
    {
      id: "dr_vuln_001",
      decisionTypeId: "dt_motor_glass",
      claimReference: "CLM-2026-45002",
      claimEvent: "estimate_received",
      status: "allocated",
      claimedAmount: { amount: 910, currency: "EUR" },
      exclusionFlags: [
        {
          flag: "vulnerable_customer",
          source: "fnol_intake",
          setAt: now,
        },
      ],
      raisedAt: now,
      serviceDueAt: new Date(Date.now() + 3 * 86400000).toISOString(),
      lastAllocationMode: "human_only",
      lastPolicyId: "pol_motor_glass",
      lastPolicyVersion: 1,
      accountableHandlerId: "handler_ava",
    },
    {
      id: "dr_done_001",
      decisionTypeId: "dt_motor_glass",
      claimReference: "CLM-2026-43011",
      claimEvent: "estimate_received",
      status: "reconciled",
      claimedAmount: { amount: 510, currency: "EUR" },
      exclusionFlags: [],
      raisedAt: "2026-02-01T10:00:00.000Z",
      lastAllocationMode: "paired",
      lastPolicyId: "pol_motor_glass",
      lastPolicyVersion: 1,
      accountableHandlerId: "handler_ava",
    },
  ];

  for (const q of queueItems) {
    await putItem({
      ...keys.decisionRequest(q.id),
      gsi1pk: `STATUS#${q.status}`,
      gsi1sk: q.raisedAt,
      gsi2pk: `CLAIM#${q.claimReference}`,
      gsi2sk: `DREQ#${q.id}`,
      gsi3pk:
        q.status === "awaiting_human"
          ? "HANDLERQUEUE#handler_ava"
          : "HANDLERQUEUE#none",
      gsi3sk: q.raisedAt,
      entityType: "DREQ",
      ...q,
    });
  }

  await putItem({
    ...keys.recommendation("dr_glass_001"),
    entityType: "REC",
    decisionRequestId: "dr_glass_001",
    modelId: "motor-glass-v3",
    modelVersion: "3.2.1",
    recommendedAction: "approve_at_estimate",
    recommendedAmount: { amount: 680, currency: "EUR" },
    confidence: 0.91,
    drivers: [
      { factor: "photo_damage_consistency", direction: "increases", contribution: 0.44 },
      { factor: "oem_parts_match", direction: "increases", contribution: 0.27 },
      { factor: "prior_claim_frequency", direction: "decreases", contribution: 0.09 },
    ],
    comparableOutcomes: [
      { claimReference: "CLM-DEMO-001", settledAmount: { amount: 640, currency: "EUR" } },
      { claimReference: "CLM-DEMO-014", settledAmount: { amount: 700, currency: "EUR" } },
    ],
    issuedAt: now,
  });

  await putItem({
    ...keys.recommendation("dr_glass_002"),
    entityType: "REC",
    decisionRequestId: "dr_glass_002",
    modelId: "motor-glass-v3",
    modelVersion: "3.2.1",
    recommendedAction: "approve_at_estimate",
    recommendedAmount: { amount: 420, currency: "EUR" },
    confidence: 0.84,
    drivers: [
      { factor: "aftermarket_parts_available", direction: "decreases", contribution: 0.31 },
      { factor: "photo_damage_consistency", direction: "increases", contribution: 0.38 },
    ],
    comparableOutcomes: [
      { claimReference: "CLM-DEMO-022", settledAmount: { amount: 390, currency: "EUR" } },
    ],
    issuedAt: now,
  });

  await putItem({
    ...keys.allocation("dr_glass_001", now),
    entityType: "ALLOC",
    decisionRequestId: "dr_glass_001",
    mode: "paired",
    policyId: "pol_motor_glass",
    policyVersion: 1,
    rationale: "Active policy pol_motor_glass v1 targetMode=paired",
    assignedQueue: "paired_review",
    accountableHandlerId: "handler_ava",
    allocatedAt: now,
  });

  await putItem({
    ...keys.judgement("dr_done_001"),
    entityType: "JUDGE",
    decisionRequestId: "dr_done_001",
    handlerId: "handler_ava",
    disposition: "overridden",
    decidedAmount: { amount: 480, currency: "EUR" },
    overrideReason: "estimate_quality",
    overrideNarrative: "Windscreen quote included unnecessary ADAS recalibration",
    timeOnDecisionSeconds: 340,
    decidedAt: "2026-02-01T11:00:00.000Z",
  });

  await putItem({
    ...keys.outcome("dr_done_001"),
    entityType: "OUTCOME",
    decisionRequestId: "dr_done_001",
    outcomeType: "settled",
    settledAmount: { amount: 475, currency: "EUR" },
    leakageAmount: { amount: 0, currency: "EUR" },
    observedAt: "2026-02-20T10:00:00.000Z",
  });

  console.log("Seed complete.");
  console.log("Demo password for all users:", password);
  console.log("Demo API key:", DEMO_API_KEY);
  console.log("Users:");
  for (const u of users) console.log(`  ${u.email} (${u.role})`);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
