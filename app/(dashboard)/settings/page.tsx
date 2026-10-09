"use client";

import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card, Badge, Button } from "@/components/ui";
import type { SessionUser } from "@/lib/types";

type ConnectionStatus = { bridgeConfigured: boolean; guildPinned: boolean };

export default function SettingsPage() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [status, setStatus] = useState<ConnectionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    setError(null);

    const [userResult, statusResult] = await Promise.allSettled([
      fetch("/api/auth/me").then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error ?? "Could not load the signed-in account.");
        return body.user as SessionUser;
      }),
      fetch("/api/dashboard/status").then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error ?? "Could not load bridge status.");
        return body as ConnectionStatus;
      }),
    ]);

    if (userResult.status === "fulfilled") setUser(userResult.value);
    if (statusResult.status === "fulfilled") setStatus(statusResult.value);

    const errors = [userResult, statusResult]
      .filter((result): result is PromiseRejectedResult => result.status === "rejected")
      .map((result) => result.reason instanceof Error ? result.reason.message : "A settings request failed.");
    setError(errors.length ? errors.join(" ") : null);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  return (
    <div>
      <PageHeader title="Settings" description="Session, access, and connection diagnostics." />

      {error && (
        <div role="alert" className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-card border border-bad/30 bg-bad/10 px-4 py-3 text-sm text-bad">
          <span>{error}</span>
          <Button variant="secondary" onClick={() => void loadSettings()} disabled={loading}>
            {loading ? "Retrying…" : "Retry"}
          </Button>
        </div>
      )}

      <div className="space-y-4">
        <Card title="Signed in as">
          {user ? (
            <div className="text-sm text-base-300">
              <div className="text-base-100">{user.username}</div>
              <div className="font-mono text-xs text-base-500">{user.id}</div>
            </div>
          ) : loading ? (
            <div className="h-6 w-32 animate-pulse rounded bg-base-800" />
          ) : (
            <p className="text-sm text-base-400">Account information is unavailable.</p>
          )}
          <p className="mt-3 text-xs text-base-500">
            Access is limited to exactly two Discord accounts, set as ADMIN_USER_ID_1 and
            ADMIN_USER_ID_2 in this deployment&apos;s environment variables. Discord
            Administrator or Manage Server permissions do not grant access here.
          </p>
        </Card>

        <Card title="Bot bridge">
          {status ? (
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={status.bridgeConfigured ? "good" : "warn"}>
                {status.bridgeConfigured ? "Configured" : "Not configured"}
              </Badge>
              <Badge tone="neutral">
                {status.guildPinned ? "Pinned to ADMIN_GUILD_ID" : "Guild switcher shows all shared servers"}
              </Badge>
            </div>
          ) : loading ? (
            <div className="h-6 w-40 animate-pulse rounded bg-base-800" />
          ) : (
            <p className="text-sm text-base-400">Bridge status is unavailable.</p>
          )}
          <p className="mt-3 text-xs text-base-500">
            The dashboard never touches the bot&apos;s SQLite database directly. It talks to the
            live Aishu Bot process only through the authenticated bridge API described in
            dashboard/BRIDGE.md.
          </p>
          {status && !status.bridgeConfigured && (
            <p className="mt-3 text-sm text-warn">
              Configure BOT_API_BASE_URL and BOT_API_SHARED_SECRET in the dashboard deployment
              environment before using live bot settings.
            </p>
          )}
        </Card>

        <Card title="Links">
          <ul className="space-y-1 text-sm">
            <li>
              <a
                href="https://github.com/AishuT3nkai/Aishu-Bot"
                target="_blank"
                rel="noreferrer"
                className="text-accent-bright hover:underline"
              >
                Bot repository
              </a>
            </li>
            <li>
              <a
                href="https://github.com/AishuT3nkai/super-funicular"
                target="_blank"
                rel="noreferrer"
                className="text-accent-bright hover:underline"
              >
                Documentation repository
              </a>
            </li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
