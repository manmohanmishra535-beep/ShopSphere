export class ClientApiError extends Error {
  status: number;
  code: string;
  details: unknown[];

  constructor(status: number, message: string, code = "API_ERROR", details: unknown[] = []) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

type Options = Omit<RequestInit, "body"> & { body?: unknown };

export async function api<T>(path: string, options: Options = {}): Promise<T> {
  const { body, headers, ...rest } = options;
  const res = await fetch(`/api/v1${path}`, {
    ...rest,
    credentials: "include",
    headers: {
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(headers ?? {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  const text = await res.text();
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }

  if (!res.ok) {
    const error = (json as { error?: { message?: string; code?: string; details?: unknown[] } } | null)?.error;
    throw new ClientApiError(
      res.status,
      error?.message ?? "Something went wrong. Please try again.",
      error?.code ?? "API_ERROR",
      error?.details ?? []
    );
  }
  return json as T;
}

export function errorMessage(error: unknown): string {
  if (error instanceof ClientApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "Something went wrong. Please try again.";
}
