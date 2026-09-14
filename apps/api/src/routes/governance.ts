import { Router } from "express";
import { requireAuth } from "../http/auth";
import { dataEnvelope, listEnvelope } from "../http/envelopes";
import { unprocessable } from "../http/errors";
import * as domain from "../services/domain";

export const governanceRouter = Router();

governanceRouter.get(
  "/governance/register",
  requireAuth("bearer"),
  async (req, res, next) => {
    try {
      const result = await domain.governanceRegister({
        cursor: req.query.cursor as string | undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
      });
      res.json(listEnvelope(result.items, result.nextCursor, req.requestId));
    } catch (err) {
      next(err);
    }
  }
);

governanceRouter.get(
  "/governance/policy-reproduction",
  requireAuth("bearer"),
  async (req, res, next) => {
    try {
      const decisionRequestId = req.query.decisionRequestId as string | undefined;
      if (!decisionRequestId) {
        throw unprocessable("decisionRequestId is required");
      }
      const reproduction = await domain.reproducePolicy(decisionRequestId);
      res.json(dataEnvelope(reproduction, req.requestId));
    } catch (err) {
      next(err);
    }
  }
);
