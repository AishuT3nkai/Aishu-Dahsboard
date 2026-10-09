"use client";

import { useConfig } from "@/lib/useConfig";
import { PageHeader } from "@/components/PageHeader";
import { SaveBar } from "@/components/SaveBar";
import { Card, FieldGroup, TextInput, TextArea, Toggle } from "@/components/ui";
import type { AutomodConfig } from "@/lib/types";

export default function AutoModPage() {
  const { draft, setDraft, loading, saving, error, bridgeUnconfigured, dirty, save, data } =
    useConfig<AutomodConfig>("/api/dashboard/automod");
  const update = (patch: Partial<AutomodConfig>) => {
    if (draft) setDraft({ ...draft, ...patch });
  };

  return (
    <div>
      <PageHeader title="AutoMod" description="Automatic spam, link, mention, and blocked-word protection." />
      <SaveBar dirty={dirty} saving={saving} error={error} bridgeUnconfigured={bridgeUnconfigured}
        onSave={() => save().catch(() => {})} onDiscard={() => setDraft(data as AutomodConfig)} />
      {loading && <div className="h-40 animate-pulse rounded-card bg-base-800" />}
      {draft && !loading && <div className="space-y-4">
        <Card title="Protection status">
          <Toggle label="Enable AutoMod" description="Run automatic checks on messages in this server."
            checked={draft.enabled} onChange={(v) => update({ enabled: v })} />
        </Card>
        <Card title="Message filters">
          <div className="space-y-4">
            <Toggle label="Spam detection" checked={draft.spam_enabled} onChange={(v) => update({ spam_enabled: v })} />
            {draft.spam_enabled && <div className="grid gap-4 md:grid-cols-2">
              <FieldGroup label="Messages"><TextInput type="number" min={2} max={20} value={draft.spam_messages} onChange={(e) => update({ spam_messages: Number(e.target.value) })} /></FieldGroup>
              <FieldGroup label="Window (seconds)"><TextInput type="number" min={2} max={60} value={draft.spam_window} onChange={(e) => update({ spam_window: Number(e.target.value) })} /></FieldGroup>
            </div>}
            <Toggle label="Duplicate messages" checked={draft.duplicate_enabled} onChange={(v) => update({ duplicate_enabled: v })} />
            {draft.duplicate_enabled && <div className="grid gap-4 md:grid-cols-2">
              <FieldGroup label="Repeated messages"><TextInput type="number" min={2} max={20} value={draft.duplicate_messages} onChange={(e) => update({ duplicate_messages: Number(e.target.value) })} /></FieldGroup>
              <FieldGroup label="Window (seconds)"><TextInput type="number" min={2} max={60} value={draft.duplicate_window} onChange={(e) => update({ duplicate_window: Number(e.target.value) })} /></FieldGroup>
            </div>}
            <Toggle label="Excessive mentions" checked={draft.mention_enabled} onChange={(v) => update({ mention_enabled: v })} />
            {draft.mention_enabled && <FieldGroup label="Maximum mentions"><TextInput type="number" min={1} max={20} value={draft.max_mentions} onChange={(e) => update({ max_mentions: Number(e.target.value) })} /></FieldGroup>}
            <Toggle label="Block links" checked={draft.links_enabled} onChange={(v) => update({ links_enabled: v })} />
            <Toggle label="Block Discord invites" checked={draft.invites_enabled} onChange={(v) => update({ invites_enabled: v })} />
          </div>
        </Card>
        <Card title="Blocked words" description="One word or phrase per line. Matching is case-insensitive.">
          <FieldGroup label="Keyword list" hint="Up to 100 entries; configure the exact words you want removed.">
            <TextArea rows={8} value={draft.keywords.join("\n")}
              onChange={(e) => update({ keywords: e.target.value.split("\n").map((s) => s.trim()).filter(Boolean).slice(0, 100) })}
              placeholder={"word to block\nphrase to block"} />
          </FieldGroup>
        </Card>
        <Card title="Repeat-offense policy" description="With escalation enabled, the first violation is deleted and warned; another violation of the same rule within 10 minutes triggers a timeout.">
          <Toggle label="Escalate repeat violations" checked={draft.escalation} onChange={(v) => update({ escalation: v })} />
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <FieldGroup label="Timeout duration (minutes)"><TextInput type="number" min={1} max={60} value={draft.timeout_minutes} onChange={(e) => update({ timeout_minutes: Number(e.target.value) })} /></FieldGroup>
            <FieldGroup label="Action cooldown (seconds)"><TextInput type="number" min={0} max={60} value={draft.action_cooldown} onChange={(e) => update({ action_cooldown: Number(e.target.value) })} /></FieldGroup>
          </div>
        </Card>
      </div>}
    </div>
  );
}
