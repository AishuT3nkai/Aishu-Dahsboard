"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { Badge, Card } from "@/components/ui";
import { useGuild } from "@/components/GuildProvider";
import type { OverviewStats } from "@/lib/types";

export default function OverviewPage() {
  const { guildId } = useGuild();
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bridgeUnconfigured, setBridgeUnconfigured] = useState(false);

  useEffect(() => {
    if (!guildId) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const res = await fetch(`/api/dashboard/overview?guildId=${guildId}`);
        const body = await res.json();
        if (!res.ok) {
          if (body.code === "BRIDGE_NOT_CONFIGURED") setBridgeUnconfigured(true);
          throw new Error(body.error ?? "Failed to load overview.");
        }
        if (!cancelled) setStats(body.data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [guildId]);

  return (
    <div>
      <PageHeader title="Overview" description="A snapshot of Aishu Bot for the selected server." />

      {bridgeUnconfigured && (
        <div className="mb-6 rounded-card border border-warn/30 bg-warn/10 px-4 py-3 text-sm text-warn">
          The bot bridge isn&apos;t configured yet, so live stats can&apos;t be loaded. Set
          BOT_API_BASE_URL / BOT_API_SHARED_SECRET once the bot exposes the bridge API — see
          dashboard/BRIDGE.md.
        </div>
      )}

      {error && !bridgeUnconfigured && (
        <div className="mb-6 rounded-card border border-bad/30 bg-bad/10 px-4 py-3 text-sm text-bad">{error}</div>
      )}

      {loading && !bridgeUnconfigured && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-card bg-base-800" />
          ))}
        </div>
      )}

      {stats && (
        <>
          <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatCard label="Bot status" value={stats.botOnline ? "Online" : "Offline"} />
            <StatCard label="Latency" value={stats.botLatencyMs !== null ? `${stats.botLatencyMs}ms` : "—"} />
            <StatCard label="Members" value={stats.memberCount.toLocaleString()} />
            <StatCard
              label="Online now"
              value={stats.onlineCount !== null ? stats.onlineCount.toLocaleString() : "—"}
            />
          </div>

          <Card title="Feature status" description={`Current toggles for ${stats.guildName}.`}>
            <div className="flex flex-wrap gap-2">
              <Badge tone={stats.verificationEnabled ? "good" : "neutral"}>
                Verification {stats.verificationEnabled ? "on" : "off"}
              </Badge>
              <Badge tone={stats.welcomeEnabled ? "good" : "neutral"}>
                Welcome {stats.welcomeEnabled ? "on" : "off"}
              </Badge>
              <Badge tone={stats.goodbyeEnabled ? "good" : "neutral"}>
                Goodbye {stats.goodbyeEnabled ? "on" : "off"}
              </Badge>
              <Badge tone={stats.ticketsEnabled ? "good" : "neutral"}>
                Tickets {stats.ticketsEnabled ? "on" : "off"}
              </Badge>
              <Badge tone={stats.levelingEnabled ? "good" : "neutral"}>
                Leveling {stats.levelingEnabled ? "on" : "off"}
              </Badge>
            </div>
          </Card>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <StatCard label="Open suggestions" value={String(stats.openSuggestions)} hint="Awaiting a decision" />
            <StatCard label="Open reports" value={String(stats.openReports)} hint="Awaiting review" />
          </div>
        </>
      )}
    </div>
  );
}
