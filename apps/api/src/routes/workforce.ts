import { Router } from "express";
import { requireAuth } from "../http/auth";
import { dataEnvelope, listEnvelope } from "../http/envelopes";
import * as domain from "../services/domain";

export const workforceRouter = Router();

workforceRouter.get(
  "/workforce/readiness-assessments",
  requireAuth("bearer"),
  async (req, res, next) => {
    try {
      const result = await domain.listReadiness({
        roleProfileId: req.query.roleProfileId as string | undefined,
        state: req.query.state as string | undefined,
        handlerId: req.query.handlerId as string | undefined,
      });
      res.json(listEnvelope(result.items, result.nextCursor, req.requestId));
    } catch (err) {
      next(err);
    }
  }
);

workforceRouter.post(
  "/workforce/readiness-assessments",
  requireAuth("bearer"),
  async (req, res, next) => {
    try {
      const created = await domain.createReadiness(req.body);
      res.status(201).json(dataEnvelope(created, req.requestId));
    } catch (err) {
      next(err);
    }
  }
);

workforceRouter.get(
  "/workforce/redeployments",
  requireAuth("bearer"),
  async (req, res, next) => {
    try {
      const result = await domain.listRedeployments({
        status: req.query.status as string | undefined,
        releasedFromDecisionTypeId: req.query.releasedFromDecisionTypeId as
          | string
          | undefined,
      });
      res.json(listEnvelope(result.items, result.nextCursor, req.requestId));
    } catch (err) {
      next(err);
    }
  }
);

workforceRouter.post(
  "/workforce/redeployments",
  requireAuth("bearer"),
  async (req, res, next) => {
    try {
      const created = await domain.createRedeployment(req.body);
      res.status(201).json(dataEnvelope(created, req.requestId));
    } catch (err) {
      next(err);
    }
  }
);

workforceRouter.get(
  "/workforce/capacity-plans",
  requireAuth("bearer"),
  async (req, res, next) => {
    try {
      const plan = await domain.getCapacityPlan({
        period: req.query.period as string | undefined,
        proposedPolicyId: req.query.proposedPolicyId as string | undefined,
      });
      res.json(dataEnvelope(plan, req.requestId));
    } catch (err) {
      next(err);
    }
  }
);
