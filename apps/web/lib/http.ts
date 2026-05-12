import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { AppError } from "@gestor/api";

export async function parseRequestJson<T>(request: Request): Promise<T> {
  return (await request.json()) as T;
}

export function serialize<T>(value: T): T {
  return JSON.parse(
    JSON.stringify(value, (_, current) => {
      if (current instanceof Date) {
        return current.toISOString();
      }

      return current;
    })
  ) as T;
}

export function ok(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function created(data: unknown) {
  return NextResponse.json(data, { status: 201 });
}

export function handleRouteError(error: unknown) {
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        error: {
          code: error.code,
          message: error.message
        }
      },
      { status: error.status }
    );
  }

  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid request payload",
          details: error.flatten()
        }
      },
      { status: 400 }
    );
  }

  if (error instanceof Error) {
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: error.message
        }
      },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      error: {
        code: "UNKNOWN_ERROR",
        message: "Unexpected error"
      }
    },
    { status: 500 }
  );
}

