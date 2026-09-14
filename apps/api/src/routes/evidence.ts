import { Router } from "express";
import { requireAuth, requirePurpose } from "../http/auth";
import { dataEnvelope, listEnvelope } from "../http/envelopes";
import * as domain from "../services/domain";

export const evidenceRouter = Router();

evidenceRouter.post("/outcomes", requireAuth("apiKey"), async (req, res, next) => {
  try {
    const outcome = await domain.createOutcome(req.body);
    res.status(201).json(dataEnvelope(outcome, req.requestId));
  } catch (err) {
    next(err);
  }
});

evidenceRouter.get(
  "/evidence/combination-baselines",
  requireAuth("bearer"),
  async (req, res, next) => {
    try {
      const result = await domain.listBaselines({
        decisionTypeId: req.query.decisionTypeId as string | undefined,
        period: req.query.period as string | undefined,
        cursor: req.query.cursor as string | undefined,
      });
      res.json(listEnvelope(result.items, result.nextCursor, req.requestId));
    } catch (err) {
      next(err);
    }
  }
);

evidenceRouter.get(
  "/evidence/deference-report",
  requireAuth("bearer"),
  requirePurpose("pairing_design"),
  async (req, res, next) => {
    try {
      const report = await domain.deferenceReport({
        decisionTypeId: req.query.decisionTypeId as string | undefined,
        period: req.query.period as string | undefined,
        purpose: req.query.purpose as string | undefined,
      });
      res.json(dataEnvelope(report, req.requestId));
    } catch (err) {
      next(err);
    }
  }
);

evidenceRouter.get(
  "/evidence/guardrail-breaches",
  requireAuth("bearer"),
  async (req, res, next) => {
    try {
      const result = await domain.listGuardrails({
        decisionTypeId: req.query.decisionTypeId as string | undefined,
        status: req.query.status as string | undefined,
      });
      res.json(listEnvelope(result.items, result.nextCursor, req.requestId));
    } catch (err) {
      next(err);
    }
  }
);

evidenceRouter.post(
  "/decision-types/:decisionTypeId/suspension",
  requireAuth("either"),
  async (req, res, next) => {
    try {
      const dtype = await domain.suspendDecisionType(
        req.params.decisionTypeId,
        req.body
      );
      res.json(dataEnvelope(dtype, req.requestId));
    } catch (err) {
      next(err);
    }
  }
);
