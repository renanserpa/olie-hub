import { z } from "zod";

export const CODIGO_RE = /^[A-Z0-9_]{2,30}$/;

export const codigoSchema = z
  .string({ required_error: "Código é obrigatório" })
  .min(2, "Código deve ter pelo menos 2 caracteres")
  .max(30, "Código deve ter no máximo 30 caracteres")
  .regex(
    CODIGO_RE,
    "Use apenas letras maiúsculas, números e sublinhado (2-30 caracteres)",
  );

export const optionalTextSchema = z.string().trim().optional();

export const nullableTextSchema = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value && value.length > 0 ? value : null));

export const optionalNumberSchema = z.preprocess(
  (value) =>
    value === "" || value === null || value === undefined ? undefined : value,
  z.coerce
    .number({ invalid_type_error: "Informe um número válido" })
    .refine((value) => Number.isFinite(value), {
      message: "Informe um número válido",
    })
    .optional(),
);

export const optionalIntegerSchema = z.preprocess(
  (value) =>
    value === "" || value === null || value === undefined ? undefined : value,
  z.coerce
    .number({ invalid_type_error: "Informe um número inteiro" })
    .int({ message: "Informe um número inteiro" })
    .optional(),
);

export const jsonObjectStringSchema = z
  .string()
  .trim()
  .optional()
  .superRefine((value, ctx) => {
    if (!value) return;
    try {
      const parsed = JSON.parse(value);
      if (
        parsed === null ||
        Array.isArray(parsed) ||
        typeof parsed !== "object"
      ) {
        ctx.addIssue({
          code: "custom",
          message: "Informe um objeto JSON válido",
        });
      }
    } catch (error) {
      ctx.addIssue({ code: "custom", message: "JSON inválido" });
    }
  });

export const jsonArrayStringSchema = z
  .string()
  .trim()
  .optional()
  .superRefine((value, ctx) => {
    if (!value) return;
    try {
      const parsed = JSON.parse(value);
      if (!Array.isArray(parsed)) {
        ctx.addIssue({
          code: "custom",
          message: "Informe um array JSON válido",
        });
      }
    } catch (error) {
      ctx.addIssue({ code: "custom", message: "JSON inválido" });
    }
  });

export const jsonMetadataStringSchema = z
  .string()
  .trim()
  .optional()
  .superRefine((value, ctx) => {
    if (!value) return;
    try {
      const parsed = JSON.parse(value);
      if (
        parsed === null ||
        typeof parsed !== "object" ||
        Array.isArray(parsed)
      ) {
        ctx.addIssue({
          code: "custom",
          message: "Informe um objeto JSON válido",
        });
      }
    } catch (error) {
      ctx.addIssue({ code: "custom", message: "JSON inválido" });
    }
  });

export function toNullableString(value?: string | null) {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

export function parseJsonOrNull<T = Record<string, unknown>>(
  value?: string | null,
): T | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    return JSON.parse(trimmed) as T;
  } catch (error) {
    console.error("Falha ao converter JSON para objeto", error);
    return null;
  }
}

export function parseJsonArrayOrEmpty<T = unknown>(value?: string | null): T[] {
  if (!value) return [];
  const trimmed = value.trim();
  if (!trimmed) return [];
  try {
    const parsed = JSON.parse(trimmed);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch (error) {
    console.error("Falha ao converter JSON para array", error);
    return [];
  }
}

export function stringifyJson(value: unknown): string {
  if (value === null || value === undefined) return "";
  try {
    return JSON.stringify(value, null, 2);
  } catch (error) {
    return String(value);
  }
}
