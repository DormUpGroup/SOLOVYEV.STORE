export {
  ADMIN_COOKIE,
  clearAdminCookie,
  constantTimeEqual,
  getAdminPath,
  isAdminAuthenticated,
  isAdminAuthenticatedRequest,
  recordFailedLogin,
  checkRateLimit,
  setAdminCookie,
  sleep,
  unauthorizedResponse,
  verifyAdminCredentials,
  verifyAdminJwt,
} from "@/lib/auth";

/** @deprecated Use verifyAdminCredentials(login, password) */
export function verifyAdminPassword(password: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (process.env.NODE_ENV === "production" && !expected) return false;
  return password === (expected ?? "gosha2026");
}
