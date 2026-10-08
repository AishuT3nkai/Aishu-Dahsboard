import { getSessionUser } from "@/lib/session";
import { redirect } from "next/navigation";

const ERROR_MESSAGES: Record<string, string> = {
  unauthorized:
    "This Discord account is not one of the two authorized dashboard admins.",
  state_mismatch: "Login session expired — please try again.",
  oauth_failed: "Discord sign-in failed. Please try again.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const user = await getSessionUser();
  if (user) redirect("/overview");

  const error = searchParams.error ? ERROR_MESSAGES[searchParams.error] ?? "Sign-in failed." : null;

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-card bg-accent/15 text-xl font-display font-semibold text-accent-bright">
            A
          </div>
          <h1 className="font-display text-2xl font-semibold text-base-100">Aishu Bot</h1>
          <p className="mt-1 text-sm text-base-400">Private control center — admins only</p>
        </div>

        {error && (
          <div className="mb-4 rounded-card border border-bad/30 bg-bad/10 px-4 py-3 text-sm text-bad">
            {error}
          </div>
        )}

        <a
          href="/api/auth/discord"
          className="focus-ring flex w-full items-center justify-center gap-2 rounded-card bg-accent-dim px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-accent"
        >
          Continue with Discord
        </a>

        <p className="mt-6 text-center text-xs text-base-500">
          Access is limited to two explicitly authorized Discord accounts. Having
          Administrator or Manage Server in Discord does not grant access here.
        </p>
      </div>
    </main>
  );
}
