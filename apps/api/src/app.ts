import express from "express";
import cors from "cors";
import { authenticate } from "./http/auth";
import { errorHandler, requestId } from "./http/middleware";
import { authRouter } from "./routes/auth";
import { decisionsRouter } from "./routes/decisions";
import { allocationRouter } from "./routes/allocation";
import { pairingRouter } from "./routes/pairing";
import { evidenceRouter } from "./routes/evidence";
import { workforceRouter } from "./routes/workforce";
import { governanceRouter } from "./routes/governance";

export function createApp() {
  const app = express();
  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json());
  app.use(requestId);
  app.use(authenticate);

  app.get("/health", (_req, res) => {
    res.json({ ok: true, service: "coadjust-api" });
  });

  app.use("/v1/auth", authRouter);
  app.use("/v1", decisionsRouter);
  app.use("/v1", allocationRouter);
  app.use("/v1", pairingRouter);
  app.use("/v1", evidenceRouter);
  app.use("/v1", workforceRouter);
  app.use("/v1", governanceRouter);

  app.use(errorHandler);
  return app;
}
