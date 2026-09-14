import type { DataEnvelope, ListEnvelope, ResponseMeta } from "@coadjust/shared";
import { randomUUID } from "crypto";

export function meta(requestId?: string): ResponseMeta {
  return {
    requestId: requestId ?? randomUUID(),
    timestamp: new Date().toISOString(),
  };
}

export function dataEnvelope<T>(data: T, requestId?: string): DataEnvelope<T> {
  return { data, meta: meta(requestId) };
}

export function listEnvelope<T>(
  items: T[],
  nextCursor?: string,
  requestId?: string
): ListEnvelope<T> {
  return {
    data: nextCursor ? { items, nextCursor } : { items },
    meta: meta(requestId),
  };
}
