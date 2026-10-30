import { z } from "zod";

export const urlSchema = z
  .string()
  .trim()
  .min(1, "URL tidak boleh kosong. Masukkan URL yang ingin diperiksa.")
  .url("Format URL tidak valid.")
  .refine(
    (value) => /^https?:\/\//i.test(value),
    "URL harus diawali dengan http:// atau https://",
  );
