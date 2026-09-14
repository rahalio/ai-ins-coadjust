export const keys = {
  user: (id: string) => ({ pk: `USER#${id}`, sk: "PROFILE" }),
  userByEmail: (email: string) => ({
    gsi1pk: `EMAIL#${email.toLowerCase()}`,
    gsi1sk: "USER",
  }),
  apiKey: (hash: string) => ({ pk: `APIKEY#${hash}`, sk: "META" }),
  decisionType: (id: string) => ({ pk: `DTYPE#${id}`, sk: "META" }),
  decisionTypeList: () => ({ gsi1pk: "DTYPE", gsi1sk: (id: string) => `DTYPE#${id}` }),
  decisionRequest: (id: string) => ({ pk: `DREQ#${id}`, sk: "META" }),
  allocation: (id: string, ts: string) => ({ pk: `DREQ#${id}`, sk: `ALLOC#${ts}` }),
  recommendation: (id: string) => ({ pk: `DREQ#${id}`, sk: "REC" }),
  judgement: (id: string) => ({ pk: `DREQ#${id}`, sk: "JUDGE" }),
  outcome: (id: string) => ({ pk: `DREQ#${id}`, sk: "OUTCOME" }),
  policy: (id: string, version: number) => ({
    pk: `POLICY#${id}`,
    sk: `VER#${String(version).padStart(6, "0")}`,
  }),
  baseline: (decisionTypeId: string, period: string) => ({
    pk: `BASELINE#${decisionTypeId}`,
    sk: `PERIOD#${period}`,
  }),
  guardrail: (decisionTypeId: string, id: string) => ({
    pk: `GUARD#${decisionTypeId}`,
    sk: `EVENT#${id}`,
  }),
  readiness: (handlerId: string, roleId: string) => ({
    pk: `READY#${handlerId}`,
    sk: `ROLE#${roleId}`,
  }),
  redeploy: (id: string) => ({ pk: `REDEPLOY#${id}`, sk: "META" }),
  capacity: (queueId: string, planId: string) => ({
    pk: `CAP#${queueId}`,
    sk: `PLAN#${planId}`,
  }),
  governance: (decisionTypeId: string) => ({
    pk: `GOV#${decisionTypeId}`,
    sk: "ENTRY",
  }),
  roleProfile: (id: string) => ({ pk: `ROLEPROF#${id}`, sk: "META" }),
  audit: (day: string, id: string) => ({
    pk: `AUDIT#${day}`,
    sk: `TS#${id}`,
  }),
};

export type EntityType =
  | "USER"
  | "APIKEY"
  | "DTYPE"
  | "DREQ"
  | "ALLOC"
  | "REC"
  | "JUDGE"
  | "OUTCOME"
  | "POLICY"
  | "BASELINE"
  | "GUARD"
  | "READY"
  | "REDEPLOY"
  | "CAP"
  | "GOV"
  | "ROLEPROF"
  | "AUDIT";
