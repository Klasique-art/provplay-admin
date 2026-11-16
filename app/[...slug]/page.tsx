import { notFound } from "next/navigation";
import { AdminPage } from "@/components/admin/AdminPage";
import { adminPages, findAdminPage } from "@/config/admin-pages";
export function generateStaticParams() { return adminPages.map((page) => ({ slug: page.href.split("/").filter(Boolean) })); }
export default async function ScaffoldPage({ params }: { params: Promise<{ slug: string[] }> }) { const { slug } = await params; const page = findAdminPage(`/${slug.join("/")}`); if (!page) notFound(); return <AdminPage page={page} />; }
