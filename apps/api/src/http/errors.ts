import type { Problem } from "@coadjust/shared";

export class AppError extends Error {
  status: number;
  type: string;
  title: string;
  detail?: string;

  constructor(status: number, title: string, detail?: string, type?: string) {
    super(detail ?? title);
    this.status = status;
    this.title = title;
    this.detail = detail;
    this.type = type ?? `https://coadjust.local/problems/${status}`;
  }

  toProblem(): Problem {
    return {
      type: this.type,
      title: this.title,
      status: this.status,
      detail: this.detail,
    };
  }
}

export function unauthorized(detail = "Missing or invalid credentials") {
  return new AppError(401, "Unauthorized", detail);
}

export function notFound(detail = "Resource not found") {
  return new AppError(404, "Not Found", detail);
}

export function conflict(detail: string) {
  return new AppError(409, "Conflict", detail);
}

export function unprocessable(detail: string) {
  return new AppError(422, "Unprocessable Entity", detail);
}

export function forbidden(detail: string) {
  return new AppError(403, "Forbidden", detail);
}
