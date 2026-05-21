// Lightweight, dependency-free request-body validation helpers.
// Each helper throws ValidationError on bad input; route handlers catch and
// return 400 via the centralized error response.

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function requireString(
  value: unknown,
  field: string,
  opts: { min?: number; max?: number; pattern?: RegExp } = {},
): string {
  if (typeof value !== "string") throw new ValidationError(`${field} must be a string`);
  const min = opts.min ?? 1;
  const max = opts.max ?? 10_000;
  if (value.length < min) throw new ValidationError(`${field} too short (min ${min})`);
  if (value.length > max) throw new ValidationError(`${field} too long (max ${max})`);
  if (opts.pattern && !opts.pattern.test(value)) throw new ValidationError(`${field} format invalid`);
  return value;
}

export function optionalString(
  value: unknown,
  field: string,
  opts: { max?: number; pattern?: RegExp } = {},
): string | undefined {
  if (value === undefined || value === null) return undefined;
  return requireString(value, field, { min: 0, ...opts });
}

export function requireUuid(value: unknown, field: string): string {
  const s = requireString(value, field, { min: 36, max: 36 });
  if (!UUID_RE.test(s)) throw new ValidationError(`${field} must be a UUID`);
  return s;
}

export function optionalUuid(value: unknown, field: string): string | undefined {
  if (value === undefined || value === null) return undefined;
  return requireUuid(value, field);
}

export function requireNumber(
  value: unknown,
  field: string,
  opts: { min?: number; max?: number; integer?: boolean } = {},
): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new ValidationError(`${field} must be a finite number`);
  }
  if (opts.integer && !Number.isInteger(value)) throw new ValidationError(`${field} must be an integer`);
  if (opts.min !== undefined && value < opts.min) throw new ValidationError(`${field} below min ${opts.min}`);
  if (opts.max !== undefined && value > opts.max) throw new ValidationError(`${field} above max ${opts.max}`);
  return value;
}

export function optionalNumber(
  value: unknown,
  field: string,
  opts: { min?: number; max?: number; integer?: boolean } = {},
): number | undefined {
  if (value === undefined || value === null) return undefined;
  return requireNumber(value, field, opts);
}

export function requireEnum<T extends string>(value: unknown, field: string, allowed: readonly T[]): T {
  if (typeof value !== "string" || !allowed.includes(value as T)) {
    throw new ValidationError(`${field} must be one of: ${allowed.join(", ")}`);
  }
  return value as T;
}

export function optionalEnum<T extends string>(
  value: unknown,
  field: string,
  allowed: readonly T[],
): T | undefined {
  if (value === undefined || value === null) return undefined;
  return requireEnum(value, field, allowed);
}

export function requireBool(value: unknown, field: string): boolean {
  if (typeof value !== "boolean") throw new ValidationError(`${field} must be a boolean`);
  return value;
}

export function optionalBool(value: unknown, field: string): boolean | undefined {
  if (value === undefined || value === null) return undefined;
  return requireBool(value, field);
}

export function requireObject(value: unknown, field: string): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new ValidationError(`${field} must be an object`);
  }
  return value as Record<string, unknown>;
}

/** Keep only the named keys; values keep their original types (no validation). */
export function pickKeys<T extends Record<string, unknown>>(
  source: Record<string, unknown>,
  keys: readonly (keyof T)[],
): Partial<T> {
  const out: Partial<T> = {};
  for (const k of keys) {
    const key = k as string;
    if (key in source) (out as Record<string, unknown>)[key] = source[key];
  }
  return out;
}

/** Wraps the await req.json() and returns an empty object on parse failure
 *  (validators will fail later with clearer messages). */
export async function parseJson(req: Request): Promise<Record<string, unknown>> {
  try {
    const j = await req.json();
    if (j === null || typeof j !== "object" || Array.isArray(j)) return {};
    return j as Record<string, unknown>;
  } catch {
    return {};
  }
}
