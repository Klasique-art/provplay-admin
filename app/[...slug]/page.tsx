import { Suspense } from "react";
import { notFound } from "next/navigation";
import { AdminPage } from "@/components/admin/AdminPage";
import { adminPages, findAdminPage } from "@/config/admin-pages";

type ScaffoldPageProps = {
  params: Promise<{ slug: string[] }>;
};

export function generateStaticParams() {
  return adminPages.map((page) => ({
    slug: page.href.split("/").filter(Boolean),
  }));
}

export default function ScaffoldPage({ params }: ScaffoldPageProps) {
  return (
    <Suspense fallback={<AdminPageSkeleton />}>
      <ResolvedAdminPage params={params} />
    </Suspense>
  );
}

async function ResolvedAdminPage({ params }: ScaffoldPageProps) {
  const { slug } = await params;
  const page = findAdminPage(`/${slug.join("/")}`);

  if (!page) {
    notFound();
  }

  return <AdminPage page={page} />;
}

function AdminPageSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[1600px] animate-pulse" aria-label="Loading administration page" role="status">
      <div className="mb-5 h-3 w-56 rounded bg-slate-200" />
      <div className="mb-6 space-y-3">
        <div className="h-4 w-28 rounded bg-amber-100" />
        <div className="h-9 w-80 max-w-full rounded bg-slate-200" />
        <div className="h-4 w-[560px] max-w-full rounded bg-slate-200" />
      </div>
      <div className="mb-4 h-13 rounded-xl border border-slate-200 bg-white" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <div className="h-32 rounded-[14px] border border-slate-200 bg-white" key={item} />
        ))}
      </div>
      <span className="sr-only">Loading administration page</span>
    </div>
  );
}
