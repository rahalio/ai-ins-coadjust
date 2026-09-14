export type UserRole =
  | "handler"
  | "team_leader"
  | "quality_conduct"
  | "workforce"
  | "caio_governance"
  | "dpo";

export type AllocationMode = "model_only" | "human_only" | "paired" | "suspended";
export type AllocatedMode = "model_only" | "human_only" | "paired";
export type DecisionRequestStatus =
  | "raised"
  | "allocated"
  | "awaiting_human"
  | "decided"
  | "executed"
  | "reconciled";

export type LineOfBusiness = "motor" | "property" | "health" | "liability" | "travel" | "pet";

export type DecisionStage =
  | "fnol_triage"
  | "coverage_confirmation"
  | "damage_assessment"
  | "bill_adjudication"
  | "indemnity_approval"
  | "declinature"
  | "fraud_referral"
  | "recovery_and_subrogation";

export type ExclusionFlagKind =
  | "vulnerable_customer"
  | "bodily_injury"
  | "fatality"
  | "litigation"
  | "catastrophe_event"
  | "fraud_referral_open"
  | "regulatory_hold";

export interface Money {
  amount: number;
  currency: string;
}

export interface ExclusionFlag {
  flag: ExclusionFlagKind;
  source: string;
  setAt?: string;
}

export interface ResponseMeta {
  requestId: string;
  timestamp: string;
}

export interface Problem {
  type: string;
  title: string;
  status: number;
  detail?: string;
}

export interface DataEnvelope<T> {
  data: T;
  meta: ResponseMeta;
}

export interface ListData<T> {
  items: T[];
  nextCursor?: string;
}

export interface ListEnvelope<T> {
  data: ListData<T>;
  meta: ResponseMeta;
}

export interface DecisionType {
  id: string;
  name: string;
  lineOfBusiness: LineOfBusiness;
  decisionStage?: DecisionStage | string;
  allocationMode: AllocationMode;
  humanMandatory?: boolean;
  authorityLimit?: Money;
  activeBaselineId?: string;
  activePolicyId?: string;
}

export interface DecisionTypeCreate {
  name: string;
  lineOfBusiness: LineOfBusiness;
  decisionStage: string;
  humanMandatory?: boolean;
  authorityLimit?: Money;
}

export interface DecisionRequest {
  id: string;
  decisionTypeId: string;
  claimReference: string;
  claimEvent?: string;
  status: DecisionRequestStatus;
  claimedAmount?: Money;
  exclusionFlags?: ExclusionFlag[];
  raisedAt?: string;
  serviceDueAt?: string;
}

export interface DecisionRequestCreate {
  decisionTypeId: string;
  claimReference: string;
  claimEvent: string;
  claimedAmount?: Money;
  exclusionFlags?: ExclusionFlag[];
  serviceDueAt?: string;
}

export interface Allocation {
  decisionRequestId: string;
  mode: AllocatedMode;
  policyId: string;
  policyVersion?: number;
  rationale?: string;
  assignedQueue?: string;
  accountableHandlerId?: string;
  allocatedAt?: string;
}

export interface AllocationPolicy {
  id: string;
  decisionTypeId: string;
  version: number;
  state: "draft" | "awaiting_approval" | "active" | "superseded" | "suspended";
  targetMode: AllocatedMode;
  minimumCombinedAccuracy?: number;
  minimumConfidence?: number;
  excludedFlags?: string[];
  supportingBaselineId?: string;
  approvedBy?: string;
  effectiveFrom?: string;
}

export interface AllocationPolicyCreate {
  decisionTypeId: string;
  targetMode: AllocatedMode;
  minimumCombinedAccuracy?: number;
  minimumConfidence?: number;
  excludedFlags?: string[];
  supportingBaselineId: string;
}

export interface Recommendation {
  decisionRequestId: string;
  modelId: string;
  modelVersion?: string;
  recommendedAction?: string;
  recommendedAmount?: Money;
  confidence?: number;
  drivers?: Array<{
    factor?: string;
    direction?: "increases" | "decreases";
    contribution?: number;
  }>;
  comparableOutcomes?: Array<{
    claimReference?: string;
    settledAmount?: Money;
  }>;
  issuedAt: string;
}

export type JudgementDisposition =
  | "agreed"
  | "overridden"
  | "escalated"
  | "referred_to_siu"
  | "declined_cover";

export type OverrideReason =
  | "evidence_not_in_model"
  | "policy_wording_interpretation"
  | "claimant_circumstance"
  | "suspected_fraud"
  | "estimate_quality"
  | "reserve_adequacy"
  | "other";

