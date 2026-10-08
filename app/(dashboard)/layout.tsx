import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { Sidebar } from "@/components/Sidebar";
import { GuildProvider } from "@/components/GuildProvider";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Defense-in-depth: middleware already blocks unauthenticated requests to
  // these routes, but every server component re-checks too.
  const user = await getSessionUser();
  if (!user) redirect("/login");

  return (
    <div className="flex min-h-screen">
      <Sidebar user={user} />
      <GuildProvider>
        <main className="min-w-0 flex-1 px-4 py-6 md:px-8 md:py-8">
          <div className="mx-auto max-w-5xl">{children}</div>
        </main>
      </GuildProvider>
    </div>
  );
}
