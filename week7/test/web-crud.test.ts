import "dotenv/config";
import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { prisma } from "../lib/prisma";
import { createDatabaseSession, _setTestSessionCookie } from "../lib/auth/session";
import { hashPassword } from "../lib/auth/password";
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
import {
  createAnalysisSchema,
  uuidSchema,
} from "../lib/validation";

describe("Web Milestone 2 — Relational CRUD & Validation Testing", () => {
  let createdAnalysisId: string;
  let createdIndicatorId: string;
  let crudAdminUserId: string;

  beforeAll(async () => {
    const adminUser = await prisma.user.create({
      data: {
        name: "Web CRUD Admin Tester",
        email: `crud.admin.${Date.now()}@cybershield.test`,
        passwordHash: await hashPassword("AdminPass#2026"),
        role: "admin",
      },
    });
    crudAdminUserId = adminUser.id;

    const { rawToken } = await createDatabaseSession(crudAdminUserId);
    _setTestSessionCookie(rawToken);
  });

  afterAll(async () => {
    _setTestSessionCookie(null);
    if (crudAdminUserId) {
      const analyses = await prisma.analysis.findMany({
        where: { userId: crudAdminUserId },
        select: { id: true },
      });
      const ids = analyses.map((a) => a.id);
      if (ids.length > 0) {
        await prisma.analysisIndicator.deleteMany({ where: { analysisId: { in: ids } } }).catch(() => {});
        await prisma.analysis.deleteMany({ where: { id: { in: ids } } }).catch(() => {});
      }
      await prisma.session.deleteMany({ where: { userId: crudAdminUserId } }).catch(() => {});
      await prisma.user.delete({ where: { id: crudAdminUserId } }).catch(() => {});
    }
  });

  // Skenario 1: CREATE Entitas Pertama (Analysis)
  it("WEB-01: CREATE entitas pertama (Analysis) berhasil tersimpan di database", async () => {
    const input = {
      url: "https://test-bank-official-simulation.example.com",
      riskScore: 10,
      isSafe: true,
      recommendation: "Tautan simulasi aman untuk pengujian otomatis.",
      sha256: "a".repeat(64),
      hmac: "b".repeat(64),
      encryptedNotes: "Catatan simulasi enkripsi",
    };

    const res = await createAnalysisAction(input);
    expect(res.success).toBe(true);
    expect(res.data).toBeDefined();

    const data = res.data as { id: string; url: string; riskScore: number };
    expect(data.id).toBeDefined();
    expect(data.url).toBe(input.url);
    expect(data.riskScore).toBe(10);

    createdAnalysisId = data.id;
  });

  // Skenario 2: READ Entitas Pertama (Analysis)
  it("WEB-02: READ entitas pertama (Analysis) membaca data dari database", async () => {
    expect(createdAnalysisId).toBeDefined();

    const res = await getAnalysisByIdAction(createdAnalysisId);
    expect(res.success).toBe(true);

    const data = res.data as { id: string; url: string };
    expect(data.id).toBe(createdAnalysisId);
    expect(data.url).toBe("https://test-bank-official-simulation.example.com");

    // Uji list
    const listRes = await getAnalysesAction();
    expect(listRes.success).toBe(true);
    expect(Array.isArray(listRes.data)).toBe(true);
  });

  // Skenario 3: UPDATE Entitas Pertama (Analysis)
  it("WEB-03: UPDATE entitas pertama (Analysis) memperbarui data di database", async () => {
    expect(createdAnalysisId).toBeDefined();

    const updatePayload = {
      recommendation: "Rekomendasi telah diperbarui oleh reviewer otomatis.",
      riskScore: 25,
      isSafe: true,
    };

    const res = await updateAnalysisAction(createdAnalysisId, updatePayload);
    expect(res.success).toBe(true);

    const check = await getAnalysisByIdAction(createdAnalysisId);
    const data = check.data as { recommendation: string; riskScore: number };
    expect(data.recommendation).toBe(updatePayload.recommendation);
    expect(data.riskScore).toBe(25);
  });

  // Skenario 4: CREATE Entitas Kedua (AnalysisIndicator)
  it("WEB-04: CREATE entitas kedua (AnalysisIndicator) berelasi dengan Analysis", async () => {
    expect(createdAnalysisId).toBeDefined();

    const indicatorInput = {
      analysisId: createdAnalysisId,
      type: "CUSTOM",
      status: "Verifikasi Manual",
      isAlert: false,
      detail: "Indikator tambahan dari simulasi pengujian otomatis.",
    };

    const res = await createIndicatorAction(indicatorInput);
    expect(res.success).toBe(true);

    const data = res.data as { id: string; analysisId: string; type: string };
    expect(data.id).toBeDefined();
    expect(data.analysisId).toBe(createdAnalysisId);
    expect(data.type).toBe("CUSTOM");

    createdIndicatorId = data.id;
  });

  // Skenario 5: READ Entitas Kedua (AnalysisIndicator)
  it("WEB-05: READ entitas kedua (AnalysisIndicator) berhasil membaca data", async () => {
    expect(createdIndicatorId).toBeDefined();

    const res = await getIndicatorByIdAction(createdIndicatorId);
    expect(res.success).toBe(true);

    const data = res.data as { id: string; status: string; detail: string };
    expect(data.id).toBe(createdIndicatorId);
    expect(data.status).toBe("Verifikasi Manual");
  });

  // Skenario 6: UPDATE Entitas Kedua (AnalysisIndicator)
  it("WEB-06: UPDATE entitas kedua (AnalysisIndicator) memperbarui detail indikator", async () => {
    expect(createdIndicatorId).toBeDefined();

    const updatePayload = {
      status: "Tinjauan Ulang",
      detail: "Detail indikator telah dimodifikasi melalui pengujian.",
      isAlert: true,
    };

    const res = await updateIndicatorAction(createdIndicatorId, updatePayload);
    expect(res.success).toBe(true);

    const check = await getIndicatorByIdAction(createdIndicatorId);
    const data = check.data as { status: string; detail: string; isAlert: boolean };
    expect(data.status).toBe("Tinjauan Ulang");
    expect(data.isAlert).toBe(true);
  });

  // Skenario 7: DELETE Entitas Kedua (AnalysisIndicator)
  it("WEB-07: DELETE entitas kedua (AnalysisIndicator) menghapus tanpa menghapus Analysis induk", async () => {
    expect(createdIndicatorId).toBeDefined();

    const res = await deleteIndicatorAction(createdIndicatorId);
    expect(res.success).toBe(true);

    // Pastikan indikator terhapus
    const checkInd = await getIndicatorByIdAction(createdIndicatorId);
    expect(checkInd.success).toBe(false);

    // Pastikan induk (Analysis) tetap ada
    const checkParent = await getAnalysisByIdAction(createdAnalysisId);
    expect(checkParent.success).toBe(true);
  });

  // Skenario 8: Pengujian Relasi 1 — Pembuatan Analysis dengan Nested Indicators
  it("WEB-08: Pengujian Relasi 1 — Pembuatan Analysis dengan indikator terintegrasi", async () => {
    const parentWithChildren = {
      url: "https://nested-relation-test.example.com",
      riskScore: 80,
      isSafe: false,
      recommendation: "Peringatan bahaya phishing bertingkat.",
      sha256: "c".repeat(64),
      hmac: "d".repeat(64),
      indicators: [
        {
          type: "PROTOCOL",
          status: "HTTPS",
          isAlert: false,
          detail: "SSL Valid",
        },
        {
          type: "KEYWORD",
          status: "Terdeteksi",
          isAlert: true,
          detail: "Kata kunci penipuan terdeteksi",
        },
      ],
    };

    const res = await createAnalysisAction(parentWithChildren);
    expect(res.success).toBe(true);

    const data = res.data as { id: string; indicators: Array<{ id: string }> };
    expect(data.indicators).toHaveLength(2);

    // Simpan ID untuk pengujian cascade delete
    const cascadeParentId = data.id;

    // Skenario 9: Pengujian Relasi 2 — Cascade Delete Menghapus Child Tanpa Orphan
    const deleteRes = await deleteAnalysisAction(cascadeParentId);
    expect(deleteRes.success).toBe(true);

    const verifyParent = await getAnalysisByIdAction(cascadeParentId);
    expect(verifyParent.success).toBe(false);
  });

  // Skenario 10: DELETE Entitas Pertama (Analysis)
  it("WEB-10: DELETE entitas pertama (Analysis) berhasil menghapus data dari database", async () => {
    expect(createdAnalysisId).toBeDefined();

    const res = await deleteAnalysisAction(createdAnalysisId);
    expect(res.success).toBe(true);

    const check = await getAnalysisByIdAction(createdAnalysisId);
    expect(check.success).toBe(false);
  });

  // Skenario Invalid Input 1: URL tidak valid (tanpa protocol http/https)
  it("WEB-INVALID-01: Validasi Zod menolak format URL tanpa protokol http:// atau https://", () => {
    const invalidInput = {
      url: "ftp://contoh-domain.com",
      riskScore: 50,
      isSafe: false,
      recommendation: "Uji tolak",
      sha256: "e".repeat(64),
      hmac: "f".repeat(64),
    };

    const parsed = createAnalysisSchema.safeParse(invalidInput);
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.flatten().fieldErrors.url).toContain(
        "URL harus diawali dengan http:// atau https://"
      );
    }
  });

  // Skenario Invalid Input 2: Nilai riskScore di luar batas (di atas 100)
  it("WEB-INVALID-02: Validasi Zod menolak riskScore lebih dari 100", () => {
    const invalidInput = {
      url: "https://valid-url.com",
      riskScore: 150, // Melebihi 100
      isSafe: false,
      recommendation: "Uji tolak",
      sha256: "e".repeat(64),
      hmac: "f".repeat(64),
    };

    const parsed = createAnalysisSchema.safeParse(invalidInput);
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.flatten().fieldErrors.riskScore).toContain(
        "riskScore maksimal 100"
      );
    }
  });

  // Skenario Invalid Input 3: ID UUID yang tidak valid
  it("WEB-INVALID-03: Validasi Zod menolak ID yang bukan format UUID", () => {
    const invalidUuid = "bukan-uuid-12345";
    const parsed = uuidSchema.safeParse(invalidUuid);
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues[0].message).toBe("ID analisis tidak valid.");
    }
  });
});
