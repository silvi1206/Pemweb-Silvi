import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "../lib/auth/password";
import { hasPermission, requirePermission, type Role } from "../lib/auth/rbac";

describe("Security Milestone 2 — Password Hashing & Access Control Tests", () => {
  // Password Hashing Tests
  describe("Password Hashing (Slow Hashing & CSPRNG Salt)", () => {
    it("SEC-PWD-01: Password yang sama menghasilkan hash berbeda karena salt acak CSPRNG", async () => {
      const password = "RahasiaKeamananSiber2026!";
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      expect(hash1).not.toBe(hash2);
      expect(hash1.startsWith("scrypt$")).toBe(true);
      expect(hash2.startsWith("scrypt$")).toBe(true);
    });

    it("SEC-PWD-02: Verifikasi mengembalikan TRUE untuk password yang benar", async () => {
      const password = "SuperSecurePassword#99";
      const hash = await hashPassword(password);

      const isValid = await verifyPassword(password, hash);
      expect(isValid).toBe(true);
    });

    it("SEC-PWD-03: Verifikasi mengembalikan FALSE untuk password yang salah", async () => {
      const password = "SuperSecurePassword#99";
      const wrongPassword = "WrongPassword#99";
      const hash = await hashPassword(password);

      const isValid = await verifyPassword(wrongPassword, hash);
      expect(isValid).toBe(false);
    });

    it("SEC-PWD-04: Format hash yang rusak/termutilasi ditolak dengan aman (fail-closed)", async () => {
      const isValid1 = await verifyPassword("anyPass", "md5$invalid$format");
      expect(isValid1).toBe(false);

      const isValid2 = await verifyPassword("anyPass", "");
      expect(isValid2).toBe(false);
    });

    it("SEC-PWD-05: Password kosong ditolak saat hashing", async () => {
      await expect(hashPassword("")).rejects.toThrow(
        "Password harus berupa teks non-kosong."
      );
    });
  });

  // Access Control (RBAC) Tests
  describe("Role-Based Access Control (RBAC)", () => {
    it("SEC-RBAC-01: Peran 'guest' diizinkan menganalisis URL tetapi ditolak menghapus data", () => {
      const guestRole: Role = "guest";

      expect(hasPermission(guestRole, "analyze:url")).toBe(true);
      expect(hasPermission(guestRole, "history:read_public")).toBe(true);

      // Negative check
      expect(hasPermission(guestRole, "analysis:delete")).toBe(false);
      expect(hasPermission(guestRole, "indicator:create")).toBe(false);
    });

    it("SEC-RBAC-02: Peran 'user' diizinkan membuat analisis tetapi ditolak menghapus/mengedit indikator", () => {
      const userRole: Role = "user";

      expect(hasPermission(userRole, "analysis:create")).toBe(true);

      // Negative check
      expect(hasPermission(userRole, "analysis:delete")).toBe(false);
      expect(hasPermission(userRole, "indicator:delete")).toBe(false);
      expect(hasPermission(userRole, "analysis:update")).toBe(false);
    });

    it("SEC-RBAC-03: Peran 'admin' memiliki hak penuh terhadap seluruh operasi CRUD kedua entitas", () => {
      const adminRole: Role = "admin";

      expect(hasPermission(adminRole, "analysis:create")).toBe(true);
      expect(hasPermission(adminRole, "analysis:update")).toBe(true);
      expect(hasPermission(adminRole, "analysis:delete")).toBe(true);
      expect(hasPermission(adminRole, "indicator:create")).toBe(true);
      expect(hasPermission(adminRole, "indicator:update")).toBe(true);
      expect(hasPermission(adminRole, "indicator:delete")).toBe(true);
    });

    it("SEC-RBAC-04: requirePermission melempar error 403 Forbidden jika izin tidak terpenuhi", () => {
      const guestContext = { role: "guest" as Role };

      // Harus lolos
      expect(() =>
        requirePermission(guestContext, "analyze:url")
      ).not.toThrow();

      // Harus ditolak dengan pesan jelas
      expect(() =>
        requirePermission(guestContext, "analysis:delete")
      ).toThrowError(/Akses ditolak \(403 Forbidden\)/);
    });
  });
});
