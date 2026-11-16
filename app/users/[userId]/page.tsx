import { Suspense } from "react";
import { UserDetailPage } from "@/components/admin/UserDetailPage";

export default function UserPage({ params }: { params: Promise<{ userId: string }> }) {
  return <Suspense fallback={<div className="mx-auto h-96 w-full max-w-[1600px] animate-pulse rounded-[14px] border border-slate-200 bg-white" />}><ResolvedUserPage params={params} /></Suspense>;
}

async function ResolvedUserPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  return <UserDetailPage userId={userId} />;
}
