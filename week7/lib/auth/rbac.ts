/**
 * Modul Access Control & Role-Based Access Control (RBAC) CyberShield
 * Memisahkan hak akses antara peran Guest, User, dan Admin.
 */

export type Role = "guest" | "user" | "admin";

export type Permission =
  | "analyze:url"
  | "history:read_public"
  | "history:read_all"
  | "analysis:create"
  | "analysis:update"
  | "analysis:delete"
  | "indicator:create"
  | "indicator:update"
  | "indicator:delete";

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  guest: ["analyze:url", "history:read_public"],
  user: [
    "analyze:url",
    "history:read_public",
    "analysis:create",
  ],
  admin: [
    "analyze:url",
    "history:read_public",
    "history:read_all",
    "analysis:create",
    "analysis:update",
    "analysis:delete",
    "indicator:create",
    "indicator:update",
    "indicator:delete",
  ],
};

export interface AuthContext {
  userId?: string;
  role: Role;
}

/**
 * Memeriksa apakah suatu peran memiliki izin untuk melakukan aksi tertentu.
 */
export function hasPermission(role: Role, permission: Permission): boolean {
  const allowed = ROLE_PERMISSIONS[role] || [];
  return allowed.includes(permission);
}

/**
 * Memastikan otorisasi server-side terpenuhi.
 * Melempar error (Fail-Closed) jika peran tidak memiliki hak akses.
 */
export function requirePermission(context: AuthContext, permission: Permission): void {
  if (!hasPermission(context.role, permission)) {
    throw new Error(
      `Akses ditolak (403 Forbidden): Peran "${context.role}" tidak memiliki hak akses "${permission}".`
    );
  }
}
