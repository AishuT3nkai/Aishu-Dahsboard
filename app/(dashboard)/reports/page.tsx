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

  const load = useCallback(async () => {
    if (!guildId) {
      setItems(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
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

  async function close(id: string) {
    if (!guildId) return;
    setError(null);
    try {
      const res = await fetch(`/api/dashboard/reports/${encodeURIComponent(id)}/close?guildId=${encodeURIComponent(guildId)}`, { method: "POST" });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "Failed to close report.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to close report.");
    }
  }

  if (bridgeUnconfigured) return null;

  return (
    <Card title="Reports" description="Private reports submitted with /report.">
      <div className="mb-3 flex justify-end">
        <Button variant="secondary" onClick={() => void load()} disabled={loading}>
          {loading ? "Refreshing…" : "Refresh"}
        </Button>
      </div>
      {error && <div role="alert" className="mb-3 text-sm text-bad">{error}</div>}
      {!loading && !guildId && <p className="text-sm text-base-500">Select a Discord server to view reports.</p>}
      {loading && <div className="h-24 animate-pulse rounded-card bg-base-800" />}
      {items && items.length === 0 && <p className="text-sm text-base-500">No reports yet.</p>}
      {items && items.length > 0 && (
        <div className="space-y-2">
          {items.map((r) => (
            <div key={r.id} className="rounded-card border border-base-800 bg-base-950 p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-base-100">{r.username}</span>
                <Badge tone={r.status === "open" ? "warn" : "neutral"}>{r.status}</Badge>
              </div>
              <p className="text-sm text-base-300">{r.content}</p>
              {r.status === "open" && (
                <div className="mt-3">
                  <Button variant="secondary" onClick={() => close(r.id)}>
                    Mark closed
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
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
