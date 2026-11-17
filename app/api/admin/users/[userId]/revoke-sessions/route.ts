import type { NextRequest } from "next/server";
import { proxyAdminRequest } from "@/lib/admin-api-proxy";

export async function POST(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  return proxyAdminRequest(request, `/api/v1/admin/users/${encodeURIComponent(userId)}/revoke-sessions`);
}
