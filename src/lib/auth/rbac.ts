import type { UserRole } from "@/lib/auth/session";

export function hasRole(roles: UserRole[], allowed: UserRole[]) {
  return roles.includes("admin") || roles.some((role) => allowed.includes(role));
}

export function allowedRolesForPath(pathname: string): UserRole[] {
  if (pathname.startsWith("/admin")) return ["admin"];
  if (pathname.startsWith("/api/internal/review")) return ["admin", "reviewer"];
  if (pathname.startsWith("/api/internal/audit")) return ["admin", "reviewer"];
  if (pathname.startsWith("/api/internal/connectors")) return ["admin", "reviewer", "analyst"];
  if (pathname.startsWith("/api/internal/sources")) return ["admin", "reviewer", "analyst", "read_only"];
  if (pathname.startsWith("/api/internal")) return ["admin", "reviewer", "analyst"];
  if (pathname.startsWith("/app")) return ["admin", "reviewer", "analyst", "read_only"];
  return ["admin"];
}
