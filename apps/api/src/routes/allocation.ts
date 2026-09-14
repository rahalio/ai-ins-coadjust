import { Router } from "express";
import { requireAuth } from "../http/auth";
import { dataEnvelope, listEnvelope } from "../http/envelopes";
import * as domain from "../services/domain";

export const allocationRouter = Router();

allocationRouter.post(
  "/decision-requests/:decisionRequestId/allocation",
  requireAuth("either"),
  async (req, res, next) => {
    try {
      const allocation = await domain.allocateDecisionRequest(
        req.params.decisionRequestId
      );
      res.status(201).json(dataEnvelope(allocation, req.requestId));
    } catch (err) {
      next(err);
    }
  }
);

allocationRouter.get(
  "/allocation-policies",
  requireAuth("bearer"),
  async (req, res, next) => {
    try {
      const result = await domain.listPolicies({
        decisionTypeId: req.query.decisionTypeId as string | undefined,
        state: req.query.state as string | undefined,
        cursor: req.query.cursor as string | undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
      });
      res.json(listEnvelope(result.items, result.nextCursor, req.requestId));
    } catch (err) {
      next(err);
    }
  }
);

allocationRouter.post(
  "/allocation-policies",
  requireAuth("bearer"),
  async (req, res, next) => {
    try {
      const created = await domain.createPolicy(req.body);
      res.status(201).json(dataEnvelope(created, req.requestId));
    } catch (err) {
      next(err);
    }
  }
);

allocationRouter.post(
  "/allocation-policies/:policyId/approval",
  requireAuth("bearer"),
  async (req, res, next) => {
    try {
      const approved = await domain.approvePolicy(req.params.policyId, req.body);
      res.json(dataEnvelope(approved, req.requestId));
    } catch (err) {
      next(err);
    }
  }
);
