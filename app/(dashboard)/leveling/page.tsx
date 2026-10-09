"use client";

import { useEffect, useState, useCallback } from "react";
import { useConfig } from "@/lib/useConfig";
import { useGuild } from "@/components/GuildProvider";
import { PageHeader } from "@/components/PageHeader";
import { SaveBar } from "@/components/SaveBar";
import { Card, FieldGroup, TextInput, NumberInput, Toggle, Button } from "@/components/ui";
import type { LevelingConfig, LevelRewardEntry, LevelingUserEntry } from "@/lib/types";

function RewardsPanel() {
  const { guildId } = useGuild();
  const [rewards, setRewards] = useState<LevelRewardEntry[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bridgeUnconfigured, setBridgeUnconfigured] = useState(false);

  const load = useCallback(async () => {
    if (!guildId) {
      setRewards(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/dashboard/leveling/rewards?guildId=${encodeURIComponent(guildId)}`);
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (body.code === "BRIDGE_NOT_CONFIGURED") setBridgeUnconfigured(true);
        throw new Error(body.error ?? "Failed to load level rewards.");
      }
      setBridgeUnconfigured(false);
      setRewards(Array.isArray(body.data) ? body.data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load level rewards.");
    } finally {
      setLoading(false);
    }
  }, [guildId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function save(next: LevelRewardEntry[]) {
    if (!guildId || saving) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/dashboard/leveling/rewards?guildId=${encodeURIComponent(guildId)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (body.code === "BRIDGE_NOT_CONFIGURED") setBridgeUnconfigured(true);
        throw new Error(body.error ?? "Failed to save level rewards.");
      }
      setRewards(Array.isArray(body.data) ? body.data : next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save level rewards.");
    } finally {
      setSaving(false);
    }
  }

  if (bridgeUnconfigured) return null;

  return (
    <Card title="Level rewards" description="Roles granted automatically when a member reaches a level.">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        {error && <p role="alert" className="text-sm text-bad">{error}</p>}
        <Button variant="secondary" onClick={() => void load()} disabled={loading || saving}>
          {loading ? "Refreshing…" : "Refresh"}
        </Button>
      </div>
      {!loading && !guildId && <p className="text-sm text-base-500">Select a Discord server to manage rewards.</p>}
      {loading && <div className="h-20 animate-pulse rounded-card bg-base-800" />}
      {rewards && (
        <div className="space-y-2">
          {rewards.map((r, i) => (
            <div key={r.id} className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <NumberInput
                className="w-24"
                value={r.level}
                min={1}
                onChange={(e) => {
                  const next = [...rewards];
                  next[i] = { ...r, level: Number(e.target.value) };
                  setRewards(next);
                }}
              />
              <TextInput
                className="flex-1"
                value={r.roleId}
                placeholder="Role ID"
                onChange={(e) => {
                  const next = [...rewards];
                  next[i] = { ...r, roleId: e.target.value };
                  setRewards(next);
                }}
              />
              <Button variant="danger" disabled={saving} onClick={() => void save(rewards.filter((x) => x.id !== r.id))}>
                Remove
              </Button>
            </div>
          ))}
          <div className="flex flex-wrap justify-between gap-2 pt-1">
            <Button
              variant="secondary"
              disabled={saving}
              onClick={() =>
                setRewards([...(rewards ?? []), { id: crypto.randomUUID(), level: 1, roleId: "" }])
              }
            >
              Add reward
            </Button>
            <Button variant="primary" disabled={saving || !rewards} onClick={() => rewards && void save(rewards)}>
              {saving ? "Saving…" : "Save rewards"}
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

function MembersPanel() {
  const { guildId } = useGuild();
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<LevelingUserEntry[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingUser, setSavingUser] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [bridgeUnconfigured, setBridgeUnconfigured] = useState(false);
  const [editing, setEditing] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    if (!guildId) {
      setUsers(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ guildId });
      if (search.trim()) params.set("search", search.trim());
      const res = await fetch(`/api/dashboard/leveling/users?${params.toString()}`);
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (body.code === "BRIDGE_NOT_CONFIGURED") setBridgeUnconfigured(true);
        throw new Error(body.error ?? "Failed to load member XP.");
      }
      setBridgeUnconfigured(false);
      setUsers(Array.isArray(body.data) ? body.data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load member XP.");
    } finally {
      setLoading(false);
    }
  }, [guildId, search]);

  useEffect(() => {
    void load();
  }, [load]);

  async function setXp(userId: string) {
    if (!guildId || savingUser) return;
    const rawValue = editing[userId];
    if (rawValue === undefined || rawValue.trim() === "") {
      setError("Enter an XP value before saving.");
      return;
    }
    const value = Number(rawValue);
    if (!Number.isSafeInteger(value) || value < 0) {
      setError("XP must be a whole number of zero or greater.");
      return;
    }
    setSavingUser(userId);
    setError(null);
    try {
      const res = await fetch(`/api/dashboard/leveling/users/${encodeURIComponent(userId)}?guildId=${encodeURIComponent(guildId)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ xp: value }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "Failed to update member XP.");
      setEditing((current) => {
        const next = { ...current };
        delete next[userId];
        return next;
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update member XP.");
    } finally {
      setSavingUser(null);
    }
  }

  async function resetXp(userId: string) {
    if (!guildId || savingUser) return;
    setSavingUser(userId);
    setError(null);
    try {
      const res = await fetch(`/api/dashboard/leveling/users/${encodeURIComponent(userId)}/reset?guildId=${encodeURIComponent(guildId)}`, { method: "POST" });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "Failed to reset member XP.");
      setEditing((current) => {
        const next = { ...current };
        delete next[userId];
        return next;
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset member XP.");
    } finally {
      setSavingUser(null);
    }
  }

  if (bridgeUnconfigured) return null;

  return (
    <Card title="Member XP" description="Per-guild — XP never carries over between servers.">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <TextInput
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by username…"
          className="min-w-0 flex-1"
        />
        <Button variant="secondary" onClick={() => void load()} disabled={loading || savingUser !== null}>
          {loading ? "Refreshing…" : "Refresh"}
        </Button>
      </div>
      {error && <p role="alert" className="mb-3 text-sm text-bad">{error}</p>}
      {!loading && !guildId && <p className="text-sm text-base-500">Select a Discord server to manage member XP.</p>}
      {loading && <div className="h-24 animate-pulse rounded-card bg-base-800" />}
      {!loading && users && users.length === 0 && <p className="text-sm text-base-500">No members found.</p>}
      {users && users.length > 0 && (
        <div className="overflow-x-auto">
          <div className="min-w-[520px] space-y-1.5">
            {users.map((u) => (
              <div
                key={u.userId}
                className="grid grid-cols-[2rem_1fr_auto_auto_auto] items-center gap-2 rounded-card border border-base-800 bg-base-950 px-3 py-2 text-sm"
              >
                <span className="text-base-500">#{u.rank}</span>
                <span className="truncate text-base-100">{u.username}</span>
                <span className="text-base-400">Lvl {u.level}</span>
                <TextInput
                  className="w-24"
                  inputType="number"
                  min={0}
                  placeholder={String(u.xp)}
                  value={editing[u.userId] ?? ""}
                  onChange={(e) => setEditing({ ...editing, [u.userId]: e.target.value })}
                />
                <div className="flex gap-1">
                  <Button variant="secondary" disabled={savingUser !== null} onClick={() => void setXp(u.userId)}>
                    {savingUser === u.userId ? "Saving…" : "Set"}
                  </Button>
                  <Button variant="danger" disabled={savingUser !== null} onClick={() => void resetXp(u.userId)}>
                    {savingUser === u.userId ? "Working…" : "Reset"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

export default function LevelingPage() {
  const { draft, setDraft, loading, saving, error, bridgeUnconfigured, dirty, save, data } =
    useConfig<LevelingConfig>("/api/dashboard/leveling/config");

  return (
    <div>
      <PageHeader
        title="Leveling"
        description="XP is per-guild — a member's level on this server never carries over to another."
      />
      <SaveBar
        dirty={dirty}
        saving={saving}
        error={error}
        bridgeUnconfigured={bridgeUnconfigured}
        onSave={() => save().catch(() => {})}
        onDiscard={() => setDraft(data as LevelingConfig)}
      />

      {loading && <div className="h-64 animate-pulse rounded-card bg-base-800" />}

      {draft && !loading && (
        <div className="space-y-4">
          <Card>
            <Toggle
              label="Leveling enabled"
              checked={draft.enabled}
              onChange={(v) => setDraft({ ...draft, enabled: v })}
            />
          </Card>

          <Card title="XP gain">
            <div className="grid gap-4 md:grid-cols-2">
              <FieldGroup label="Minimum XP per message">
                <NumberInput
                  min={0}
                  value={draft.xpPerMessage.min}
                  onChange={(e) =>
                    setDraft({ ...draft, xpPerMessage: { ...draft.xpPerMessage, min: Number(e.target.value) } })
                  }
                />
              </FieldGroup>
              <FieldGroup label="Maximum XP per message">
                <NumberInput
                  min={0}
                  value={draft.xpPerMessage.max}
                  onChange={(e) =>
                    setDraft({ ...draft, xpPerMessage: { ...draft.xpPerMessage, max: Number(e.target.value) } })
                  }
                />
              </FieldGroup>
              <FieldGroup label="XP cooldown (seconds)" hint="Minimum time between XP-earning messages per member.">
                <NumberInput
                  min={0}
                  value={draft.xpCooldownSeconds}
                  onChange={(e) => setDraft({ ...draft, xpCooldownSeconds: Number(e.target.value) })}
                />
              </FieldGroup>
              <FieldGroup label="XP multiplier">
                <NumberInput
                  min={0.1}
                  step={0.1}
                  value={draft.xpMultiplier}
                  onChange={(e) => setDraft({ ...draft, xpMultiplier: Number(e.target.value) })}
                />
              </FieldGroup>
            </div>
            <div className="mt-4">
              <Toggle
                label="Anti-spam XP protection"
                description="Suppresses XP from rapid, repeated, or low-effort messages."
                checked={draft.antiSpamEnabled}
                onChange={(v) => setDraft({ ...draft, antiSpamEnabled: v })}
              />
            </div>
          </Card>

          <Card title="Level-up announcements">
            <div className="grid gap-4 md:grid-cols-2">
              <FieldGroup label="Level-up channel ID" hint="Leave blank to announce in the channel the member leveled up in.">
                <TextInput
                  value={draft.levelUpChannelId ?? ""}
                  onChange={(e) => setDraft({ ...draft, levelUpChannelId: e.target.value || null })}
                  placeholder="123456789012345678"
                />
              </FieldGroup>
              <FieldGroup label="Level-up message" hint="Supports {username} and {level}.">
                <TextInput
                  value={draft.levelUpMessage}
                  onChange={(e) => setDraft({ ...draft, levelUpMessage: e.target.value })}
                />
              </FieldGroup>
            </div>
          </Card>

          <Card title="Exclusions">
            <div className="grid gap-4 md:grid-cols-2">
              <FieldGroup label="Excluded channel IDs" hint="Comma-separated.">
                <TextInput
                  value={draft.excludedChannelIds.join(",")}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      excludedChannelIds: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                    })
                  }
                />
              </FieldGroup>
              <FieldGroup label="Excluded role IDs" hint="Comma-separated.">
                <TextInput
                  value={draft.excludedRoleIds.join(",")}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      excludedRoleIds: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                    })
                  }
                />
              </FieldGroup>
            </div>
          </Card>

          <RewardsPanel />
          <MembersPanel />
        </div>
      )}
    </div>
  );
}
