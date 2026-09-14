import { Router } from "express";
import { requireAuth } from "../http/auth";
import { dataEnvelope, listEnvelope } from "../http/envelopes";
import * as domain from "../services/domain";

export const decisionsRouter = Router();

decisionsRouter.get(
  "/decision-types",
  requireAuth("either"),
  async (req, res, next) => {
    try {
      const result = await domain.listDecisionTypes({
        allocationMode: req.query.allocationMode as string | undefined,
        lineOfBusiness: req.query.lineOfBusiness as string | undefined,
        cursor: req.query.cursor as string | undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
      });
      res.json(listEnvelope(result.items, result.nextCursor, req.requestId));
    } catch (err) {
      next(err);
    }
  }
);

decisionsRouter.post(
  "/decision-types",
  requireAuth("bearer"),
  async (req, res, next) => {
    try {
      const created = await domain.registerDecisionType(req.body);
      res.status(201).json(dataEnvelope(created, req.requestId));
    } catch (err) {
      next(err);
    }
  }
);

decisionsRouter.get(
  "/decision-types/:decisionTypeId",
  requireAuth("bearer"),
  async (req, res, next) => {
    try {
      const item = await domain.getDecisionType(req.params.decisionTypeId);
      res.json(dataEnvelope(item, req.requestId));
    } catch (err) {
      next(err);
    }
  }
);

decisionsRouter.get(
  "/decision-requests",
  requireAuth("bearer"),
  async (req, res, next) => {
    try {
      const result = await domain.listDecisionRequests({
        claimReference: req.query.claimReference as string | undefined,
        status: req.query.status as string | undefined,
        cursor: req.query.cursor as string | undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
      });
      res.json(listEnvelope(result.items, result.nextCursor, req.requestId));
    } catch (err) {
      next(err);
    }
  }
);

decisionsRouter.post(
  "/decision-requests",
  requireAuth("apiKey"),
  async (req, res, next) => {
    try {
      const created = await domain.raiseDecisionRequest(req.body);
      res.status(201).json(dataEnvelope(created, req.requestId));
    } catch (err) {
      next(err);
    }
  }
);
