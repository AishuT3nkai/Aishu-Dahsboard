"use client";

import { useEffect, useState } from "react";
import { useGuild } from "@/components/GuildProvider";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui";
import type { LanguageStats } from "@/lib/types";

export default function LanguagesPage() {
  const { guildId } = useGuild();
  const [stats, setStats] = useState<LanguageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [bridgeUnconfigured, setBridgeUnconfigured] = useState(false);

  useEffect(() => {
    if (!guildId) return;
    setLoading(true);
    fetch(`/api/dashboard/languages?guildId=${guildId}`)
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) {
          if (body.code === "BRIDGE_NOT_CONFIGURED") setBridgeUnconfigured(true);
          return;
        }
        setStats(body.data);
      })
      .finally(() => setLoading(false));
  }, [guildId]);

  return (
    <div>
      <PageHeader
        title="Languages"
        description="Language is chosen per member with /language, not per server — there is no server-wide override."
      />

      {bridgeUnconfigured && (
        <div className="mb-6 rounded-card border border-warn/30 bg-warn/10 px-4 py-3 text-sm text-warn">
          The bot bridge isn&apos;t configured yet, so language statistics can&apos;t be loaded.
        </div>
      )}

      {loading && !bridgeUnconfigured && <div className="h-40 animate-pulse rounded-card bg-base-800" />}

      {stats && (
        <Card
          title="Preference breakdown"
          description={`${stats.totalMembersWithPreference.toLocaleString()} members have set a personal language.`}
        >
          <div className="space-y-3">
            {stats.breakdown.map((row) => {
              const pct = stats.totalMembersWithPreference
                ? Math.round((row.count / stats.totalMembersWithPreference) * 100)
                : 0;
              return (
                <div key={row.code}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="text-base-200">{row.label}</span>
                    <span className="text-base-400">
                      {row.count.toLocaleString()} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-base-800">
                    <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      <p className="mt-4 text-xs text-base-500">
        Administrative / dashboard-related responses are always in English, regardless of a
        member&apos;s personal language preference.
      </p>
    </div>
  );
}
