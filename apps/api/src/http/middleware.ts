import type { NextFunction, Request, Response } from "express";
import { randomUUID } from "crypto";
import { AppError } from "./errors";

export function requestId(req: Request, res: Response, next: NextFunction) {
  req.requestId = (req.header("x-request-id") as string) || randomUUID();
  res.setHeader("x-request-id", req.requestId);
  next();
}

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof AppError) {
    return res.status(err.status).json(err.toProblem());
  }
  console.error(err);
  return res.status(500).json({
    type: "https://coadjust.local/problems/500",
    title: "Internal Server Error",
    status: 500,
    detail: err instanceof Error ? err.message : "Unexpected error",
  });
}
