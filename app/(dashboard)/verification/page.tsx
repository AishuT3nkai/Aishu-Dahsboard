"use client";

import { useConfig } from "@/lib/useConfig";
import { PageHeader } from "@/components/PageHeader";
import { SaveBar } from "@/components/SaveBar";
import { Card, FieldGroup, TextInput, NumberInput, Toggle } from "@/components/ui";
import type { VerificationConfig } from "@/lib/types";

export default function VerificationPage() {
  const { draft, setDraft, loading, saving, error, bridgeUnconfigured, dirty, save, data } =
    useConfig<VerificationConfig>("/api/dashboard/verification");

  return (
    <div>
      <PageHeader
        title="Verification"
        description="Controls the /verify check. Configuration is dashboard-only — there is no /verification setup command."
      />
      <SaveBar
        dirty={dirty}
        saving={saving}
        error={error}
        bridgeUnconfigured={bridgeUnconfigured}
        onSave={() => save().catch(() => {})}
        onDiscard={() => setDraft(data as VerificationConfig)}
      />

      {loading && <div className="h-64 animate-pulse rounded-card bg-base-800" />}

      {draft && !loading && (
        <div className="space-y-4">
          <Card>
            <Toggle
              label="Verification enabled"
              description="When off, /verify and /verificationinfo still exist but the gate is disabled."
              checked={draft.enabled}
              onChange={(v) => setDraft({ ...draft, enabled: v })}
            />
          </Card>

          <Card title="Where and who">
            <div className="grid gap-4 md:grid-cols-2">
              <FieldGroup label="Verification channel ID" hint="Where the verification prompt is posted.">
                <TextInput
                  value={draft.channelId ?? ""}
                  onChange={(e) => setDraft({ ...draft, channelId: e.target.value || null })}
                  placeholder="123456789012345678"
                />
              </FieldGroup>
              <FieldGroup label="Minimum account age (days)" hint="Accounts younger than this fail verification.">
                <NumberInput
                  min={0}
                  max={365}
                  value={draft.minAccountAgeDays}
                  onChange={(e) => setDraft({ ...draft, minAccountAgeDays: Number(e.target.value) })}
                />
              </FieldGroup>
              <FieldGroup label="Verified role ID" hint="Granted once a member passes /verify.">
                <TextInput
                  value={draft.verifiedRoleId ?? ""}
                  onChange={(e) => setDraft({ ...draft, verifiedRoleId: e.target.value || null })}
                  placeholder="123456789012345678"
                />
              </FieldGroup>
              <FieldGroup label="Unverified role ID" hint="Optional. Removed once verified.">
                <TextInput
                  value={draft.unverifiedRoleId ?? ""}
                  onChange={(e) => setDraft({ ...draft, unverifiedRoleId: e.target.value || null })}
                  placeholder="123456789012345678"
                />
              </FieldGroup>
            </div>
          </Card>

          <Card
            title="What verification checks"
            description="Non-private Discord metadata only — username, user ID, account creation date, account age, server join date, and whether the account is a bot. Never email, phone number, IP address, or private messages."
          />
        </div>
      )}
    </div>
  );
}
