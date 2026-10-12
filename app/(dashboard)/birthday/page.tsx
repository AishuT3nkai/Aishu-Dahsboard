"use client";

import { useConfig } from "@/lib/useConfig";
import { PageHeader } from "@/components/PageHeader";
import { SaveBar } from "@/components/SaveBar";
import { Card, FieldGroup, TextInput, Toggle } from "@/components/ui";
import type { BirthdayConfig } from "@/lib/types";

export default function BirthdayPage() {
  const { draft, setDraft, loading, saving, error, bridgeUnconfigured, dirty, save, data } =
    useConfig<BirthdayConfig>("/api/dashboard/birthday");

  return (
    <div>
      <PageHeader
        title="Birthday"
        description="Members manage their own birthday with /birthday set/view/remove — only month and day are stored."
      />
      <Card
        title="Announcement controls are not fully live"
        description="The bot currently announces birthdays whenever a birthday channel is configured. The enabled toggle and custom announcement format are saved, but the current bot runtime does not apply them yet. Do not rely on the toggle to disable announcements."
      />
      <SaveBar
        dirty={dirty}
        saving={saving}
        error={error}
        bridgeUnconfigured={bridgeUnconfigured}
        onSave={() => save().catch(() => {})}
        onDiscard={() => setDraft(data as BirthdayConfig)}
      />

      {loading && <div className="h-48 animate-pulse rounded-card bg-base-800" />}

      {draft && !loading && (
        <Card>
          <div className="space-y-4">
            <Toggle
              label="Birthday announcements enabled"
              checked={draft.enabled}
              onChange={(v) => setDraft({ ...draft, enabled: v })}
            />
            <FieldGroup label="Announcement channel ID">
              <TextInput
                value={draft.channelId ?? ""}
                onChange={(e) => setDraft({ ...draft, channelId: e.target.value || null })}
                placeholder="123456789012345678"
              />
            </FieldGroup>
            <FieldGroup label="Announcement format" hint="Supports {username}.">
              <TextInput
                value={draft.announcementFormat}
                onChange={(e) => setDraft({ ...draft, announcementFormat: e.target.value })}
                placeholder="🎉 Happy birthday, {username}!"
              />
            </FieldGroup>
          </div>
        </Card>
      )}
    </div>
  );
}
