"use client";

import { useGuild } from "./GuildProvider";

export function GuildSwitcher() {
  const { guilds, guildId, setGuildId, loading, error } = useGuild();

  if (loading) return <div className="h-9 w-48 animate-pulse rounded-card bg-base-800" />;

  if (error) {
    return <div className="rounded-card border border-bad/30 bg-bad/10 px-3 py-2 text-xs text-bad">{error}</div>;
  }

  if (guilds.length === 0) {
    return (
      <div className="rounded-card border border-warn/30 bg-warn/10 px-3 py-2 text-xs text-warn">
        No servers found where you and Aishu Bot are both present and manageable.
      </div>
    );
  }

  return (
    <select
      value={guildId ?? ""}
      onChange={(e) => setGuildId(e.target.value)}
      className="focus-ring rounded-card border border-base-700 bg-base-900 px-3 py-2 text-sm text-base-100"
    >
      {guilds.map((g) => (
        <option key={g.id} value={g.id}>
          {g.name}
        </option>
      ))}
    </select>
  );
}
