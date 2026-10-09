"use client";

import { useEffect, useState } from "react";
import { useGuild } from "@/components/GuildProvider";
import { Activity, ShieldAlert, ShieldCheck, Clock3, UsersRound, Eye } from "lucide-react";
import { useConfig } from "@/lib/useConfig";
import { PageHeader } from "@/components/PageHeader";
import { SaveBar } from "@/components/SaveBar";
import { Card, FieldGroup, TextInput, NumberInput, Toggle, Badge } from "@/components/ui";
import type { VerificationConfig } from "@/lib/types";

type AntiRaidDraft = {
  enabled: boolean;
  captchaEnabled: boolean;
  quarantineEnabled: boolean;
  accountAgeGateEnabled: boolean;
  joinRateLimit: number;
  joinRateWindowSeconds: number;
  minimumAccountAgeHours: number;
  verificationTimeoutMinutes: number;
  maxAttempts: number;
};

const initialAntiRaidDraft: AntiRaidDraft = {
  enabled: true,
  captchaEnabled: true,
  quarantineEnabled: true,
  accountAgeGateEnabled: true,
  joinRateLimit: 8,
  joinRateWindowSeconds: 30,
  minimumAccountAgeHours: 24,
  verificationTimeoutMinutes: 10,
  maxAttempts: 3,
};

function PolicyToggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return <Toggle label={label} description={description} checked={checked} onChange={onChange} />;
}

