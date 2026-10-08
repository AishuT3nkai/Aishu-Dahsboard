"use client";

import { Button } from "./ui";

export function SaveBar({
  dirty,
  saving,
  error,
  bridgeUnconfigured,
  onSave,
  onDiscard,
}: {
  dirty: boolean;
  saving: boolean;
  error: string | null;
  bridgeUnconfigured: boolean;
  onSave: () => void;
  onDiscard: () => void;
}) {
  if (bridgeUnconfigured) {
    return (
      <div className="mb-6 rounded-card border border-warn/30 bg-warn/10 px-4 py-3 text-sm text-warn">
        This page loads from and saves to the live bot, but the bot bridge isn&apos;t configured
        on this deployment yet (BOT_API_BASE_URL / BOT_API_SHARED_SECRET). Nothing here will
        appear to work until that&apos;s set up — see dashboard/BRIDGE.md.
      </div>
    );
  }

  if (!dirty && !error) return null;

  return (
    <div className="sticky top-0 z-10 mb-6 flex flex-wrap items-center justify-between gap-3 rounded-card border border-accent/30 bg-base-850/95 px-4 py-3 backdrop-blur">
      <span className="text-sm text-base-200">
        {error ? <span className="text-bad">{error}</span> : "You have unsaved changes."}
      </span>
      <div className="flex gap-2">
        <Button variant="secondary" onClick={onDiscard} disabled={saving}>
          Discard
        </Button>
        <Button variant="primary" onClick={onSave} disabled={saving || !dirty}>
          {saving ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </div>
  );
}