export interface HumanJudgement {
  decisionRequestId: string;
  handlerId: string;
  disposition: JudgementDisposition;
  decidedAmount?: Money;
  overrideReason?: OverrideReason | string;
  overrideNarrative?: string;
  timeOnDecisionSeconds?: number;
  decidedAt?: string;
}

export interface HumanJudgementCreate {
  handlerId: string;
  disposition: JudgementDisposition;
  decidedAmount?: Money;
  overrideReason?: string;
  overrideNarrative?: string;
  timeOnDecisionSeconds?: number;
}

export interface Outcome {
  decisionRequestId: string;
  outcomeType: string;
  settledAmount?: Money;
  leakageAmount?: Money;
  reserveVariance?: Money;
  observedAt?: string;
}

export interface OutcomeCreate {
  decisionRequestId: string;
  outcomeType: string;
  settledAmount?: Money;
  leakageAmount?: Money;
  reserveVariance?: Money;
  observedAt: string;
}

export interface CombinationBaseline {
  id: string;
  decisionTypeId: string;
  period: string;
  populationSize?: number;
  modelOnlyAccuracy?: number;
  humanOnlyAccuracy?: number;
  pairedAccuracy?: number;
  combinationPremium?: number;
  leakagePerDecision?: Money;
  populationDefinition?: string;
  decayFlag?: boolean;
}

export interface DeferenceReport {
  decisionTypeId?: string;
  period?: string;
  acceptanceRate?: number;
  demonstratedModelAccuracy?: number;
  divergence?: number;
  overrideUpheldRate?: number;
  interpretation?: "calibrated" | "over_deference" | "under_deference" | "insufficient_volume";
}

export interface ConductGuardrail {
  id: string;
  decisionTypeId: string;
  metric: string;
  threshold?: number;
  observedValue?: number;
  status: "open" | "suspended" | "remediated" | "accepted";
  breachedAt?: string;
  suspendedAt?: string;
}

export interface RoleProfile {
  id: string;
  name: string;
  pairedDecisionTypes?: string[];
  requiredCapabilities?: string[];
}

export interface ReadinessAssessment {
  id: string;
  handlerId: string;
  roleProfileId: string;
  state: "not_ready" | "developing" | "ready" | "certified" | "lapsed";
  productionDecisionCount?: number;
  productionAccuracy?: number;
  overrideUpheldRate?: number;
  capabilityPathId?: string;
  assessedAt?: string;
}

export interface ReadinessAssessmentCreate {
  handlerId: string;
  roleProfileId: string;
  capabilityPathId?: string;
}

export interface RedeploymentAssignment {
  id: string;
  handlerId: string;
  releasedFromDecisionTypeId?: string;
  destinationRoleProfileId?: string;
  destinationQueue?: string;
  capabilityPathId?: string;
  fundedStartDate?: string;
  status: "proposed" | "funded" | "in_training" | "placed" | "lapsed";
  releasedCapacityHours?: number;
  reskillingCost?: Money;
  placedAt?: string;
}

export interface RedeploymentAssignmentCreate {
  handlerId: string;
  releasedFromDecisionTypeId: string;
  destinationRoleProfileId: string;
  destinationQueue?: string;
  capabilityPathId?: string;
  fundedStartDate?: string;
  releasedCapacityHours?: number;
  reskillingCost?: Money;
}

export interface QueueCapacityPlan {
  period?: string;
  proposedPolicyId?: string;
  queues?: Array<{
    queue?: string;
    projectedVolume?: number;
    requiredHandlers?: number;
    certifiedHandlers?: number;
    shortfall?: number;
  }>;
  releasedCapacityHours?: number;
  unassignedCapacityHours?: number;
}

export interface GovernanceEntry {
  decisionTypeId?: string;
  decisionTypeName?: string;
  allocationMode?: string;
  activePolicyVersion?: number;
  combinationPremium?: number;
  lastApprovedBy?: string;
  lastApprovedAt?: string;
  openGuardrailBreaches?: number;
}

export interface GovernanceApprovalCreate {
  approverId: string;
  forum: "model_governance_committee" | "claims_executive" | "conduct_committee";
  rationale: string;
  conditions?: string[];
}

export interface PolicyReproduction {
  decisionRequestId?: string;
  policyId?: string;
  policyVersion?: number;
  modeApplied?: string;
  thresholdsInForce?: Record<string, number>;
  exclusionFlagsAtDecision?: ExclusionFlag[];
  accountableHandlerId?: string;
  baselineAtDecision?: CombinationBaseline;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    handlerId?: string;
  };
}

export const FAIL_CLOSED_FLAGS: ExclusionFlagKind[] = [
  "vulnerable_customer",
  "bodily_injury",
  "fatality",
];

export const HUMAN_MANDATORY_DISPOSITIONS: JudgementDisposition[] = [
  "declined_cover",
  "referred_to_siu",
];
