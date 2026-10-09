"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Activity,
  ArrowUpRight,
  DoorOpen,
  Gavel,
  ShieldAlert,
  ShieldCheck,
  Ticket,
  Settings2,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { Badge, Card, Button } from "@/components/ui";
import { useGuild } from "@/components/GuildProvider";
import type { OverviewStats } from "@/lib/types";

const SHORTCUTS = [
  { href: "/automod", title: "AutoMod", description: "Spam, blocked words, and repeat-offense settings.", icon: ShieldAlert },
  { href: "/moderation", title: "Moderation", description: "Review moderation settings and warning records.", icon: Gavel },
  { href: "/welcome", title: "Welcome & goodbye", description: "Customize join and leave messages.", icon: DoorOpen },
  { href: "/verification", title: "Verification", description: "Configure member verification rules.", icon: ShieldCheck },
  { href: "/tickets", title: "Tickets", description: "Manage support ticket settings.", icon: Ticket },
  { href: "/settings", title: "Dashboard settings", description: "Review server and dashboard options.", icon: Settings2 },
];

export default function OverviewPage() {
  const { guildId } = useGuild();
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bridgeUnconfigured, setBridgeUnconfigured] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!guildId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setBridgeUnconfigured(false);
    (async () => {
      try {
        const res = await fetch(`/api/dashboard/overview?guildId=${encodeURIComponent(guildId)}`);
        const body = await res.json();
        if (!res.ok) {
          if (body.code === "BRIDGE_NOT_CONFIGURED") setBridgeUnconfigured(true);
          throw new Error(body.error ?? "Failed to load overview.");
        }
        if (!cancelled) setStats(body.data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load overview.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [guildId, retryCount]);

  return (
    <div className="space-y-6">
      <PageHeader title="Overview" description="Your server at a glance. Monitor Aishu Bot and jump straight to the tools you use most." />

      {bridgeUnconfigured && (
        <div role="status" className="rounded-card border border-warn/30 bg-warn/10 px-4 py-3 text-sm text-warn">
          Live data is unavailable because the bot bridge is not configured in this dashboard deployment.
          Configure BOT_API_BASE_URL and BOT_API_SHARED_SECRET to connect the dashboard to Aishu Bot.
        </div>
      )}

      {error && !bridgeUnconfigured && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-bad/30 bg-bad/10 px-4 py-3 text-sm text-bad">
          <span>{error}</span>
          <Button variant="secondary" onClick={() => setRetryCount((count) => count + 1)} type="button" disabled={!guildId || loading}
            className="!px-3 !py-1.5" >
            Try again
          </Button>
        </div>
      )}

      {loading && !stats && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-card border border-base-800 bg-base-900/60" />
          ))}
        </div>
      )}

      {stats && (
        <>
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            <StatCard label="Bot status" value={stats.botOnline ? "Online" : "Offline"} hint={stats.botOnline ? "Connected to Discord" : "Check the bot host"} />
            <StatCard label="Latency" value={stats.botLatencyMs !== null ? `${stats.botLatencyMs} ms` : "—"} hint="Discord gateway response" />
            <StatCard label="Members" value={stats.memberCount.toLocaleString()} hint="Members in selected server" />
            <StatCard label="Online now" value={stats.onlineCount !== null ? stats.onlineCount.toLocaleString() : "—"} hint="Availability depends on bot intents" />
          </div>

          <Card title="Feature status" description={`Current configuration for ${stats.guildName}.`}>
            <div className="flex flex-wrap gap-2">
              <Badge tone={stats.verificationEnabled ? "good" : "neutral"}>Verification {stats.verificationEnabled ? "On" : "Off"}</Badge>
              <Badge tone={stats.welcomeEnabled ? "good" : "neutral"}>Welcome {stats.welcomeEnabled ? "On" : "Off"}</Badge>
              <Badge tone={stats.goodbyeEnabled ? "good" : "neutral"}>Goodbye {stats.goodbyeEnabled ? "On" : "Off"}</Badge>
              <Badge tone={stats.ticketsEnabled ? "good" : "neutral"}>Tickets {stats.ticketsEnabled ? "On" : "Off"}</Badge>
              <Badge tone={stats.levelingEnabled ? "good" : "neutral"}>Leveling {stats.levelingEnabled ? "On" : "Off"}</Badge>
            </div>
          </Card>

          <div className="grid gap-3 sm:grid-cols-2">
            <StatCard label="Open suggestions" value={String(stats.openSuggestions)} hint="Waiting for staff review" />
            <StatCard label="Open reports" value={String(stats.openReports)} hint="Waiting for staff review" />
          </div>
        </>
      )}

      <div>
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-base font-semibold text-base-100">Quick access</h2>
            <p className="mt-1 text-sm text-base-400">Jump to a configuration page without searching the sidebar.</p>
          </div>
          <Activity size={18} className="text-base-500" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {SHORTCUTS.map(({ href, title, description, icon: Icon }) => (
            <Link key={href} href={href} className="focus-ring group rounded-card border border-base-800 bg-base-900/50 p-4 transition-colors hover:border-accent/40 hover:bg-base-900">
              <div className="mb-3 flex items-center justify-between">
                <span className="flex h-9 w-9 items-center justify-center rounded-card bg-accent/10 text-accent-bright">
                  <Icon size={18} />
                </span>
                <ArrowUpRight size={16} className="text-base-500 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent-bright" />
              </div>
              <h3 className="text-sm font-semibold text-base-100">{title}</h3>
              <p className="mt-1 text-xs leading-5 text-base-400">{description}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
