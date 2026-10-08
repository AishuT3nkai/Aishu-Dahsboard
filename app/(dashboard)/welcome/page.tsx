"use client";

import { useConfig } from "@/lib/useConfig";
import { PageHeader } from "@/components/PageHeader";
import { SaveBar } from "@/components/SaveBar";
import { Card, FieldGroup, TextInput, TextArea, Toggle } from "@/components/ui";
import type { WelcomeGoodbyeConfig } from "@/lib/types";

function fill(template: string, memberCount: number) {
  return template
    .replaceAll("{user}", "@NewMember")
    .replaceAll("{username}", "NewMember")
    .replaceAll("{server}", "Your Server")
    .replaceAll("{member_count}", String(memberCount));
}

export default function WelcomePage() {
  const { draft, setDraft, loading, saving, error, bridgeUnconfigured, dirty, save, data } =
    useConfig<WelcomeGoodbyeConfig>("/api/dashboard/welcome");

  return (
    <div>
      <PageHeader
        title="Welcome & goodbye"
        description="Controls member-join and member-leave messages, plus autorole. No /welcome setup or /goodbye setup commands exist — this is dashboard-only."
      />
      <SaveBar
        dirty={dirty}
        saving={saving}
        error={error}
        bridgeUnconfigured={bridgeUnconfigured}
        onSave={() => save().catch(() => {})}
        onDiscard={() => setDraft(data as WelcomeGoodbyeConfig)}
      />

      {loading && <div className="h-64 animate-pulse rounded-card bg-base-800" />}

      {draft && !loading && (
        <div className="space-y-4">
          <Card title="Welcome">
            <div className="space-y-4">
              <Toggle
                label="Welcome messages enabled"
                checked={draft.welcomeEnabled}
                onChange={(v) => setDraft({ ...draft, welcomeEnabled: v })}
              />
              <FieldGroup label="Welcome channel ID">
                <TextInput
                  value={draft.welcomeChannelId ?? ""}
                  onChange={(e) => setDraft({ ...draft, welcomeChannelId: e.target.value || null })}
                  placeholder="123456789012345678"
                />
              </FieldGroup>
              <FieldGroup label="Welcome message" hint="Variables: {user} {username} {server} {member_count}">
                <TextArea
                  value={draft.welcomeMessage}
                  onChange={(e) => setDraft({ ...draft, welcomeMessage: e.target.value })}
                />
              </FieldGroup>
              <div className="rounded-card border border-base-800 bg-base-950 px-3 py-2 text-sm text-base-300">
                <span className="mr-2 text-xs uppercase tracking-wide text-base-500">Preview</span>
                {fill(draft.welcomeMessage, 128)}
              </div>
            </div>
          </Card>

          <Card title="Goodbye">
            <div className="space-y-4">
              <Toggle
                label="Goodbye messages enabled"
                checked={draft.goodbyeEnabled}
                onChange={(v) => setDraft({ ...draft, goodbyeEnabled: v })}
              />
              <FieldGroup label="Goodbye channel ID">
                <TextInput
                  value={draft.goodbyeChannelId ?? ""}
                  onChange={(e) => setDraft({ ...draft, goodbyeChannelId: e.target.value || null })}
                  placeholder="123456789012345678"
                />
              </FieldGroup>
              <FieldGroup label="Goodbye message" hint="Variables: {user} {username} {server} {member_count}">
                <TextArea
                  value={draft.goodbyeMessage}
                  onChange={(e) => setDraft({ ...draft, goodbyeMessage: e.target.value })}
                />
              </FieldGroup>
              <div className="rounded-card border border-base-800 bg-base-950 px-3 py-2 text-sm text-base-300">
                <span className="mr-2 text-xs uppercase tracking-wide text-base-500">Preview</span>
                {fill(draft.goodbyeMessage, 127)}
              </div>
            </div>
          </Card>

          <p className="text-xs text-base-500">
            Auto role has moved to its own page — see{" "}
            <a href="/autorole" className="text-accent-bright hover:underline">
              Auto role
            </a>
            .
          </p>
        </div>
      )}
    </div>
  );
}
