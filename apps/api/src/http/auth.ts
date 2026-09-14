import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { createHash } from "crypto";
import type { UserRole } from "@coadjust/shared";
import { config } from "../config";
import { getItem } from "../db/repo";
import { keys } from "../db/keys";
import { AppError, unauthorized, forbidden } from "./errors";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  handlerId?: string;
  principal: "user" | "api_key";
}

declare global {
  namespace Express {
    interface Request {
      auth?: AuthUser;
      requestId: string;
    }
  }
}

export type SecurityMode = "bearer" | "apiKey" | "either";

function hashApiKey(raw: string) {
  return createHash("sha256").update(raw).digest("hex");
}

export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  try {
    const apiKey = req.header("X-API-Key");
    const authHeader = req.header("Authorization");

    if (apiKey) {
      const hash = hashApiKey(apiKey);
      const item = await getItem(`APIKEY#${hash}`, "META");
      if (!item) throw unauthorized("Invalid API key");
      req.auth = {
        id: String(item.principalId ?? "api"),
        email: String(item.name ?? "api-key"),
        name: String(item.name ?? "Integration"),
        role: "caio_governance",
        principal: "api_key",
      };
      return next();
    }

    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice(7);
      const payload = jwt.verify(token, config.jwtSecret) as {
        sub: string;
        email: string;
        name: string;
        role: UserRole;
        handlerId?: string;
      };
      req.auth = {
        id: payload.sub,
        email: payload.email,
        name: payload.name,
        role: payload.role,
        handlerId: payload.handlerId,
        principal: "user",
      };
      return next();
    }

    return next();
  } catch (err) {
    if (err instanceof AppError) return next(err);
    return next(unauthorized());
  }
}

export function requireAuth(mode: SecurityMode = "either") {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.auth) return next(unauthorized());
    if (mode === "bearer" && req.auth.principal !== "user") {
      return next(unauthorized("Bearer token required"));
    }
    if (mode === "apiKey" && req.auth.principal !== "api_key") {
      return next(unauthorized("API key required"));
    }
    return next();
  };
}

export function requirePurpose(purpose: string) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const p = String(req.query.purpose ?? "");
    if (p !== purpose) {
      return next(
        forbidden(
          `Handler-level evidence requires purpose=${purpose} (BR-12)`
        )
      );
    }
    return next();
  };
}

export function signToken(user: {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  handlerId?: string;
}) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      handlerId: user.handlerId,
    },
    config.jwtSecret,
    { expiresIn: "12h" }
  );
}

export { hashApiKey, keys };
