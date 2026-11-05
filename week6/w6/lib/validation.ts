import { z } from "zod";

export const uuidSchema = z.string().uuid("ID analisis tidak valid.");

export const urlSchema = z
  .string()
  .trim()
  .min(1, "URL tidak boleh kosong. Masukkan URL yang ingin diperiksa.")
  .url("Format URL tidak valid.")
  .refine(
    (value) => /^https?:\/\//i.test(value),
    "URL harus diawali dengan http:// atau https://",
  );

export const createAnalysisSchema = z.object({
  url: urlSchema,
  riskScore: z
    .number()
    .min(0, "riskScore minimal 0")
    .max(100, "riskScore maksimal 100"),
  isSafe: z.boolean(),
  recommendation: z
    .string()
    .trim()
    .min(1, "recommendation tidak boleh kosong"),
  sha256: z
    .string()
    .trim()
    .min(1, "sha256 tidak boleh kosong"),
  hmac: z
    .string()
    .trim()
    .min(1, "hmac tidak boleh kosong"),
});

export type CreateAnalysisInput = z.infer<typeof createAnalysisSchema>;

export const updateAnalysisSchema = z
  .object({
    url: urlSchema.optional(),
    riskScore: z
      .number()
      .int("riskScore harus berupa bilangan bulat")
      .min(0, "riskScore minimal 0")
      .max(100, "riskScore maksimal 100")
      .optional(),
    isSafe: z.boolean().optional(),
    recommendation: z
      .string()
      .trim()
      .min(1, "recommendation tidak boleh kosong")
      .optional(),
    sha256: z
      .string()
      .trim()
      .min(1, "sha256 tidak boleh kosong")
      .optional(),
    hmac: z
      .string()
      .trim()
      .min(1, "hmac tidak boleh kosong")
      .optional(),
  })
  .strict()
  .refine(
    (data) => Object.keys(data).length > 0,
    "Setidaknya ada satu field yang harus diperbarui."
  );

export type UpdateAnalysisInput = z.infer<typeof updateAnalysisSchema>;
