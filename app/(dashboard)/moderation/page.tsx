"use client";

import { useEffect, useState, useCallback } from "react";
import { useConfig } from "@/lib/useConfig";
import { useGuild } from "@/components/GuildProvider";
import { PageHeader } from "@/components/PageHeader";
import { SaveBar } from "@/components/SaveBar";
import { Card, FieldGroup, TextInput, Button, Badge } from "@/components/ui";
import type { ModerationConfig, WarningEntry } from "@/lib/types";

function WarningsPanel() {
  const { guildId } = useGuild();
  const [warnings, setWarnings] = useState<WarningEntry[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

  const load = useCallback(async () => {
    if (!guildId) {
      setWarnings(null);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/dashboard/moderation/warnings?guildId=${encodeURIComponent(guildId)}`);
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body.error ?? "Failed to load warnings.");
      }
      setWarnings(Array.isArray(body.data) ? body.data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load warnings.");
    } finally {
      setLoading(false);
    }
  }, [guildId]);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredWarnings = (warnings ?? [])
    .filter((warning) => {
      const query = search.trim().toLocaleLowerCase();
      if (!query) return true;
      return [warning.username, warning.userId, warning.moderatorId, warning.reason, warning.id]
        .some((value) => value.toLocaleLowerCase().includes(query));
    })
    .sort((a, b) => {
      const aTime = Date.parse(a.createdAt);
      const bTime = Date.parse(b.createdAt);
      const safeA = Number.isNaN(aTime) ? 0 : aTime;
      const safeB = Number.isNaN(bTime) ? 0 : bTime;
      return sortOrder === "newest" ? safeB - safeA : safeA - safeB;
    });

  async function clear(warningId: string) {
    if (!guildId) return;
    const selected = warnings?.find((warning) => warning.id === warningId);
    if (!window.confirm(`Clear this warning for ${selected?.username ?? "this user"}? This cannot be undone.`)) return;
    setError(null);
    try {
      const params = new URLSearchParams({ guildId, warningId });
      const res = await fetch(`/api/dashboard/moderation/warnings?${params.toString()}`, {
        method: "DELETE",
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "Failed to clear warning.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to clear warning.");
    }
  }

  return (
    <Card title="Warnings" description="Every warning issued via /warn across the server.">
      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-xs text-base-500">{warnings?.length ?? 0} warning{warnings?.length === 1 ? "" : "s"} on record</div>
        <Button variant="secondary" onClick={() => void load()} disabled={loading}>
          {loading ? "Refreshing…" : "Refresh"}
        </Button>
      </div>
      {loading && <div className="h-24 animate-pulse rounded-card bg-base-800" />}
      {!loading && !guildId && (
        <p className="text-sm text-base-500">Select a Discord server to view its warnings.</p>
      )}
      {error && <div role="alert" className="text-sm text-bad">{error}</div>}
      {warnings && warnings.length > 0 && (
        <div className="mb-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_180px]">
          <FieldGroup label="Search warning records" hint="Search username, user ID, moderator ID, reason, or warning ID.">
            <TextInput value={search} onChange={(event) => setSearch(event.target.value)} placeholder="e.g. spam, user ID, or reason" />
          </FieldGroup>
          <FieldGroup label="Sort by date">
            <select value={sortOrder} onChange={(event) => setSortOrder(event.target.value as "newest" | "oldest")} className="focus-ring w-full rounded-card border border-base-700 bg-base-900 px-3 py-2 text-sm text-base-100">
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>
          </FieldGroup>
        </div>
      )}
      {warnings && warnings.length === 0 && <p className="text-sm text-base-500">No warnings on record.</p>}
      {warnings && warnings.length > 0 && filteredWarnings.length === 0 && <p className="text-sm text-base-500">No warnings match “{search}”. Try another name, ID, or keyword.</p>}
      {warnings && filteredWarnings.length > 0 && (
        <div className="space-y-2">
          {filteredWarnings.map((w) => (
            <div
              key={w.id}
              className="flex flex-col gap-2 rounded-card border border-base-800 bg-base-950 p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <div className="text-sm font-medium text-base-100">{w.username}</div>
                <div className="break-words text-xs text-base-400">{w.reason || "No reason provided"}</div>
                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-base-500">
                  <span>{new Date(w.createdAt).toLocaleString()}</span>
                  <span>User ID: {w.userId}</span>
                  <span>Moderator ID: {w.moderatorId}</span>
                </div>
              </div>
              <Button variant="danger" onClick={() => clear(w.id)} className="shrink-0">
                Clear
              </Button>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

export default function ModerationPage() {
  const { draft, setDraft, loading, saving, error, bridgeUnconfigured, dirty, save, data } =
    useConfig<ModerationConfig>("/api/dashboard/moderation");

  return (
    <div>
      <PageHeader
        title="Moderation"
        description="Configuration for warn / timeout / kick / ban / purge / lock. The bot never lets a moderation action target a user at or above its own role."
      />
      <SaveBar
        dirty={dirty}
        saving={saving}
        error={error}
        bridgeUnconfigured={bridgeUnconfigured}
        onSave={() => save().catch(() => {})}
        onDiscard={() => setDraft(data as ModerationConfig)}
      />

      {loading && <div className="h-40 animate-pulse rounded-card bg-base-800" />}

      {draft && !loading && (
        <div className="space-y-4">
          <Card title="Logging">
            <div className="grid gap-4 md:grid-cols-2">
              <FieldGroup label="Moderation log channel ID" hint="warn/timeout/kick/ban/purge/lock actions are posted here.">
                <TextInput
                  value={draft.logChannelId ?? ""}
                  onChange={(e) => setDraft({ ...draft, logChannelId: e.target.value || null })}
                  placeholder="123456789012345678"
                />
              </FieldGroup>
              <FieldGroup label="Mute / timeout role ID" hint="Optional fallback role if native Discord timeouts aren't used.">
                <TextInput
                  value={draft.muteRoleId ?? ""}
                  onChange={(e) => setDraft({ ...draft, muteRoleId: e.target.value || null })}
                  placeholder="123456789012345678"
                />
              </FieldGroup>
            </div>
          </Card>

          <Card title="Role hierarchy" className="border-base-800">
            <div className="flex flex-wrap gap-2">
              <Badge tone="good">Bot respects Discord role hierarchy</Badge>
              <Badge tone="good">Dashboard cannot bypass permissions</Badge>
            </div>
          </Card>

          <WarningsPanel />
        </div>
      )}
    </div>
  );
}
