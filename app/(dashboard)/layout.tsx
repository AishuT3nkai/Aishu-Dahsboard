import { redirect } from "next/navigation";
import { getSessionUser, isAuthorizedAdmin } from "@/lib/session";
import { Sidebar } from "@/components/Sidebar";
import { GuildProvider } from "@/components/GuildProvider";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Defense-in-depth: the middleware checks the encrypted token, and this
  // server layout independently rechecks the current two-admin allowlist.
  const user = await getSessionUser();
  if (!user || !isAuthorizedAdmin(user.id)) {
    redirect("/login?error=unauthorized");
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Sidebar user={user} />
      <GuildProvider>
        <main className="min-w-0 w-full flex-1 px-4 py-6 md:px-8 md:py-8">
          <div className="mx-auto max-w-5xl">{children}</div>
        </main>
      </GuildProvider>
    </div>
  );
}
