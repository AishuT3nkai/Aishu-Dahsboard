"use client";

import { useState } from "react";
import { ExternalLink, Webhook, ShieldCheck, Copy, BellRing, CircleAlert, Check } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Badge, Button, Card, FieldGroup, TextArea, TextInput } from "@/components/ui";

const TEMPLATE_URL = "https://webhook-studio-rho.vercel.app/templates";

const EVENTS = [
  { id: "member.joined", label: "Member joined", description: "A new account joins the server." },
  { id: "member.verified", label: "Member verified", description: "A member completes the verification flow." },
  { id: "member.quarantined", label: "Member quarantined", description: "Anti-raid policy restricts a suspicious join." },
  { id: "raid.detected", label: "Raid signal detected", description: "Join velocity crosses the configured threshold." },
  { id: "raid.cleared", label: "Raid mode cleared", description: "A moderator clears the raid signal." },
  { id: "moderation.action", label: "Moderation action", description: "A configured moderation action is recorded." },
] as const;

function examplePayloadFor(eventId: string) {
  const common = {
    event: eventId,
    version: 1,
    timestamp: "2026-01-01T12:00:00.000Z",
    guild: { id: "123456789012345678" },
  };

  const details =
    eventId === "raid.detected"
      ? { raid: { joins: 12, windowSeconds: 30, threshold: 8 }, action: "quarantine_review" }
      : eventId === "raid.cleared"
        ? { raid: { status: "cleared", clearedBy: "345678901234567890" } }
        : eventId === "member.joined"
          ? { member: { id: "234567890123456789", accountAgeDays: 120 }, action: "verification_pending" }
          : eventId === "member.quarantined"
            ? { member: { id: "234567890123456789", accountAgeDays: 1 }, quarantine: { reason: "join_rate", durationMinutes: 10 } }
            : eventId === "moderation.action"
              ? { moderation: { action: "timeout", targetId: "234567890123456789", moderatorId: "345678901234567890", reason: "Sample reason" } }
              : { member: { id: "234567890123456789", accountAgeDays: 120 }, verification: { method: "challenge", result: "passed" } };

  return JSON.stringify({ ...common, ...details }, null, 2);
}

export default function WebhooksPage() {
  const [endpoint, setEndpoint] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>(["member.verified", "raid.detected"]);
  const [copied, setCopied] = useState(false);
  const examplePayload = examplePayloadFor(selectedEvents[0] ?? "member.verified");

  const toggleEvent = (id: string) => {
    setSelectedEvents((current) =>
      current.includes(id) ? current.filter((event) => event !== id) : [...current, id]
    );
  };

  async function copyPayload() {
    try {
      await navigator.clipboard.writeText(examplePayload);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Webhooks"
        description="Plan event notifications for Aishu and explore webhook templates."
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-card border border-accent/25 bg-accent/5 p-4">
        <div className="flex items-start gap-3">
          <div className="rounded-card bg-accent/15 p-2 text-accent-bright">
            <Webhook size={20} />
          </div>
          <div>
            <div className="font-medium text-base-100">Webhook Studio templates</div>
            <p className="mt-1 text-sm text-base-400">Open your template library to choose a starting point for webhook messages.</p>
          </div>
        </div>
        <a
          href={TEMPLATE_URL}
          target="_blank"
          rel="noreferrer"
          className="focus-ring inline-flex items-center gap-2 rounded-card bg-accent-dim px-4 py-2 text-sm font-medium text-white hover:bg-accent"
        >
          Browse templates <ExternalLink size={15} />
        </a>
      </div>

      <div className="mb-4 flex items-start gap-3 rounded-card border border-warn/30 bg-warn/10 px-4 py-3 text-sm text-warn">
        <CircleAlert size={18} className="mt-0.5 shrink-0" />
        <p>
          Webhook setup is currently a dashboard draft. The endpoint and event choices on this page are kept only in this page session; they are not saved to the server and no webhook requests are sent. Live delivery needs a protected server-side integration before it can be enabled.
        </p>
      </div>

      <div className="space-y-4">
        <Card title="Destination" description="Use an HTTPS endpoint that you control. Treat webhook URLs as secrets because they may contain access tokens.">
          <FieldGroup label="Webhook endpoint URL" hint="Draft only. Do not paste a production secret until secure server-side storage is implemented.">
            <TextInput
              type="url"
              value={endpoint}
              onChange={(event) => setEndpoint(event.target.value)}
              placeholder="https://example.com/webhooks/aishu"
              autoComplete="off"
              spellCheck={false}
            />
          </FieldGroup>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Badge tone="warn">Not connected</Badge>
            <span className="text-xs text-base-500">No test request will be sent from this browser.</span>
          </div>
        </Card>

        <Card title="Events to subscribe to" description="Choose which event types should eventually be delivered to your endpoint. The sample payload below follows the first selected event. Selection is a local draft for now.">
          <div className="space-y-2">
            {EVENTS.map((event) => (
              <label key={event.id} className="flex cursor-pointer items-start gap-3 rounded-card border border-base-800 bg-base-950/70 p-3 hover:border-base-700">
                <input
                  type="checkbox"
                  checked={selectedEvents.includes(event.id)}
                  onChange={() => toggleEvent(event.id)}
                  className="mt-1 h-4 w-4 accent-[color:var(--accent,#7c8cff)]"
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-base-100">{event.label}</span>
                  <span className="mt-0.5 block text-xs text-base-400">{event.description}</span>
                </span>
                <code className="hidden text-xs text-base-500 sm:block">{event.id}</code>
              </label>
            ))}
          </div>
          <p className="mt-3 text-xs text-base-500">{selectedEvents.length} event type{selectedEvents.length === 1 ? "" : "s"} selected.</p>
        </Card>

        <Card title="Payload preview" description="Example event body to help you build a compatible template. The values below are fictional sample data.">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm text-base-300">
              <BellRing size={16} className="text-accent-bright" />
              <span>{selectedEvents[0] ?? "member.verified"} · version 1</span>
            </div>
            <Button variant="secondary" onClick={() => void copyPayload()}>
              {copied ? <Check size={15} className="mr-2 inline" /> : <Copy size={15} className="mr-2 inline" />}
              {copied ? "Copied payload" : "Copy example payload"}
            </Button>
          </div>
          <TextArea readOnly value={examplePayload} rows={10} className="font-mono text-xs leading-5" />
        </Card>

        <Card title="Security checklist" description="Before enabling live delivery, the server integration should validate HTTPS destinations, keep endpoint secrets server-side, sign payloads with HMAC, include a timestamp and event ID, support retries with backoff, and avoid sending private member data.">
          <div className="flex items-start gap-2 text-sm text-base-300">
            <ShieldCheck size={17} className="mt-0.5 shrink-0 text-good" />
            <p>Recommended: verify signatures and reject stale timestamps at the receiving service. Never place bot tokens or webhook secrets in client-side code or public commits.</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
