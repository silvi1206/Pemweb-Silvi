import { z } from "zod";

export const uuidSchema = z.string().uuid("ID analisis tidak valid.");

// Modul 7 (Perbaikan Galat 1 - Issue #11):
// Memakai z.stringbool() dari Zod 4 yang memetakan "true" -> true dan "false" -> false
// serta menolak nilai string lain (menggantikan z.coerce.boolean() yang keliru mengubah "false" menjadi true).
export const statusBooleanSchema = z.union([z.boolean(), z.stringbool()]);

export const urlSchema = z
  .string()
  .trim()
  .min(1, "URL tidak boleh kosong. Masukkan URL yang ingin diperiksa.")
  .url("Format URL tidak valid.")
  .refine(
    (value) => /^https?:\/\//i.test(value),
    "URL harus diawali dengan http:// atau https://",
  );

export const createIndicatorItemSchema = z.object({
  type: z
    .string()
    .trim()
    .min(1, "Tipe indikator tidak boleh kosong.")
    .max(50, "Tipe indikator maksimal 50 karakter."),
  status: z
    .string()
    .trim()
    .min(1, "Status indikator tidak boleh kosong.")
    .max(100, "Status indikator maksimal 100 karakter."),
  isAlert: z.boolean().default(false),
  detail: z
    .string()
    .trim()
    .min(1, "Detail indikator tidak boleh kosong.")
    .max(500, "Detail indikator maksimal 500 karakter."),
});

export const createAnalysisSchema = z.object({
  url: urlSchema,
  riskScore: z
    .number()
    .min(0, "riskScore minimal 0")
    .max(100, "riskScore maksimal 100"),
  isSafe: statusBooleanSchema,
  recommendation: z
    .string()
    .trim()
    .min(1, "recommendation tidak boleh kosong")
    .max(1000, "recommendation maksimal 1000 karakter."),
  sha256: z
    .string()
    .trim()
    .min(1, "sha256 tidak boleh kosong")
    .max(128, "sha256 tidak valid."),
  hmac: z
    .string()
    .trim()
    .min(1, "hmac tidak boleh kosong")
    .max(128, "hmac tidak valid."),
  encryptedNotes: z
    .string()
    .trim()
    .max(2000, "Catatan maksimal 2000 karakter.")
    .optional()
    .nullable(),
  indicators: z.array(createIndicatorItemSchema).optional(),
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
    isSafe: statusBooleanSchema.optional(),
    recommendation: z
      .string()
      .trim()
      .min(1, "recommendation tidak boleh kosong")
      .max(1000, "recommendation maksimal 1000 karakter.")
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
    encryptedNotes: z.string().trim().max(2000).optional().nullable(),
  })
  .strict()
  .refine(
    (data) => Object.keys(data).length > 0,
    "Setidaknya ada satu field yang harus diperbarui."
  );

export type UpdateAnalysisInput = z.infer<typeof updateAnalysisSchema>;

export const createIndicatorSchema = z.object({
  analysisId: uuidSchema,
  type: z
    .string()
    .trim()
    .min(1, "Tipe indikator tidak boleh kosong.")
    .max(50, "Tipe indikator maksimal 50 karakter."),
  status: z
    .string()
    .trim()
    .min(1, "Status indikator tidak boleh kosong.")
    .max(100, "Status indikator maksimal 100 karakter."),
  isAlert: z.boolean().default(false),
  detail: z
    .string()
    .trim()
    .min(1, "Detail indikator tidak boleh kosong.")
    .max(500, "Detail indikator maksimal 500 karakter."),
});

export type CreateIndicatorInput = z.infer<typeof createIndicatorSchema>;

export const updateIndicatorSchema = z
  .object({
    type: z
      .string()
      .trim()
      .min(1, "Tipe indikator tidak boleh kosong.")
      .max(50, "Tipe indikator maksimal 50 karakter.")
      .optional(),
    status: z
      .string()
      .trim()
      .min(1, "Status indikator tidak boleh kosong.")
      .max(100, "Status indikator maksimal 100 karakter.")
      .optional(),
    isAlert: z.boolean().optional(),
    detail: z
      .string()
      .trim()
      .min(1, "Detail indikator tidak boleh kosong.")
      .max(500, "Detail indikator maksimal 500 karakter.")
      .optional(),
  })
  .strict()
  .refine(
    (data) => Object.keys(data).length > 0,
    "Setidaknya ada satu field yang harus diperbarui."
  );

export type UpdateIndicatorInput = z.infer<typeof updateIndicatorSchema>;

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Nama minimal 2 karakter.")
    .max(100, "Nama maksimal 100 karakter."),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Format email tidak valid.")
    .max(150, "Email maksimal 150 karakter."),
  password: z
    .string()
    .min(8, "Password minimal 8 karakter.")
    .max(100, "Password maksimal 100 karakter.")
    .regex(/[a-z]/, "Password harus memiliki setidaknya satu huruf kecil.")
    .regex(/[A-Z]/, "Password harus memiliki setidaknya satu huruf besar.")
    .regex(/[0-9]/, "Password harus memiliki setidaknya satu angka."),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Format email tidak valid."),
  password: z
    .string()
    .min(1, "Password tidak boleh kosong."),
});

export type LoginInput = z.infer<typeof loginSchema>;

/**
 * Skema FormData untuk pembaruan entitas Analysis (Modul 7 - Perbaikan Galat 1).
 * Menggunakan z.stringbool() dari Zod 4 agar nilai select "false" dipetakan ke boolean false,
 * bukan true seperti pada z.coerce.boolean().
 */
export const skemaUpdateAnalisisForm = z.object({
  riskScore: z.coerce
    .number()
    .int("riskScore harus berupa bilangan bulat")
    .min(0, "riskScore minimal 0")
    .max(100, "riskScore maksimal 100"),
  recommendation: z
    .string()
    .trim()
    .min(3, "Rekomendasi minimal 3 karakter.")
    .max(1000, "Rekomendasi maksimal 1000 karakter."),
  encryptedNotes: z.string().trim().max(2000).optional(),
  // "true" -> true, "false" -> false; nilai lain menjadi galat validasi
  isSafe: z.stringbool(),
});

export type MasukanUpdateAnalisisForm = z.infer<typeof skemaUpdateAnalisisForm>;

