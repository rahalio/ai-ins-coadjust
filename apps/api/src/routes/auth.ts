import { Router } from "express";
import bcrypt from "bcryptjs";
import type { LoginRequest, UserRole } from "@coadjust/shared";
import { queryGsi } from "../db/repo";
import { requireAuth, signToken } from "../http/auth";
import { dataEnvelope } from "../http/envelopes";
import { unauthorized } from "../http/errors";
import * as domain from "../services/domain";

export const authRouter = Router();

authRouter.post("/login", async (req, res, next) => {
  try {
    const body = req.body as LoginRequest;
    const { items } = await queryGsi("GSI1", "gsi1pk", `EMAIL#${body.email.toLowerCase()}`);
    const user = items[0];
    if (!user || !user.passwordHash) throw unauthorized("Invalid email or password");
    const ok = await bcrypt.compare(body.password, String(user.passwordHash));
    if (!ok) throw unauthorized("Invalid email or password");
    const token = signToken({
      id: String(user.id),
      email: String(user.email),
      name: String(user.name),
      role: user.role as UserRole,
      handlerId: user.handlerId as string | undefined,
    });
    res.json(
      dataEnvelope(
        {
          token,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            handlerId: user.handlerId,
          },
        },
        req.requestId
      )
    );
  } catch (err) {
    next(err);
  }
});

authRouter.get("/me", requireAuth("bearer"), (req, res) => {
  res.json(dataEnvelope(req.auth, req.requestId));
});
