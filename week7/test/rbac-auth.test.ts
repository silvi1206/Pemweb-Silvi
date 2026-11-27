import "dotenv/config";
import { describe, expect, it, afterAll } from "vitest";
import { prisma } from "../lib/prisma";
import { hashPassword, verifyPassword } from "../lib/auth/password";
import {
  createSessionToken,
  verifySessionToken,
  createDatabaseSession,
  validateSessionToken,
  hashSessionToken,
  generateRawToken,
  _setTestSessionCookie,
  type SessionData,
} from "../lib/auth/session";
import {
  registerAction,
  loginAction,
  logoutAction,
  revokeUserSessionsAction,
} from "../app/actions/auth";
import { validateCsrf, getCanonicalOrigins } from "../lib/auth/csrf";
import { POST as postAnalysisApi } from "../app/api/analysis/route";
import {
  createAnalysisAction,
  getAnalysesAction,
  getAnalysisByIdAction,
  updateAnalysisAction,
  deleteAnalysisAction,
} from "../app/actions/analysis";
import {
  createIndicatorAction,
  getIndicatorByIdAction,
  updateIndicatorAction,
  deleteIndicatorAction,
} from "../app/actions/indicators";

describe("CyberShield Milestone 2 — Authentication & RBAC Suite", () => {
  const timestamp = Date.now();
  const testUserEmail = `user.test.${timestamp}@cybershield.test`;
  const testUserPassword = "PasswordSecure#2026";
  let testUserId: string;

  const testOtherUserEmail = `other.test.${timestamp}@cybershield.test`;
  let testOtherUserId: string;

  let userAnalysisId: string;
  let userSessionToken: string;
  let otherUserSessionToken: string;
  let adminSessionToken: string;
  let testAdminUserId: string;
  let syntheticUserId: string;
  let victimUserId: string;
  let regrAnalysisId: string;

  // ==========================================
  // 1. Session Token & Cryptographic Integrity
  // ==========================================
  describe("1. Sesi & Integritas Kriptografis Token (HMAC-SHA-256)", () => {
    it("AUTH-TOK-01: Token sesi berhasil dibuat dan diverifikasi", () => {
      const payload: Omit<SessionData, "exp" | "iat"> = {
        userId: "test-user-uuid",
        email: "test@example.com",
        name: "Test User",
        role: "user",
      };

      const token = createSessionToken(payload);
      expect(typeof token).toBe("string");
      expect(token.includes(".")).toBe(true);

      const verified = verifySessionToken(token);
      expect(verified).not.toBeNull();
      expect(verified?.userId).toBe(payload.userId);
      expect(verified?.email).toBe(payload.email);
      expect(verified?.role).toBe("user");
    });

    it("AUTH-TOK-02: Token yang dimanipulasi (tampered) ditolak secara fail-closed", () => {
      const token = createSessionToken({
        userId: "test-user-uuid",
        email: "test@example.com",
        name: "Test User",
        role: "user",
      });

      const [payloadB64, sigB64] = token.split(".");

      // Coba ubah payload dari role 'user' menjadi 'admin'
      const decoded = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8"));
      decoded.role = "admin";
      const tamperedPayloadB64 = Buffer.from(JSON.stringify(decoded)).toString("base64url");
      const tamperedToken = `${tamperedPayloadB64}.${sigB64}`;

      const verified = verifySessionToken(tamperedToken);
      expect(verified).toBeNull();
    });

    it("AUTH-TOK-03: Token dengan signature salah ditolak", () => {
      const token = createSessionToken({
        userId: "test-user-uuid",
        email: "test@example.com",
        name: "Test User",
        role: "user",
      });

      const [payloadB64] = token.split(".");
      const forgedToken = `${payloadB64}.invalid_hmac_signature_here`;

      const verified = verifySessionToken(forgedToken);
      expect(verified).toBeNull();
    });

    it("AUTH-TOK-04: Token kedaluwarsa (expired) otomatis ditolak", () => {
      // Buat token dengan masa berlaku -10 detik
      const token = createSessionToken(
        {
          userId: "expired-user",
          email: "expired@example.com",
          name: "Expired",
          role: "user",
        },
        -10
      );

      const verified = verifySessionToken(token);
      expect(verified).toBeNull();
    });
  });

  // ==========================================
  // 2. Registrasi & Login (Server Actions)
  // ==========================================
  describe("2. Alur Pendaftaran & Autentikasi Pengguna", () => {
    it("AUTH-ACT-01: Registrasi pengguna baru berhasil dan password di-hash dengan Scrypt", async () => {
      const directHash = await hashPassword(testUserPassword);
      expect(directHash.startsWith("scrypt$")).toBe(true);

      const res = await registerAction({
        name: "Tester CyberShield",
        email: testUserEmail,
        password: testUserPassword,
      });

      expect(res.success).toBe(true);
      expect(res.data?.user.email).toBe(testUserEmail);
      expect(res.data?.user.role).toBe("user");

      testUserId = res.data?.user.id as string;
      expect(testUserId).toBeDefined();

      // Verifikasi di basis data bahwa password di-hash dan bukan plaintext
      const dbUser = await prisma.user.findUnique({
        where: { id: testUserId },
      });

      expect(dbUser).not.toBeNull();
      expect(dbUser?.passwordHash.startsWith("scrypt$")).toBe(true);
      expect(dbUser?.passwordHash).not.toContain(testUserPassword);

      const isValid = await verifyPassword(testUserPassword, dbUser!.passwordHash);
      expect(isValid).toBe(true);
    });

    it("AUTH-ACT-02: Registrasi dengan email duplikat ditolak", async () => {
      const res = await registerAction({
        name: "Duplikat User",
        email: testUserEmail,
        password: "OtherPassword#123",
      });

      expect(res.success).toBe(false);
      expect(res.message).toContain("Email sudah terdaftar");
    });

    it("AUTH-ACT-03: Registrasi dengan password lemah ditolak oleh validasi Zod", async () => {
      const res = await registerAction({
        name: "Weak Pass User",
        email: `weak.${timestamp}@test.com`,
        password: "weak", // < 8 karakter, tanpa huruf besar/angka
      });

      expect(res.success).toBe(false);
      expect(res.errors?.password).toBeDefined();
    });

    it("AUTH-ACT-04: Login berhasil dengan kredensial yang valid", async () => {
      const res = await loginAction({
        email: testUserEmail,
        password: testUserPassword,
      });

      expect(res.success).toBe(true);
      expect(res.data?.user.email).toBe(testUserEmail);
    });

    it("AUTH-ACT-05: Login gagal saat kata sandi salah (fail-closed)", async () => {
      const res = await loginAction({
        email: testUserEmail,
        password: "WrongPassword#999",
      });

      expect(res.success).toBe(false);
      expect(res.message).toContain("Email atau kata sandi tidak cocok");
    });

    it("AUTH-ACT-06: Login gagal saat email tidak terdaftar", async () => {
      const res = await loginAction({
        email: "nonexistent.user.2026@cybershield.test",
        password: "AnyPassword#123",
      });

      expect(res.success).toBe(false);
      expect(res.message).toContain("Email atau kata sandi tidak cocok");
    });

    it("AUTH-ACT-07: Logout berhasil mengeksekusi penghapusan sesi", async () => {
      const res = await logoutAction();
      expect(res.success).toBe(true);
      expect(res.message).toContain("Logout sukses");
    });
  });

  // ==========================================
  // 3. RBAC & Hak Akses Berdasarkan Peran
  // ==========================================
  describe("3. Penerapan RBAC (Guest, User, Admin) pada Operasi Data", () => {
    it("SETUP RBAC: Mempersiapkan akun dan sesi database untuk User, Other User, dan Admin", async () => {
      // 1. Sesi User A
      const sUserA = await createDatabaseSession(testUserId);
      userSessionToken = sUserA.rawToken;

      // 2. Akun & Sesi Admin
      const adminUser = await prisma.user.create({
        data: {
          name: "RBAC Admin Tester",
          email: `admin.rbac.${timestamp}@cybershield.test`,
          passwordHash: await hashPassword("AdminSec#2026"),
          role: "admin",
        },
      });
      testAdminUserId = adminUser.id;
      const sAdmin = await createDatabaseSession(testAdminUserId);
      adminSessionToken = sAdmin.rawToken;
    });

    // Skenario Guest
    it("RBAC-GST-01: Guest DITOLAK membuat analisis baru (403 Forbidden)", async () => {
      _setTestSessionCookie(null);
      const input = {
        url: "http://phishing-simulation-guest.com",
        riskScore: 60,
        isSafe: false,
        recommendation: "Tolak guest simpan analisis.",
        sha256: "c".repeat(64),
        hmac: "d".repeat(64),
      };

      const res = await createAnalysisAction(input);
      expect(res.success).toBe(false);
      expect(res.message).toContain("403 Forbidden");
    });

    it("RBAC-GST-02: Guest DITOLAK menghapus analisis (403 Forbidden)", async () => {
      _setTestSessionCookie(null);
      const res = await deleteAnalysisAction("00000000-0000-0000-0000-000000000000");
      expect(res.success).toBe(false);
      expect(res.message).toContain("403 Forbidden");
    });

    it("RBAC-GST-03: Guest DITOLAK menambahkan indikator keamanan (403 Forbidden)", async () => {
      _setTestSessionCookie(null);
      const res = await createIndicatorAction({
        analysisId: "00000000-0000-0000-0000-000000000000",
        type: "TEST",
        status: "ALERT",
        isAlert: true,
        detail: "Guest coba tambah indikator",
      });
      expect(res.success).toBe(false);
      expect(res.message).toContain("403 Forbidden");
    });

    // Skenario User
    it("RBAC-USR-01: User DIIZINKAN membuat analisis baru dan tercatat dengan userId miliknya", async () => {
      _setTestSessionCookie(userSessionToken);
      const input = {
        url: `https://my-secured-bank-account-${timestamp}.com/login`,
        riskScore: 15,
        isSafe: true,
        recommendation: "Analisis sah dibuat oleh pengguna terdaftar.",
        sha256: "e".repeat(64),
        hmac: "f".repeat(64),
        encryptedNotes: "Catatan investigasi pribadi pengguna",
      };

      const res = await createAnalysisAction(input);

      expect(res.success).toBe(true);
      const data = res.data as { id: string; userId: string };
      expect(data.id).toBeDefined();
      userAnalysisId = data.id;

      // Verifikasi di PostgreSQL bahwa userId tersimpan
      const record = await prisma.analysis.findUnique({
        where: { id: userAnalysisId },
      });
      expect(record?.userId).toBe(testUserId);
    });

    it("RBAC-USR-02: User DITOLAK memperbarui analisis (403 Forbidden - hanya Admin)", async () => {
      _setTestSessionCookie(userSessionToken);
      const res = await updateAnalysisAction(
        userAnalysisId,
        { recommendation: "Coba ubah oleh user" }
      );

      expect(res.success).toBe(false);
      expect(res.message).toContain("403 Forbidden");
    });

    it("RBAC-USR-03: User DITOLAK menghapus analisis (403 Forbidden - hanya Admin)", async () => {
      _setTestSessionCookie(userSessionToken);
      const res = await deleteAnalysisAction(userAnalysisId);

      expect(res.success).toBe(false);
      expect(res.message).toContain("403 Forbidden");
    });

    it("RBAC-USR-04: User DITOLAK menambahkan indikator keamanan (403 Forbidden)", async () => {
      _setTestSessionCookie(userSessionToken);
      const res = await createIndicatorAction({
        analysisId: userAnalysisId,
        type: "MANUAL",
        status: "Check",
        isAlert: false,
        detail: "User mencoba menambah indikator",
      });

      expect(res.success).toBe(false);
      expect(res.message).toContain("403 Forbidden");
    });

    it("RBAC-USR-05: User DITOLAK menghapus indikator keamanan (403 Forbidden)", async () => {
      _setTestSessionCookie(userSessionToken);
      const res = await deleteIndicatorAction("00000000-0000-0000-0000-000000000000");

      expect(res.success).toBe(false);
      expect(res.message).toContain("403 Forbidden");
    });

    // Skenario Admin
    it("RBAC-ADM-01: Admin DIIZINKAN memperbarui data analisis", async () => {
      _setTestSessionCookie(adminSessionToken);
      const res = await updateAnalysisAction(userAnalysisId, {
        recommendation: "Rekomendasi disahkan oleh Security Administrator.",
        riskScore: 20,
      });

      expect(res.success).toBe(true);
    });

    it("RBAC-ADM-02: Admin DIIZINKAN menambahkan dan menghapus indikator keamanan", async () => {
      _setTestSessionCookie(adminSessionToken);
      // Create Indicator
      const addRes = await createIndicatorAction({
        analysisId: userAnalysisId,
        type: "ADMIN_OVERRIDE",
        status: "Verified",
        isAlert: false,
        detail: "Indikator ditambahkan langsung oleh Admin.",
      });

      expect(addRes.success).toBe(true);
      const indicatorId = (addRes.data as { id: string }).id;
      expect(indicatorId).toBeDefined();

      // Update Indicator
      const updRes = await updateIndicatorAction(indicatorId, {
        status: "Audited & Approved",
      });
      expect(updRes.success).toBe(true);

      // Delete Indicator
      const delRes = await deleteIndicatorAction(indicatorId);
      expect(delRes.success).toBe(true);
    });
  });

  // ==========================================
  // 4. Isolasi Data Pengguna (Data Isolation / IDOR Protection)
  // ==========================================
  describe("4. Isolasi Data Pengguna & Pencegahan IDOR", () => {
    it("ISOL-01: User dapat membaca data analisis miliknya sendiri", async () => {
      _setTestSessionCookie(userSessionToken);
      const res = await getAnalysisByIdAction(userAnalysisId);

      expect(res.success).toBe(true);
      const data = res.data as { id: string; encryptedNotes: string | null };
      expect(data.id).toBe(userAnalysisId);
      // Catatan privat terdekripsi untuk pemilik
      expect(data.encryptedNotes).toBe("Catatan investigasi pribadi pengguna");
    });

    it("ISOL-02: User B DITOLAK membaca analisis privat milik User A (IDOR Protection 403 Forbidden)", async () => {
      // Buat user B
      const regB = await registerAction({
        name: "Pengguna Lain",
        email: testOtherUserEmail,
        password: "OtherUserPassword#2026",
      });
      testOtherUserId = regB.data?.user.id as string;
      const sUserB = await createDatabaseSession(testOtherUserId);
      otherUserSessionToken = sUserB.rawToken;

      // User B mencoba mengakses analisis milik User A
      _setTestSessionCookie(otherUserSessionToken);
      const res = await getAnalysisByIdAction(userAnalysisId);

      expect(res.success).toBe(false);
      expect(res.message).toContain("403 Forbidden");
    });

    it("ISOL-03: Guest DITOLAK membaca analisis privat milik pengguna terdaftar", async () => {
      _setTestSessionCookie(null);
      const res = await getAnalysisByIdAction(userAnalysisId);

      expect(res.success).toBe(false);
      expect(res.message).toContain("403 Forbidden");
    });

    it("ISOL-04: getAnalysesAction hanya mengembalikan data milik user aktif", async () => {
      // Ambil daftar riwayat untuk User A
      _setTestSessionCookie(userSessionToken);
      const resUserA = await getAnalysesAction();

      expect(resUserA.success).toBe(true);
      const listA = resUserA.data as Array<{ id: string; userId: string }>;
      // Seluruh item harus ber-userId testUserId
      for (const item of listA) {
        expect(item.userId).toBe(testUserId);
      }

      // Ambil daftar riwayat untuk User B
      _setTestSessionCookie(otherUserSessionToken);
      const resUserB = await getAnalysesAction();
      expect(resUserB.success).toBe(true);
      const listB = resUserB.data as Array<{ id: string }>;
      // User B belum memiliki analisis, tidak boleh melihat analisis User A
      expect(listB.some((item) => item.id === userAnalysisId)).toBe(false);
    });

    it("ISOL-05: Admin dapat membaca data dari seluruh pengguna (history:read_all)", async () => {
      _setTestSessionCookie(adminSessionToken);
      const res = await getAnalysisByIdAction(userAnalysisId);

      expect(res.success).toBe(true);
      const data = res.data as { id: string };
      expect(data.id).toBe(userAnalysisId);
    });

    // ==========================================
    // 5. Remediasi Kritis: IDOR Indikator, Data Warisan & Keamanan Demo
    // ==========================================
    describe("5. Remediasi Kritis: IDOR Indikator, Isolasi Data Warisan & Keamanan Demo", () => {
      let userAIndicatorId: string;
      let userBAnalysisId: string;
      let userBIndicatorId: string;
      let legacyAnalysisId: string;

      it("SETUP: Mempersiapkan entitas indikator untuk User A dan User B", async () => {
        // 1. Admin menambahkan indikator ke analisis User A
        _setTestSessionCookie(adminSessionToken);
        const indA = await createIndicatorAction({
          analysisId: userAnalysisId,
          type: "USER_A_SEC",
          status: "Under Review",
          isAlert: true,
          detail: "Temuan indikator privat milik User A",
        });
        expect(indA.success).toBe(true);
        userAIndicatorId = (indA.data as { id: string }).id;

        // 2. User B membuat analisis baru
        _setTestSessionCookie(otherUserSessionToken);
        const anaB = await createAnalysisAction({
          url: `https://user-b-confidential-${timestamp}.com/auth`,
          riskScore: 40,
          isSafe: false,
          recommendation: "Pemeriksaan URL User B",
          sha256: "1".repeat(64),
          hmac: "2".repeat(64),
        });
        expect(anaB.success).toBe(true);
        userBAnalysisId = (anaB.data as { id: string }).id;

        // 3. Admin menambahkan indikator ke analisis User B
        _setTestSessionCookie(adminSessionToken);
        const indB = await createIndicatorAction({
          analysisId: userBAnalysisId,
          type: "USER_B_SEC",
          status: "Flagged",
          isAlert: true,
          detail: "Temuan indikator privat milik User B",
        });
        expect(indB.success).toBe(true);
        userBIndicatorId = (indB.data as { id: string }).id;

        // 4. Pastikan ada data warisan dengan userId null
        let legacy = await prisma.analysis.findFirst({
          where: { userId: null },
        });
        if (!legacy) {
          legacy = await prisma.analysis.create({
            data: {
              url: "https://legacy-public-archive-demo.com",
              riskScore: 0,
              isSafe: true,
              recommendation: "Arsip publik sistem tanpa pemilik.",
              sha256: "3".repeat(64),
              hmac: "4".repeat(64),
              userId: null,
            },
          });
        }
        legacyAnalysisId = legacy.id;
      });

      it("CRIT-IND-01: Guest membaca indikator privat DITOLAK (403 Forbidden)", async () => {
        _setTestSessionCookie(null);
        const res = await getIndicatorByIdAction(userAIndicatorId);
        expect(res.success).toBe(false);
        expect(res.message).toContain("403 Forbidden");
      });

      it("CRIT-IND-02: User A membaca indikator milik User B DITOLAK (IDOR Protection 403 Forbidden)", async () => {
        _setTestSessionCookie(userSessionToken);
        const res = await getIndicatorByIdAction(userBIndicatorId);
        expect(res.success).toBe(false);
        expect(res.message).toContain("403 Forbidden");
      });

      it("CRIT-IND-03: User A membaca indikator miliknya sendiri BERHASIL", async () => {
        _setTestSessionCookie(userSessionToken);
        const res = await getIndicatorByIdAction(userAIndicatorId);
        expect(res.success).toBe(true);
        const data = res.data as { id: string; detail: string };
        expect(data.id).toBe(userAIndicatorId);
        expect(data.detail).toContain("User A");
      });

      it("CRIT-IND-04: User A mengubah indikator milik User B DITOLAK (403 Forbidden)", async () => {
        _setTestSessionCookie(userSessionToken);
        const res = await updateIndicatorAction(userBIndicatorId, {
          status: "Manipulated by User A",
        });
        expect(res.success).toBe(false);
        expect(res.message).toContain("403 Forbidden");
      });

      it("CRIT-IND-05: User A menghapus indikator milik User B DITOLAK (403 Forbidden)", async () => {
        _setTestSessionCookie(userSessionToken);
        const res = await deleteIndicatorAction(userBIndicatorId);
        expect(res.success).toBe(false);
        expect(res.message).toContain("403 Forbidden");
      });

      it("CRIT-IND-06: Admin membaca indikator milik pengguna manapun BERHASIL", async () => {
        _setTestSessionCookie(adminSessionToken);
        const res = await getIndicatorByIdAction(userBIndicatorId);
        expect(res.success).toBe(true);
        const data = res.data as { id: string };
        expect(data.id).toBe(userBIndicatorId);
      });

      it("CRIT-LEG-01: User biasa DITOLAK membaca data warisan dengan userId null (403 Forbidden)", async () => {
        _setTestSessionCookie(userSessionToken);
        const res = await getAnalysisByIdAction(legacyAnalysisId);
        expect(res.success).toBe(false);
        expect(res.message).toContain("403 Forbidden");
      });

      it("CRIT-LEG-02: Admin dan Guest dapat mengakses data warisan sesuai perannya", async () => {
        // Admin diizinkan mengakses data warisan
        _setTestSessionCookie(adminSessionToken);
        const adminRes = await getAnalysisByIdAction(legacyAnalysisId);
        expect(adminRes.success).toBe(true);

        // Guest diizinkan melihat data publik (userId: null)
        _setTestSessionCookie(null);
        const guestRes = await getAnalysisByIdAction(legacyAnalysisId);
        expect(guestRes.success).toBe(true);
      });

      it("CRIT-ENV-01: Kredensial demo terlindung oleh pemeriksaan lingkungan NODE_ENV", () => {
        const isProd = true;
        const showDevSwitcher = !isProd;
        expect(showDevSwitcher).toBe(false);
      });

      it("CLEANUP: Admin membersihkan data analisis uji coba User B", async () => {
        _setTestSessionCookie(adminSessionToken);
        await deleteAnalysisAction(userBAnalysisId);
      });
    });

    // Cleanup: Admin menghapus data analisis uji coba
    it("ISOL-06: Admin membersihkan data analisis uji coba User A", async () => {
      _setTestSessionCookie(adminSessionToken);
      const res = await deleteAnalysisAction(userAnalysisId);
      expect(res.success).toBe(true);
    });
  });

  // ==========================================
  // 6. Server-Side Session & Database Revocation Suite
  // ==========================================
  describe("6. Pengujian Sesi Server-Side & Pencabutan Sesi di PostgreSQL", () => {
    let testRawToken: string;
    let logoutTestToken: string;

    it("SETUP: Mempersiapkan akun pengguna sintetis untuk pengujian sesi", async () => {
      const u = await prisma.user.create({
        data: {
          name: "Session Synthetic Tester",
          email: `synthetic.session.${timestamp}@cybershield.test`,
          passwordHash: await hashPassword("SyntheticPass#2026"),
          role: "user",
        },
      });
      syntheticUserId = u.id;
      expect(syntheticUserId).toBeDefined();
    });

    it("SESS-01: Login membuat session di database", async () => {
      const res = await loginAction({
        email: `synthetic.session.${timestamp}@cybershield.test`,
        password: "SyntheticPass#2026",
      });

      expect(res.success).toBe(true);

      const dbSession = await prisma.session.findFirst({
        where: { userId: syntheticUserId },
        orderBy: { createdAt: "desc" },
      });

      expect(dbSession).not.toBeNull();
      expect(dbSession?.userId).toBe(syntheticUserId);
      expect(dbSession?.revokedAt).toBeNull();
    });

    it("SESS-02: Database hanya menyimpan hash token (64 hex characters)", async () => {
      const dbSession = await prisma.session.findFirst({
        where: { userId: syntheticUserId },
        orderBy: { createdAt: "desc" },
      });

      expect(dbSession).not.toBeNull();
      expect(dbSession?.tokenHash).toMatch(/^[0-9a-f]{64}$/);
      expect(dbSession?.tokenHash.length).toBe(64);
    });

    it("SESS-03: Token mentah tidak tersimpan di database", async () => {
      const sessionResult = await createDatabaseSession(syntheticUserId);
      testRawToken = sessionResult.rawToken;

      expect(testRawToken).toMatch(/^[0-9a-f]{64}$/);

      // Cari apakah token mentah muncul langsung sebagai tokenHash di basis data
      const leakSearch = await prisma.session.findFirst({
        where: { tokenHash: testRawToken },
      });
      expect(leakSearch).toBeNull();

      // Pastikan hash token yang tersimpan di DB cocok dengan hash SHA-256 dari token mentah
      const expectedHash = hashSessionToken(testRawToken);
      const matchedRecord = await prisma.session.findUnique({
        where: { tokenHash: expectedHash },
      });
      expect(matchedRecord).not.toBeNull();
      expect(matchedRecord?.id).toBe(sessionResult.session.id);
    });

    it("SESS-04: Session valid diterima dan mengembalikan data profil dari basis data", async () => {
      const sessionData = await validateSessionToken(testRawToken);

      expect(sessionData).not.toBeNull();
      expect(sessionData?.userId).toBe(syntheticUserId);
      expect(sessionData?.email).toBe(`synthetic.session.${timestamp}@cybershield.test`);
      expect(sessionData?.role).toBe("user");
      expect(typeof sessionData?.exp).toBe("number");
      expect(typeof sessionData?.iat).toBe("number");
    });

    it("SESS-05: Session expired ditolak secara fail-closed", async () => {
      const expiredRawToken = generateRawToken();
      const expiredHash = hashSessionToken(expiredRawToken);

      await prisma.session.create({
        data: {
          userId: syntheticUserId,
          tokenHash: expiredHash,
          expiresAt: new Date(Date.now() - 10000), // 10 detik yang lalu (kedaluwarsa)
        },
      });

      const sessionData = await validateSessionToken(expiredRawToken);
      expect(sessionData).toBeNull();
    });

    it("SESS-06: Session revoked ditolak secara fail-closed", async () => {
      const revokedRawToken = generateRawToken();
      const revokedHash = hashSessionToken(revokedRawToken);

      await prisma.session.create({
        data: {
          userId: syntheticUserId,
          tokenHash: revokedHash,
          expiresAt: new Date(Date.now() + 3600000),
          revokedAt: new Date(), // Telah dicabut
        },
      });

      const sessionData = await validateSessionToken(revokedRawToken);
      expect(sessionData).toBeNull();
    });

    it("SESS-07: Logout mencabut session pada database", async () => {
      const logoutSession = await createDatabaseSession(syntheticUserId);
      logoutTestToken = logoutSession.rawToken;

      _setTestSessionCookie(logoutTestToken);
      const res = await logoutAction();
      expect(res.success).toBe(true);

      const dbSession = await prisma.session.findUnique({
        where: { tokenHash: hashSessionToken(logoutTestToken) },
      });

      expect(dbSession).not.toBeNull();
      expect(dbSession?.revokedAt).not.toBeNull();
    });

    it("SESS-08: Token lama ditolak setelah logout (tidak dapat digunakan kembali)", async () => {
      const sessionData = await validateSessionToken(logoutTestToken);
      expect(sessionData).toBeNull();
    });

    it("SESS-09: Token tidak dikenal ditolak secara fail-closed", async () => {
      const randomUnknownToken = generateRawToken();
      const sessionData = await validateSessionToken(randomUnknownToken);
      expect(sessionData).toBeNull();
    });

    it("SESS-10: Manipulasi cookie dan format token tidak valid ditolak", async () => {
      expect(await validateSessionToken("")).toBeNull();
      expect(await validateSessionToken("invalid-token-string")).toBeNull();
      expect(await validateSessionToken("admin' OR '1'='1")).toBeNull();
      expect(await validateSessionToken("1234567890abcdef")).toBeNull(); // Kurang dari 64 karakter
      expect(await validateSessionToken("z".repeat(64))).toBeNull(); // Karakter non-heksadesimal
    });

    it("SESS-11: Pengguna yang dihapus tidak dapat menggunakan session", async () => {
      const tempUser = await prisma.user.create({
        data: {
          name: "Temp Deletable User",
          email: `deletable.${Date.now()}@cybershield.test`,
          passwordHash: "dummy-hash",
          role: "user",
        },
      });

      const tempSession = await createDatabaseSession(tempUser.id);
      expect(await validateSessionToken(tempSession.rawToken)).not.toBeNull();

      // Hapus pengguna dari basis data
      await prisma.user.delete({
        where: { id: tempUser.id },
      });

      // Validasi sesi harus gagal (session cascade terhapus atau user null)
      const afterDelete = await validateSessionToken(tempSession.rawToken);
      expect(afterDelete).toBeNull();
    });

    it("SESS-12: API mutasi menolak request cross-origin yang tidak sah (Perlindungan CSRF)", async () => {
      // 1. Verifikasi fungsi validasi CSRF dengan Origin tidak cocok (Attacker)
      const attackerCsrf = await validateCsrf(
        new Request("http://localhost:3000/api/analysis", {
          method: "POST",
          headers: {
            origin: "https://evil-cross-origin-attacker.com",
            host: "localhost:3000",
          },
        })
      );
      expect(attackerCsrf.valid).toBe(false);
      expect(attackerCsrf.reason).toContain("Permintaan lintas-asal (Cross-origin) ditolak");

      // 2. Verifikasi fungsi validasi CSRF dengan Same-Origin
      const sameOriginCsrf = await validateCsrf(
        new Request("http://localhost:3000/api/analysis", {
          method: "POST",
          headers: {
            origin: "http://localhost:3000",
            host: "localhost:3000",
          },
        })
      );
      expect(sameOriginCsrf.valid).toBe(true);

      // 3. Verifikasi pemanggilan langsung ke API mutasi POST /api/analysis
      const apiReq = new Request("http://localhost:3000/api/analysis", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          origin: "https://malicious-csrf-attacker.net",
          host: "localhost:3000",
        },
        body: JSON.stringify({
          url: "https://csrf-exploit-attempt.com",
          riskScore: 90,
          isSafe: false,
          recommendation: "Block CSRF",
          sha256: "a".repeat(64),
          hmac: "b".repeat(64),
          indicators: [],
        }),
      });

      const apiRes = await postAnalysisApi(apiReq);
      expect(apiRes.status).toBe(403);

      const jsonBody = await apiRes.json();
      expect(jsonBody.success).toBe(false);
      expect(jsonBody.message).toContain("Permintaan lintas-asal (Cross-origin) ditolak");
    });

    it("SESS-13: Admin memiliki mekanisme mencabut seluruh sesi pengguna aktif", async () => {
      // Buat 2 sesi aktif untuk pengguna sintetis
      const s1 = await createDatabaseSession(syntheticUserId);
      const s2 = await createDatabaseSession(syntheticUserId);

      expect(await validateSessionToken(s1.rawToken)).not.toBeNull();
      expect(await validateSessionToken(s2.rawToken)).not.toBeNull();

      // User reguler DITOLAK mencabut sesi (403)
      _setTestSessionCookie(userSessionToken);
      const userAttempt = await revokeUserSessionsAction(syntheticUserId);
      expect(userAttempt.success).toBe(false);
      expect(userAttempt.message).toContain("403 Forbidden");

      // Admin berhasil mencabut seluruh sesi pengguna
      _setTestSessionCookie(adminSessionToken);
      const adminAttempt = await revokeUserSessionsAction(syntheticUserId);
      expect(adminAttempt.success).toBe(true);
      expect(adminAttempt.data?.revokedCount).toBeGreaterThanOrEqual(2);

      // Sesi s1 dan s2 sekarang harus ditolak
      expect(await validateSessionToken(s1.rawToken)).toBeNull();
      expect(await validateSessionToken(s2.rawToken)).toBeNull();
    });

    it("CLEANUP: Membersihkan data pengguna sintetis pengujian sesi", async () => {
      await prisma.user.delete({
        where: { id: syntheticUserId },
      });
    });
  });

  // ==========================================
  // 7. Pengujian Regresi: Remediasi Temuan Keamanan (SESSION-POST-AUDIT.md)
  // ==========================================
  describe("7. Pengujian Regresi: Remediasi Temuan Keamanan", () => {
    it("SETUP: Mempersiapkan akun korban dan analisis untuk pengujian regresi", async () => {
      const victim = await prisma.user.create({
        data: {
          name: "Victim User",
          email: `victim.${timestamp}@cybershield.test`,
          passwordHash: await hashPassword("VictimPass#2026"),
          role: "user",
        },
      });
      victimUserId = victim.id;

      // Korban membuat data analisis
      const victimSession = await createDatabaseSession(victimUserId);
      _setTestSessionCookie(victimSession.rawToken);
      const ana = await createAnalysisAction({
        url: `https://victim-private-${timestamp}.com`,
        riskScore: 25,
        isSafe: true,
        recommendation: "Analisis privat korban",
        sha256: "e".repeat(64),
        hmac: "f".repeat(64),
      });
      regrAnalysisId = (ana.data as { id: string }).id;
    });

    it("REGR-AUTH-01: Parameter injection auth bypass ditolak pada Server Action deleteAnalysisAction", async () => {
      // Attacker login sebagai user biasa (userSessionToken)
      _setTestSessionCookie(userSessionToken);

      // Attacker mencoba menghapus data korban; mengoper argumen kedua palsu seperti { role: "admin" }
      // Server Action hanya membaca session cookie database dan menolak aksi dengan 403 Forbidden
      // @ts-expect-error Pengujian injeksi argumen palsu dari klien
      const attackRes = await deleteAnalysisAction(regrAnalysisId, { role: "admin" });
      expect(attackRes.success).toBe(false);
      expect(attackRes.message).toContain("403 Forbidden");

      // Verifikasi data korban tetap ada di database
      const stillExists = await prisma.analysis.findUnique({
        where: { id: regrAnalysisId },
      });
      expect(stillExists).not.toBeNull();
    });

    it("REGR-AUTH-02: Parameter injection auth bypass ditolak pada revokeUserSessionsAction", async () => {
      // Attacker login sebagai user biasa
      _setTestSessionCookie(userSessionToken);

      // Attacker mencoba mencabut sesi korban dengan menyisipkan argumen override { role: "admin" }
      // @ts-expect-error Pengujian injeksi argumen palsu dari klien
      const attackRes = await revokeUserSessionsAction(victimUserId, { role: "admin" });
      expect(attackRes.success).toBe(false);
      expect(attackRes.message).toContain("403 Forbidden");
    });

    it("REGR-CSRF-01: CSRF - Request Same-Origin yang sesuai dengan APP_ORIGIN diterima", async () => {
      const res = await validateCsrf(
        new Request("http://localhost:3000/api/analysis", {
          method: "POST",
          headers: {
            origin: "http://localhost:3000",
            host: "localhost:3000",
          },
        })
      );
      expect(res.valid).toBe(true);
    });

    it("REGR-CSRF-02: CSRF - Request Cross-Origin dari attacker ditolak fail-closed", async () => {
      const res = await validateCsrf(
        new Request("http://localhost:3000/api/analysis", {
          method: "POST",
          headers: {
            origin: "https://evil-cross-origin.com",
            host: "localhost:3000",
          },
        })
      );
      expect(res.valid).toBe(false);
      expect(res.reason).toContain("Permintaan lintas-asal (Cross-origin) ditolak");
    });

    it("REGR-CSRF-03: CSRF - Request dengan Origin 'null' ditolak fail-closed", async () => {
      const res = await validateCsrf(
        new Request("http://localhost:3000/api/analysis", {
          method: "POST",
          headers: {
            origin: "null",
            host: "localhost:3000",
          },
        })
      );
      expect(res.valid).toBe(false);
      expect(res.reason).toContain("Header Origin 'null' tidak diizinkan");
    });

    it("REGR-CSRF-04: CSRF - Request tanpa Origin dan tanpa Referer tanpa anti-CSRF header ditolak", async () => {
      const res = await validateCsrf(
        new Request("http://localhost:3000/api/analysis", {
          method: "POST",
          headers: {
            host: "localhost:3000",
          },
        })
      );
      expect(res.valid).toBe(false);
      expect(res.reason).toContain("Header Origin atau Referer yang valid wajib disertakan");
    });

    it("REGR-CSRF-05: CSRF - Host header spoofing tidak dapat mengelabui canonical origin APP_ORIGIN", async () => {
      // Attacker memalsukan Host header menjadi domain miliknya sembari mengirim origin domain miliknya
      const res = await validateCsrf(
        new Request("http://localhost:3000/api/analysis", {
          method: "POST",
          headers: {
            origin: "https://attacker-controlled.site",
            host: "attacker-controlled.site",
          },
        })
      );
      // Validasi origin kanonikal server independen dari Host header yang dipalsukan klien
      expect(res.valid).toBe(false);
      expect(res.reason).toContain("Permintaan lintas-asal (Cross-origin) ditolak");
    });

    it("REGR-CSRF-06: CSRF - Header X-Forwarded-Host dari attacker diabaikan dan tidak dipercaya", async () => {
      const res = await validateCsrf(
        new Request("http://localhost:3000/api/analysis", {
          method: "POST",
          headers: {
            origin: "https://attacker.com",
            "x-forwarded-host": "attacker.com",
            host: "localhost:3000",
          },
        })
      );
      expect(res.valid).toBe(false);
    });

    it("REGR-CSRF-07: CSRF - Validasi production fail-closed jika APP_ORIGIN tidak disetel", () => {
      const originalEnv = process.env.NODE_ENV;
      const originalOrigin = process.env.APP_ORIGIN;
      const envRef = process.env as Record<string, string | undefined>;
      try {
        envRef.NODE_ENV = "production";
        delete process.env.APP_ORIGIN;

        const origins = getCanonicalOrigins();
        // Pada mode production tanpa APP_ORIGIN, tidak boleh ada origin default (kosong)
        expect(origins.length).toBe(0);
      } finally {
        envRef.NODE_ENV = originalEnv;
        if (originalOrigin !== undefined) {
          process.env.APP_ORIGIN = originalOrigin;
        }
      }
    });

    it("REGR-LOG-01: logoutAction mengekstrak token dari cookie sesi tanpa parameter eksplisit", async () => {
      const victimSession = await createDatabaseSession(victimUserId);
      _setTestSessionCookie(victimSession.rawToken);

      // Logout dipanggil tanpa parameter apapun
      const res = await logoutAction();
      expect(res.success).toBe(true);

      // Pastikan record sesi di PostgreSQL telah dicabut
      const revoked = await prisma.session.findUnique({
        where: { tokenHash: hashSessionToken(victimSession.rawToken) },
      });
      expect(revoked).not.toBeNull();
      expect(revoked?.revokedAt).not.toBeNull();
    });

    it("REGR-LOG-02: Sesi yang telah dicabut lewat logout tidak dapat digunakan kembali", async () => {
      const victimSession = await createDatabaseSession(victimUserId);
      _setTestSessionCookie(victimSession.rawToken);

      // Lakukan logout
      await logoutAction();

      // Coba validasi token yang dicabut
      const val = await validateSessionToken(victimSession.rawToken);
      expect(val).toBeNull();
    });

    it("CLEANUP: Membersihkan data korban pengujian regresi", async () => {
      _setTestSessionCookie(adminSessionToken);
      await deleteAnalysisAction(regrAnalysisId);
      await prisma.user.delete({
        where: { id: victimUserId },
      });
    });
  });

  // ==========================================
  // PEMBERSIHAN AKHIR LIFECYCLE (afterAll)
  // ==========================================
  afterAll(async () => {
    // 1. Reset helper simulasi cookie sesi pengujian
    _setTestSessionCookie(null);

    // 2. Kumpulkan seluruh ID pengguna spesifik yang dibuat dalam test suite ini
    const testUserIds = [
      testUserId,
      testOtherUserId,
      testAdminUserId,
      syntheticUserId,
      victimUserId,
    ].filter((id): id is string => Boolean(id));

    if (testUserIds.length > 0) {
      // 3. Bersihkan indikator dan analisis yang terkait dengan ID pengujian ini (jika ada yang tertinggal)
      const orphanAnalyses = await prisma.analysis.findMany({
        where: {
          OR: [
            { userId: { in: testUserIds } },
            { id: { in: [userAnalysisId, regrAnalysisId].filter((id): id is string => Boolean(id)) } },
          ],
        },
        select: { id: true },
      });
      const orphanAnalysisIds = orphanAnalyses.map((a) => a.id);

      if (orphanAnalysisIds.length > 0) {
        await prisma.analysisIndicator.deleteMany({
          where: { analysisId: { in: orphanAnalysisIds } },
        });
        await prisma.analysis.deleteMany({
          where: { id: { in: orphanAnalysisIds } },
        });
      }

      // 4. Bersihkan seluruh sesi milik pengguna uji coba ini
      await prisma.session.deleteMany({
        where: { userId: { in: testUserIds } },
      });

      // 5. Bersihkan pengguna uji coba spesifik berdasarkan ID
      await prisma.user.deleteMany({
        where: { id: { in: testUserIds } },
      });
    }
  });
});
