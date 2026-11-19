import type { NextRequest } from "next/server";
import { proxyAdminGet } from "@/lib/admin-api-proxy";
export function GET(r: NextRequest) {
  return proxyAdminGet(r, "/api/v1/admin/opportunities/trials");
}
