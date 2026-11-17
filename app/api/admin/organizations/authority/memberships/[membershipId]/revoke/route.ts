import type { NextRequest } from "next/server";
import { proxyAdminRequest } from "@/lib/admin-api-proxy";

export async function POST(request: NextRequest, { params }: { params: Promise<{ membershipId: string }> }) { const { membershipId } = await params; return proxyAdminRequest(request, `/api/v1/admin/organizations/authority/memberships/${encodeURIComponent(membershipId)}/revoke`); }
