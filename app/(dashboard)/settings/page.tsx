"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card, Badge } from "@/components/ui";
import type { SessionUser } from "@/lib/types";

export default function SettingsPage() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [status, setStatus] = useState<{ bridgeConfigured: boolean; guildPinned: boolean } | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((b) => setUser(b.user))
      .catch(() => {});
    fetch("/api/dashboard/status")
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => {});
  }, []);

  return (
    <div>
      <PageHeader title="Settings" description="Session, access, and connection diagnostics." />

      <div className="space-y-4">
        <Card title="Signed in as">
          {user ? (
            <div className="text-sm text-base-300">
              <div className="text-base-100">{user.username}</div>
              <div className="font-mono text-xs text-base-500">{user.id}</div>
            </div>
          ) : (
            <div className="h-6 w-32 animate-pulse rounded bg-base-800" />
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
                {status.bridgeConfigured ? "Connected" : "Not configured"}
              </Badge>
              <Badge tone={status.guildPinned ? "neutral" : "neutral"}>
                {status.guildPinned ? "Pinned to ADMIN_GUILD_ID" : "Guild switcher shows all shared servers"}
              </Badge>
            </div>
          ) : (
            <div className="h-6 w-40 animate-pulse rounded bg-base-800" />
          )}
          <p className="mt-3 text-xs text-base-500">
            The dashboard never touches the bot&apos;s SQLite database directly. It talks to the
            live Aishu Bot process only through the authenticated bridge API described in
            dashboard/BRIDGE.md.
          </p>
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
