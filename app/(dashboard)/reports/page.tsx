"use client";

import { useEffect, useState, useCallback } from "react";
import { useConfig } from "@/lib/useConfig";
import { useGuild } from "@/components/GuildProvider";
import { PageHeader } from "@/components/PageHeader";
import { SaveBar } from "@/components/SaveBar";
import { Card, FieldGroup, TextInput, Button, Badge } from "@/components/ui";
import type { ReportConfig, ReportEntry } from "@/lib/types";

function ReportsList() {
  const { guildId } = useGuild();
  const [items, setItems] = useState<ReportEntry[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [bridgeUnconfigured, setBridgeUnconfigured] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionPending, setActionPending] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "open" | "closed">("open");

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
      const res = await fetch(`/api/dashboard/reports?guildId=${encodeURIComponent(guildId)}`);
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (body.code === "BRIDGE_NOT_CONFIGURED") setBridgeUnconfigured(true);
        throw new Error(body.error ?? "Failed to load reports.");
      }
      setBridgeUnconfigured(false);
      setItems(Array.isArray(body.data) ? body.data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load reports.");
    } finally {
      setLoading(false);
    }
  }, [guildId]);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredItems = (items ?? []).filter((report) => {
    const query = search.trim().toLocaleLowerCase();
    const matchesSearch = !query || [report.username, report.userId, report.content, report.id]
      .some((value) => value.toLocaleLowerCase().includes(query));
    return matchesSearch && (statusFilter === "all" || report.status === statusFilter);
  }).sort((a, b) => {
    const aTime = Date.parse(a.createdAt);
    const bTime = Date.parse(b.createdAt);
    return (Number.isNaN(bTime) ? 0 : bTime) - (Number.isNaN(aTime) ? 0 : aTime);
  });

  async function close(id: string) {
    if (!guildId) return;
    const selected = items?.find((report) => report.id === id);
    if (!window.confirm(`Mark the report from ${selected?.username ?? "this member"} as closed?`)) return;
    setError(null);
    setActionPending(id);
    try {
      const res = await fetch(`/api/dashboard/reports/${encodeURIComponent(id)}/close?guildId=${encodeURIComponent(guildId)}`, { method: "POST" });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "Failed to close report.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to close report.");
    } finally {
      setActionPending(null);
    }
  }

  return (
    <Card title="Reports" description="Private reports submitted with /report.">
      <div className="mb-3 flex justify-end">
        <Button variant="secondary" onClick={() => void load()} disabled={loading || !guildId}>
          {loading ? "Refreshing…" : "Refresh"}
        </Button>
      </div>
      {error && <div role="alert" className="mb-3 text-sm text-bad">{error}</div>}
      {bridgeUnconfigured && (
        <p className="mb-3 text-sm text-base-400">
          The bot bridge is not configured, so live reports cannot be loaded yet. Configure the bridge before using this panel.
        </p>
      )}
      {!loading && !guildId && <p className="text-sm text-base-500">Select a Discord server to view reports.</p>}
      {loading && <div className="h-24 animate-pulse rounded-card bg-base-800" />}
      {!loading && guildId && !bridgeUnconfigured && !error && items && items.length === 0 && <p className="text-sm text-base-500">No reports yet.</p>}
      {!loading && guildId && !bridgeUnconfigured && items && items.length > 0 && (
        <>
          <div className="mb-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_160px]">
            <FieldGroup label="Search reports" hint="Search reporter, user ID, report text, or report ID.">
              <TextInput value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search reports…" />
            </FieldGroup>
            <FieldGroup label="Status">
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as "all" | "open" | "closed")} className="focus-ring w-full rounded-card border border-base-700 bg-base-900 px-3 py-2 text-sm text-base-100">
                <option value="open">Open only</option>
                <option value="closed">Closed only</option>
                <option value="all">All reports</option>
              </select>
            </FieldGroup>
          </div>
          <p className="mb-3 text-xs text-base-500">Showing {filteredItems.length} of {items.length} report{items.length === 1 ? "" : "s"} · newest first</p>
          {filteredItems.length === 0 ? (
            <p className="text-sm text-base-500">No reports match these filters.</p>
          ) : (
            <div className="space-y-2">
              {filteredItems.map((r) => (
                <div key={r.id} className="rounded-card border border-base-800 bg-base-950 p-3">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-base-100">{r.username}</span>
                    <Badge tone={r.status === "open" ? "warn" : "neutral"}>{r.status}</Badge>
                  </div>
                  <p className="whitespace-pre-wrap break-words text-sm text-base-300">{r.content}</p>
                  <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-base-500">
                    <span>{new Date(r.createdAt).toLocaleString()}</span>
                    <span>User ID: {r.userId}</span>
                  </div>
                  {r.status === "open" && (
                    <div className="mt-3">
                      <Button variant="secondary" disabled={actionPending !== null} onClick={() => close(r.id)}>
                        {actionPending === r.id ? "Closing…" : "Mark closed"}
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

export default function ReportsPage() {
  const { draft, setDraft, loading, saving, error, bridgeUnconfigured, dirty, save, data } =
    useConfig<ReportConfig>("/api/dashboard/reports/config");

  return (
    <div>
      <PageHeader title="Reports" description="Review member reports privately — never posted publicly." />
      <SaveBar
        dirty={dirty}
        saving={saving}
        error={error}
        bridgeUnconfigured={bridgeUnconfigured}
        onSave={() => save().catch(() => {})}
        onDiscard={() => setDraft(data as ReportConfig)}
      />

      {loading && <div className="h-24 animate-pulse rounded-card bg-base-800" />}

      {draft && !loading && (
        <div className="space-y-4">
          <Card title="Report channel">
            <FieldGroup label="Channel ID" hint="Where /report sends submissions. Keep this private/staff-only.">
              <TextInput
                value={draft.channelId ?? ""}
                onChange={(e) => setDraft({ ...draft, channelId: e.target.value || null })}
                placeholder="123456789012345678"
              />
            </FieldGroup>
          </Card>
          <ReportsList />
        </div>
      )}
    </div>
  );
}
