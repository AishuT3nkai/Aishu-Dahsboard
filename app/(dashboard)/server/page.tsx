"use client";

import { useConfig } from "@/lib/useConfig";
import { useGuild } from "@/components/GuildProvider";
import { PageHeader } from "@/components/PageHeader";
import { SaveBar } from "@/components/SaveBar";
import { Card, FieldGroup, TextInput } from "@/components/ui";
import type { ServerConfig } from "@/lib/types";

export default function ServerConfigPage() {
  const { guilds, guildId } = useGuild();
  const guild = guilds.find((g) => g.id === guildId);
  const { draft, setDraft, loading, saving, error, bridgeUnconfigured, dirty, save, data } =
    useConfig<ServerConfig>("/api/dashboard/server");

  return (
    <div>
      <PageHeader
        title="Server configuration"
        description="Basic server-wide settings. You can only select a server where you and Aishu Bot are both present."
      />
      <SaveBar
        dirty={dirty}
        saving={saving}
        error={error}
        bridgeUnconfigured={bridgeUnconfigured}
        onSave={() => save().catch(() => {})}
        onDiscard={() => setDraft(data as ServerConfig)}
      />

      <Card title="Current server" className="mb-4">
        <div className="text-sm text-base-300">
          <div>
            <span className="text-base-500">Name: </span>
            {guild?.name ?? "—"}
          </div>
          <div>
            <span className="text-base-500">ID: </span>
            <span className="font-mono">{guild?.id ?? "—"}</span>
          </div>
        </div>
      </Card>

      {loading && <div className="h-40 animate-pulse rounded-card bg-base-800" />}

      {draft && !loading && (
        <Card title="Command prefix & logging">
          <div className="grid gap-4 md:grid-cols-2">
            <FieldGroup label="Command prefix" hint="Slash commands are unaffected; this is only for any legacy prefix commands.">
              <TextInput value={draft.prefix} onChange={(e) => setDraft({ ...draft, prefix: e.target.value })} />
            </FieldGroup>
            <FieldGroup label="Moderation log channel ID">
              <TextInput
                value={draft.moderationLogChannelId ?? ""}
                onChange={(e) => setDraft({ ...draft, moderationLogChannelId: e.target.value || null })}
                placeholder="123456789012345678"
              />
            </FieldGroup>
          </div>
        </Card>
      )}
    </div>
  );
}
