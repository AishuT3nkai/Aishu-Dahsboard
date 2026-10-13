"use client";

import { useEffect, useState, useCallback } from "react";
import { useConfig } from "@/lib/useConfig";
import { useGuild } from "@/components/GuildProvider";
import { PageHeader } from "@/components/PageHeader";
import { SaveBar } from "@/components/SaveBar";
import { Card, FieldGroup, TextInput, Button, Badge } from "@/components/ui";
import type { SuggestionConfig, SuggestionEntry } from "@/lib/types";

function statusTone(status: SuggestionEntry["status"]) {
  if (status === "approved") return "good" as const;
  if (status === "denied") return "bad" as const;
  return "warn" as const;
}

function SuggestionsList() {
  const { guildId } = useGuild();
  const [items, setItems] = useState<SuggestionEntry[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [bridgeUnconfigured, setBridgeUnconfigured] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionPending, setActionPending] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | SuggestionEntry["status"]>("pending");

  const load = useCallback(async () => {
    if (!guildId) {
      setItems(null);
      setError(null);
      setBridgeUnconfigured(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    setItems(null);
    setError(null);
    setBridgeUnconfigured(false);
    try {
      const res = await fetch(`/api/dashboard/suggestions?guildId=${encodeURIComponent(guildId)}`);
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (body.code === "BRIDGE_NOT_CONFIGURED") setBridgeUnconfigured(true);
        throw new Error(body.error ?? "Failed to load suggestions.");
      }
      setBridgeUnconfigured(false);
      setItems(Array.isArray(body.data) ? body.data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load suggestions.");
    } finally {
      setLoading(false);
    }
  }, [guildId]);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredItems = (items ?? []).filter((suggestion) => {
    const query = search.trim().toLocaleLowerCase();
    const matchesSearch = !query || [suggestion.username, suggestion.userId, suggestion.content, suggestion.id]
      .some((value) => value.toLocaleLowerCase().includes(query));
    return matchesSearch && (statusFilter === "all" || suggestion.status === statusFilter);
  }).sort((a, b) => {
    const aTime = Date.parse(a.createdAt);
    const bTime = Date.parse(b.createdAt);
    return (Number.isNaN(bTime) ? 0 : bTime) - (Number.isNaN(aTime) ? 0 : aTime);
  });

  async function decide(id: string, decision: "approved" | "denied") {
    if (!guildId) return;
    setError(null);
    setActionPending(id);
    try {
      const res = await fetch(`/api/dashboard/suggestions/${encodeURIComponent(id)}/decide?guildId=${encodeURIComponent(guildId)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? `Failed to ${decision} suggestion.`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${decision} suggestion.`);
    } finally {
      setActionPending(null);
    }
  }

  return (
    <Card title="Suggestion queue">
      <div className="mb-3 flex justify-end">
        <Button variant="secondary" onClick={() => void load()} disabled={loading || !guildId}>
          {loading ? "Refreshing…" : "Refresh"}
        </Button>
      </div>
      {error && <div role="alert" className="mb-3 text-sm text-bad">{error}</div>}
      {bridgeUnconfigured && (
        <p className="mb-3 text-sm text-base-400">
          The bot bridge is not configured, so live suggestions cannot be loaded yet. Configure the bridge before using this queue.
        </p>
      )}
      {!loading && !guildId && <p className="text-sm text-base-500">Select a Discord server to view suggestions.</p>}
      {loading && <div className="h-24 animate-pulse rounded-card bg-base-800" />}
      {!loading && guildId && !bridgeUnconfigured && !error && items && items.length === 0 && <p className="text-sm text-base-500">No suggestions yet.</p>}
      {!loading && guildId && !bridgeUnconfigured && items && items.length > 0 && (
        <>
          <div className="mb-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_160px]">
            <FieldGroup label="Search suggestions" hint="Search author, user ID, suggestion text, or suggestion ID.">
              <TextInput value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search suggestions…" />
            </FieldGroup>
            <FieldGroup label="Status">
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as "all" | SuggestionEntry["status"])} className="focus-ring w-full rounded-card border border-base-700 bg-base-900 px-3 py-2 text-sm text-base-100">
                <option value="pending">Pending only</option>
                <option value="approved">Approved only</option>
                <option value="denied">Denied only</option>
                <option value="all">All suggestions</option>
              </select>
            </FieldGroup>
          </div>
          <p className="mb-3 text-xs text-base-500">Showing {filteredItems.length} of {items.length} suggestion{items.length === 1 ? "" : "s"} · newest first</p>
          {filteredItems.length === 0 ? (
            <p className="text-sm text-base-500">No suggestions match these filters.</p>
          ) : (
            <div className="space-y-2">
              {filteredItems.map((s) => (
                <div key={s.id} className="rounded-card border border-base-800 bg-base-950 p-3">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-base-100">{s.username}</span>
                    <Badge tone={statusTone(s.status)}>{s.status}</Badge>
                  </div>
                  <p className="whitespace-pre-wrap break-words text-sm text-base-300">{s.content}</p>
                  <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-base-500">
                    <span>{new Date(s.createdAt).toLocaleString()}</span>
                    <span>User ID: {s.userId}</span>
                  </div>
                  {s.note && <p className="mt-2 rounded-card bg-base-900 p-2 text-xs text-base-400">Decision note: {s.note}</p>}
                  {s.status === "pending" && (
                    <div className="mt-3 flex gap-2">
                      <Button variant="primary" disabled={actionPending !== null} onClick={() => decide(s.id, "approved")}>
                        {actionPending === s.id ? "Saving…" : "Approve"}
                      </Button>
                      <Button variant="danger" disabled={actionPending !== null} onClick={() => decide(s.id, "denied")}>
                        {actionPending === s.id ? "Saving…" : "Deny"}
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </Card>
  );
}

export default function SuggestionsPage() {
  const { draft, setDraft, loading, saving, error, bridgeUnconfigured, dirty, save, data } =
    useConfig<SuggestionConfig>("/api/dashboard/suggestions/config");

  return (
    <div>
      <PageHeader title="Suggestions" description="Review, approve, or deny suggestions submitted with /suggest." />
      <SaveBar
        dirty={dirty}
        saving={saving}
        error={error}
        bridgeUnconfigured={bridgeUnconfigured}
        onSave={() => save().catch(() => {})}
        onDiscard={() => setDraft(data as SuggestionConfig)}
      />

      {loading && <div className="h-24 animate-pulse rounded-card bg-base-800" />}

      {draft && !loading && (
        <div className="space-y-4">
          <Card title="Suggestion channel">
            <FieldGroup label="Channel ID" hint="Where /suggest posts submissions for review.">
              <TextInput
                value={draft.channelId ?? ""}
                onChange={(e) => setDraft({ ...draft, channelId: e.target.value || null })}
                placeholder="123456789012345678"
              />
            </FieldGroup>
          </Card>
          <SuggestionsList />
        </div>
      )}
    </div>
  );
}
