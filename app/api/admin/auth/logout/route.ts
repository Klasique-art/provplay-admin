import type { NextRequest } from "next/server";
import { proxyAdminRequest } from "@/lib/admin-api-proxy";

export function POST(request: NextRequest) {
  const csrfToken = request.headers.get("x-csrf-token") ?? request.cookies.get("provplay_admin_csrf")?.value;
  return proxyAdminRequest(request, "/api/v1/admin/auth/logout", { csrfToken });
}
