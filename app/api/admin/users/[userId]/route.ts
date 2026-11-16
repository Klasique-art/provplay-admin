import type { NextRequest } from "next/server";
import { proxyAdminGet } from "@/lib/admin-api-proxy";
export async function GET(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) { const { userId } = await params; return proxyAdminGet(request, `/api/v1/admin/users/${encodeURIComponent(userId)}`); }
