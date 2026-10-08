"use client";

import { useConfig } from "@/lib/useConfig";
import { PageHeader } from "@/components/PageHeader";
import { SaveBar } from "@/components/SaveBar";
import { Card, FieldGroup, TextInput, Toggle } from "@/components/ui";
import type { AutoroleConfig } from "@/lib/types";

export default function AutorolePage() {
  const { draft, setDraft, loading, saving, error, bridgeUnconfigured, dirty, save, data } =
    useConfig<AutoroleConfig>("/api/dashboard/autorole");

  return (
    <div>
      <PageHeader title="Auto role" description="Applied automatically to every new member on join." />
      <SaveBar
        dirty={dirty}
        saving={saving}
        error={error}
        bridgeUnconfigured={bridgeUnconfigured}
        onSave={() => save().catch(() => {})}
        onDiscard={() => setDraft(data as AutoroleConfig)}
      />

      {loading && <div className="h-40 animate-pulse rounded-card bg-base-800" />}

      {draft && !loading && (
        <Card>
          <div className="space-y-4">
            <Toggle
              label="Auto role enabled"
              checked={draft.enabled}
              onChange={(v) => setDraft({ ...draft, enabled: v })}
            />
            <FieldGroup label="Role ID" hint="Granted the moment a new member joins.">
              <TextInput
                value={draft.roleId ?? ""}
                onChange={(e) => setDraft({ ...draft, roleId: e.target.value || null })}
                placeholder="123456789012345678"
              />
            </FieldGroup>
          </div>
        </Card>
      )}
    </div>
  );
}
