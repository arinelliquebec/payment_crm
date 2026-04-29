import { NextResponse } from "next/server";
import logger from "@/lib/logger";

export type ApiErrorType =
  | "validation_error"
  | "config_error"
  | "auth_error"
  | "upstream_error"
  | "network_error"
  | "timeout_error";

export interface ApiErrorBody {
  error: string;
  type: ApiErrorType;
  status: number;
  requestId: string;
  upstreamStatus?: number;
  details?: unknown;
}

const newRequestId = () => {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
};

export const errorResponse = (
  status: number,
  body: Omit<ApiErrorBody, "status" | "requestId"> & { requestId?: string },
) => {
  const requestId = body.requestId ?? newRequestId();
  const payload: ApiErrorBody = { ...body, status, requestId };

  if (status >= 500) {
    logger.error(`[API Error] ${payload.type} ${status} requestId=${requestId}`);
  } else {
    logger.warn(`[API Error] ${payload.type} ${status} requestId=${requestId}`);
  }

  return NextResponse.json(payload, { status });
};

export const upstreamErrorResponse = async (
  upstreamResponse: Response,
  opts: {
    error: string;
    requestId?: string;
  },
) => {
  const requestId = opts.requestId ?? newRequestId();
  const contentType = upstreamResponse.headers.get("content-type") ?? "";

  let details: unknown;
  try {
    if (contentType.includes("application/json")) {
      details = await upstreamResponse.json();
    } else {
      details = { raw: await upstreamResponse.text() };
    }
  } catch {
    details = { raw: "<unreadable>" };
  }

  return errorResponse(upstreamResponse.status, {
    error: opts.error,
    type: "upstream_error",
    upstreamStatus: upstreamResponse.status,
    details,
    requestId,
  });
};

export const exceptionToErrorResponse = (
  error: unknown,
  fallbackMessage: string,
  status = 502,
  requestId?: string,
) => {
  const err = error as any;
  const name = typeof err?.name === "string" ? err.name : "";

  if (name === "TimeoutError" || name === "AbortError") {
    return errorResponse(504, {
      error: "Tempo limite na requisição.",
      type: "timeout_error",
      details: { message: err?.message },
      requestId,
    });
  }

  return errorResponse(status, {
    error: fallbackMessage,
    type: "network_error",
    details: { message: err?.message ?? String(error) },
    requestId,
  });
};
