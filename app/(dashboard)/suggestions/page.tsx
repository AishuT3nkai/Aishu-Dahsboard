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

  const load = useCallback(() => {
    if (!guildId) return;
    setLoading(true);
    fetch(`/api/dashboard/suggestions?guildId=${guildId}`)
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) {
          if (body.code === "BRIDGE_NOT_CONFIGURED") setBridgeUnconfigured(true);
          return;
        }
        setItems(body.data);
      })
      .finally(() => setLoading(false));
  }, [guildId]);

  useEffect(load, [load]);

  async function decide(id: string, decision: "approved" | "denied") {
    if (!guildId) return;
    await fetch(`/api/dashboard/suggestions/${id}/decide?guildId=${guildId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision }),
    });
    load();
  }

  if (bridgeUnconfigured) return null;

  return (
    <Card title="Suggestion queue">
      {loading && <div className="h-24 animate-pulse rounded-card bg-base-800" />}
      {items && items.length === 0 && <p className="text-sm text-base-500">No suggestions yet.</p>}
      {items && items.length > 0 && (
        <div className="space-y-2">
          {items.map((s) => (
            <div key={s.id} className="rounded-card border border-base-800 bg-base-950 p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-base-100">{s.username}</span>
                <Badge tone={statusTone(s.status)}>{s.status}</Badge>
              </div>
              <p className="text-sm text-base-300">{s.content}</p>
              {s.status === "pending" && (
                <div className="mt-3 flex gap-2">
                  <Button variant="primary" onClick={() => decide(s.id, "approved")}>
                    Approve
                  </Button>
                  <Button variant="danger" onClick={() => decide(s.id, "denied")}>
                    Deny
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