export default function VerificationPage() {
  const { draft, setDraft, loading, saving, error, bridgeUnconfigured, dirty, save, data } =
    useConfig<VerificationConfig>("/api/dashboard/verification");
  const { guildId } = useGuild();
  const [antiRaid, setAntiRaid] = useState<AntiRaidDraft>(initialAntiRaidDraft);
  const [antiRaidLoaded, setAntiRaidLoaded] = useState(false);

  // These advanced controls are dashboard-only until the bot bridge supports them.
  // Keep the draft per guild in this browser so a refresh does not silently discard it.
  useEffect(() => {
    setAntiRaidLoaded(false);
    if (!guildId) {
      setAntiRaid(initialAntiRaidDraft);
      setAntiRaidLoaded(true);
      return;
    }

    try {
      const stored = window.localStorage.getItem(`aishu:anti-raid-draft:${guildId}`);
      if (stored) {
        const parsed: unknown = JSON.parse(stored);
        if (parsed && typeof parsed === "object") {
          const value = parsed as Partial<AntiRaidDraft>;
          setAntiRaid({
            enabled: typeof value.enabled === "boolean" ? value.enabled : initialAntiRaidDraft.enabled,
            captchaEnabled: typeof value.captchaEnabled === "boolean" ? value.captchaEnabled : initialAntiRaidDraft.captchaEnabled,
            quarantineEnabled: typeof value.quarantineEnabled === "boolean" ? value.quarantineEnabled : initialAntiRaidDraft.quarantineEnabled,
            accountAgeGateEnabled: typeof value.accountAgeGateEnabled === "boolean" ? value.accountAgeGateEnabled : initialAntiRaidDraft.accountAgeGateEnabled,
            joinRateLimit: typeof value.joinRateLimit === "number" ? Math.max(1, Math.min(50, value.joinRateLimit)) : initialAntiRaidDraft.joinRateLimit,
            joinRateWindowSeconds: typeof value.joinRateWindowSeconds === "number" ? Math.max(5, Math.min(300, value.joinRateWindowSeconds)) : initialAntiRaidDraft.joinRateWindowSeconds,
            minimumAccountAgeHours: typeof value.minimumAccountAgeHours === "number" ? Math.max(0, Math.min(8760, value.minimumAccountAgeHours)) : initialAntiRaidDraft.minimumAccountAgeHours,
            verificationTimeoutMinutes: typeof value.verificationTimeoutMinutes === "number" ? Math.max(1, Math.min(60, value.verificationTimeoutMinutes)) : initialAntiRaidDraft.verificationTimeoutMinutes,
            maxAttempts: typeof value.maxAttempts === "number" ? Math.max(1, Math.min(10, value.maxAttempts)) : initialAntiRaidDraft.maxAttempts,
          });
        }
      } else {
        setAntiRaid(initialAntiRaidDraft);
      }
    } catch {
      setAntiRaid(initialAntiRaidDraft);
    } finally {
      setAntiRaidLoaded(true);
    }
  }, [guildId]);

  useEffect(() => {
    if (!guildId || !antiRaidLoaded) return;
    try {
      window.localStorage.setItem(`aishu:anti-raid-draft:${guildId}`, JSON.stringify(antiRaid));
    } catch {
      // Browser storage can be disabled or full; the in-memory draft still works.
    }
  }, [guildId, antiRaid, antiRaidLoaded]);

  return (
    <div>
      <PageHeader
        title="Verification & Anti-Raid"
        description="Configure the member gate and shape Aishu’s layered anti-raid policy."
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
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="rounded-card bg-accent/15 p-2 text-accent-bright">
                  <ShieldCheck size={21} />
                </div>
                <div>
                  <h2 className="font-display text-base font-semibold text-base-100">Member verification gate</h2>
                  <p className="mt-1 text-sm text-base-400">The existing live settings below are saved through the configured bot bridge.</p>
                </div>
              </div>
              <Badge tone={draft.enabled ? "good" : "warn"}>{draft.enabled ? "Gate enabled" : "Gate disabled"}</Badge>
            </div>
            <div className="mt-4">
              <PolicyToggle
                label="Verification enabled"
                description="When off, the /verify gate is disabled."
                checked={draft.enabled}
                onChange={(v) => setDraft({ ...draft, enabled: v })}
              />
            </div>
          </Card>

          <Card title="Verification setup" description="IDs must be copied from Discord with Developer Mode enabled.">
            <div className="grid gap-4 md:grid-cols-2">
              <FieldGroup label="Verification channel ID" hint="Where the verification prompt is posted.">
                <TextInput
                  value={draft.channelId ?? ""}
                  onChange={(e) => setDraft({ ...draft, channelId: e.target.value || null })}
                  placeholder="123456789012345678"
                />
              </FieldGroup>
              <FieldGroup label="Minimum account age (days)" hint="Existing live check; accounts younger than this fail verification.">
                <NumberInput
                  min={0}
                  max={365}
                  value={draft.minAccountAgeDays}
                  onChange={(e) => setDraft({ ...draft, minAccountAgeDays: Number(e.target.value) })}
                />
              </FieldGroup>
              <FieldGroup label="Verified role ID" hint="Granted after a member passes verification.">
                <TextInput
                  value={draft.verifiedRoleId ?? ""}
                  onChange={(e) => setDraft({ ...draft, verifiedRoleId: e.target.value || null })}
                  placeholder="123456789012345678"
                />
              </FieldGroup>
              <FieldGroup label="Unverified role ID" hint="Optional role removed after successful verification.">
                <TextInput
                  value={draft.unverifiedRoleId ?? ""}
                  onChange={(e) => setDraft({ ...draft, unverifiedRoleId: e.target.value || null })}
                  placeholder="123456789012345678"
                />
              </FieldGroup>
            </div>
          </Card>

          <div className="flex flex-wrap items-center gap-2 pt-2">
            <ShieldAlert size={18} className="text-accent-bright" />
            <h2 className="font-display text-base font-semibold text-base-100">Advanced anti-raid policy</h2>
            <Badge tone="warn">{antiRaidLoaded ? "Browser draft" : "Loading draft"}</Badge>
          </div>

          <div className="rounded-card border border-warn/30 bg-warn/10 px-4 py-3 text-sm text-warn">
            These advanced controls are saved in this browser for the selected server only. They are not sent to the live bot yet, so changing them here does not activate anti-raid protections. Server-side persistence and enforcement require a separate bot-bridge change.
          </div>

          <Card title="Layered protection" description="Aishu’s proposed policy combines join-rate detection, a verification challenge, and temporary quarantine.">
            <div className="space-y-3">
              <PolicyToggle
                label="Anti-raid mode"
                description="Watch for sudden join bursts and flag the server as potentially under raid."
                checked={antiRaid.enabled}
                onChange={(v) => setAntiRaid({ ...antiRaid, enabled: v })}
              />
              <PolicyToggle
                label="Verification challenge"
                description="Require a challenge before granting the verified role."
                checked={antiRaid.captchaEnabled}
                onChange={(v) => setAntiRaid({ ...antiRaid, captchaEnabled: v })}
              />
              <PolicyToggle
                label="Quarantine suspicious joins"
                description="Keep flagged newcomers in a restricted role until they pass review."
                checked={antiRaid.quarantineEnabled}
                onChange={(v) => setAntiRaid({ ...antiRaid, quarantineEnabled: v })}
              />
              <PolicyToggle
                label="New-account risk gate"
                description="Apply extra scrutiny to accounts below the configured age threshold."
                checked={antiRaid.accountAgeGateEnabled}
                onChange={(v) => setAntiRaid({ ...antiRaid, accountAgeGateEnabled: v })}
              />
            </div>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card title="Join velocity" description="Tune when a burst of new members should raise a raid signal.">
              <div className="grid grid-cols-2 gap-4">
                <FieldGroup label="Joins in threshold" hint="1–50 joins">
                  <NumberInput
                    min={1}
                    max={50}
                    value={antiRaid.joinRateLimit}
                    onChange={(e) => setAntiRaid({ ...antiRaid, joinRateLimit: Math.max(1, Math.min(50, Number(e.target.value) || 1)) })}
                  />
                </FieldGroup>
                <FieldGroup label="Time window (seconds)" hint="5–300 seconds">
                  <NumberInput
                    min={5}
                    max={300}
                    value={antiRaid.joinRateWindowSeconds}
                    onChange={(e) => setAntiRaid({ ...antiRaid, joinRateWindowSeconds: Math.max(5, Math.min(300, Number(e.target.value) || 5)) })}
                  />
                </FieldGroup>
              </div>
            </Card>
            <Card title="Verification limits" description="Keep challenges time-limited and limit repeated attempts.">
              <div className="grid grid-cols-2 gap-4">
                <FieldGroup label="Minimum account age (hours)" hint="0–8760 hours">
                  <NumberInput
                    min={0}
                    max={8760}
                    value={antiRaid.minimumAccountAgeHours}
                    onChange={(e) => setAntiRaid({ ...antiRaid, minimumAccountAgeHours: Math.max(0, Math.min(8760, Number(e.target.value) || 0)) })}
                  />
                </FieldGroup>
                <FieldGroup label="Challenge timeout (minutes)" hint="1–60 minutes">
                  <NumberInput
                    min={1}
                    max={60}
                    value={antiRaid.verificationTimeoutMinutes}
                    onChange={(e) => setAntiRaid({ ...antiRaid, verificationTimeoutMinutes: Math.max(1, Math.min(60, Number(e.target.value) || 1)) })}
                  />
                </FieldGroup>
                <FieldGroup label="Maximum attempts" hint="1–10 attempts">
                  <NumberInput
                    min={1}
                    max={10}
                    value={antiRaid.maxAttempts}
                    onChange={(e) => setAntiRaid({ ...antiRaid, maxAttempts: Math.max(1, Math.min(10, Number(e.target.value) || 1)) })}
                  />
                </FieldGroup>
              </div>
            </Card>
          </div>

          <Card title="Detection flow" description="A proposed decision path for the bot phase. This is a design preview, not live telemetry.">
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-card border border-base-800 bg-base-950 p-4">
                <Activity size={19} className="mb-2 text-accent-bright" />
                <div className="text-sm font-medium text-base-100">1. Detect</div>
                <p className="mt-1 text-xs leading-5 text-base-400">Count joins in a rolling time window and identify a sudden spike.</p>
              </div>
              <div className="rounded-card border border-base-800 bg-base-950 p-4">
                <Eye size={19} className="mb-2 text-accent-bright" />
                <div className="text-sm font-medium text-base-100">2. Assess</div>
                <p className="mt-1 text-xs leading-5 text-base-400">Check account age and require the configured challenge when enabled.</p>
              </div>
              <div className="rounded-card border border-base-800 bg-base-950 p-4">
                <UsersRound size={19} className="mb-2 text-accent-bright" />
                <div className="text-sm font-medium text-base-100">3. Contain</div>
                <p className="mt-1 text-xs leading-5 text-base-400">Restrict suspicious joins and keep a review path for legitimate members.</p>
              </div>
            </div>
            <div className="mt-4 flex items-start gap-2 text-xs text-base-500">
              <Clock3 size={15} className="mt-0.5 shrink-0" />
              <p>Recommended safeguards: never auto-ban from join rate alone, provide moderator override, and log every quarantine/release action.</p>
            </div>
          </Card>

          <Card
            title="Privacy boundary"
            description="Use only Discord metadata needed for verification: user ID, account creation date, join time, and bot status. Never collect passwords, email addresses, phone numbers, IP addresses, or private messages."
          />
        </div>
      )}
    </div>
  );
}
