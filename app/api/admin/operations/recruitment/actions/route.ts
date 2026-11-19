import type { NextRequest } from "next/server";
import { proxyAdminRequest } from "@/lib/admin-api-proxy";
export function POST(r: NextRequest) {
  return proxyAdminRequest(r, "/api/v1/admin/operations/recruitment/actions");
}
