import { Router } from "express";
import { requireAuth } from "../http/auth";
import { dataEnvelope } from "../http/envelopes";
import * as domain from "../services/domain";

export const pairingRouter = Router();

pairingRouter.get(
  "/decision-requests/:decisionRequestId/recommendation",
  requireAuth("bearer"),
  async (req, res, next) => {
    try {
      const rec = await domain.getRecommendation(req.params.decisionRequestId);
      res.json(dataEnvelope(rec, req.requestId));
    } catch (err) {
      next(err);
    }
  }
);

pairingRouter.post(
  "/decision-requests/:decisionRequestId/judgement",
  requireAuth("bearer"),
  async (req, res, next) => {
    try {
      const judgement = await domain.recordJudgement(
        req.params.decisionRequestId,
        req.body
      );
      res.status(201).json(dataEnvelope(judgement, req.requestId));
    } catch (err) {
      next(err);
    }
  }
);
