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
  const [bridgeUnconfigured, setBridgeUnconfigured] = useState(false);

  const load = useCallback(() => {
    if (!guildId) return;
    setLoading(true);
    fetch(`/api/dashboard/leveling/rewards?guildId=${guildId}`)
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) {
          if (body.code === "BRIDGE_NOT_CONFIGURED") setBridgeUnconfigured(true);
          return;
        }
        setRewards(body.data);
      })
      .finally(() => setLoading(false));
  }, [guildId]);

  useEffect(load, [load]);

  async function save(next: LevelRewardEntry[]) {
    if (!guildId) return;
    setRewards(next);
    await fetch(`/api/dashboard/leveling/rewards?guildId=${guildId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next),
    });
  }

  if (bridgeUnconfigured) return null;

  return (
    <Card title="Level rewards" description="Roles granted automatically when a member reaches a level.">
      {loading && <div className="h-20 animate-pulse rounded-card bg-base-800" />}
      {rewards && (
        <div className="space-y-2">
          {rewards.map((r, i) => (
            <div key={r.id} className="flex items-center gap-2">
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
              <Button variant="danger" onClick={() => save(rewards.filter((x) => x.id !== r.id))}>
                Remove
              </Button>
            </div>
          ))}
          <div className="flex justify-between pt-1">
            <Button
              variant="secondary"
              onClick={() =>
                save([...(rewards ?? []), { id: crypto.randomUUID(), level: 1, roleId: "" }])
              }
            >
              Add reward
            </Button>
            <Button variant="primary" onClick={() => save(rewards)}>
              Save rewards
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
  const [bridgeUnconfigured, setBridgeUnconfigured] = useState(false);
  const [editing, setEditing] = useState<Record<string, string>>({});

  const load = useCallback(() => {
    if (!guildId) return;
    setLoading(true);
    fetch(`/api/dashboard/leveling/users?guildId=${guildId}${search ? `&search=${encodeURIComponent(search)}` : ""}`)
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) {
          if (body.code === "BRIDGE_NOT_CONFIGURED") setBridgeUnconfigured(true);
          return;
        }
        setUsers(body.data);
      })
      .finally(() => setLoading(false));
  }, [guildId, search]);

  useEffect(load, [load]);

  async function setXp(userId: string) {
    if (!guildId) return;
    const value = Number(editing[userId]);
    if (Number.isNaN(value)) return;
    await fetch(`/api/dashboard/leveling/users/${userId}?guildId=${guildId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ xp: value }),
    });
    load();
  }

  async function resetXp(userId: string) {
    if (!guildId) return;
    await fetch(`/api/dashboard/leveling/users/${userId}/reset?guildId=${guildId}`, { method: "POST" });
    load();
  }

  if (bridgeUnconfigured) return null;

  return (
    <Card title="Member XP" description="Per-guild — XP never carries over between servers.">
      <TextInput
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by username…"
        className="mb-3"
      />
      {loading && <div className="h-24 animate-pulse rounded-card bg-base-800" />}
      {users && users.length === 0 && <p className="text-sm text-base-500">No members found.</p>}
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
                  placeholder={String(u.xp)}
                  value={editing[u.userId] ?? ""}
                  onChange={(e) => setEditing({ ...editing, [u.userId]: e.target.value })}
                />
                <div className="flex gap-1">
                  <Button variant="secondary" onClick={() => setXp(u.userId)}>
                    Set
                  </Button>
                  <Button variant="danger" onClick={() => resetXp(u.userId)}>
                    Reset
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
