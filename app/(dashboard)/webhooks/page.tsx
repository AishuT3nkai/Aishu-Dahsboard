"use client";

import { useEffect, useMemo, useState } from "react";
import { ExternalLink, Webhook, ShieldCheck, Copy, BellRing, CircleAlert, Check, Trash2, Send, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Badge, Button, Card, FieldGroup, TextArea, TextInput } from "@/components/ui";
import { useGuild } from "@/components/GuildProvider";

const TEMPLATE_URL = "https://webhook-studio-rho.vercel.app/templates";
const EVENTS = [
  { id: "member.joined", label: "Member joined", description: "A new account joins the server." },
  { id: "member.verified", label: "Member verified", description: "A member completes the verification flow." },
  { id: "raid.detected", label: "Raid signal detected", description: "Join velocity crosses the configured threshold." },
  { id: "raid.cleared", label: "Raid mode cleared", description: "A moderator clears the raid signal." },
  { id: "moderation.action", label: "Moderation action", description: "A configured moderation action is recorded." },
] as const;

type WebhookEntry = {
  id: string;
  endpointHost: string;
  events: string[];
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
};
type DeliveryEntry = {
  eventId: string;
  event: string;
  status: string;
  attempts: number;
  httpStatus: number | null;
  createdAt: string;
};
type ApiBody<T> = { data?: T; error?: string };

function examplePayloadFor(eventId: string) {
  const common = {
    id: "evt_sample_123",
    event: eventId,
    version: 1,
    timestamp: "2026-01-01T12:00:00.000Z",
    guild: { id: "123456789012345678", name: "Example server" },
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

async function readResponse<T>(response: Response): Promise<T> {
  const body = (await response.json().catch(() => null)) as ApiBody<T> | null;
  if (!response.ok) throw new Error(body?.error || `Request failed (${response.status}).`);
  if (!body || !("data" in body)) throw new Error("The server returned an invalid response.");
  return body.data as T;
}

export default function WebhooksPage() {
  const { guildId, loading: guildLoading, error: guildError } = useGuild();
  const [endpoint, setEndpoint] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>(["member.verified", "member.joined"]);
  const [webhooks, setWebhooks] = useState<WebhookEntry[]>([]);
  const [deliveries, setDeliveries] = useState<DeliveryEntry[]>([]);
  const [deliveryWebhookId, setDeliveryWebhookId] = useState<string | null>(null);
  const [signingSecret, setSigningSecret] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const examplePayload = examplePayloadFor(selectedEvents[0] ?? "member.joined");
  const endpointValidation = useMemo(() => {
    if (!endpoint.trim()) return { valid: false, message: "Enter an HTTPS URL." };
    try {
      const parsed = new URL(endpoint.trim());
      if (parsed.protocol !== "https:") return { valid: false, message: "Use HTTPS; HTTP endpoints are rejected." };
      if (parsed.username || parsed.password || parsed.hash) return { valid: false, message: "Do not include credentials or a URL fragment." };
      if (!parsed.hostname || !parsed.hostname.includes(".")) return { valid: false, message: "Enter a fully qualified hostname." };
      return { valid: true, message: "HTTPS URL format looks valid. The bot will also check DNS/IP safety." };
    } catch {
      return { valid: false, message: "Enter a valid HTTPS URL." };
    }
  }, [endpoint]);

  useEffect(() => {
    if (!guildId) {
      setLoading(guildLoading);
      setWebhooks([]);
      if (!guildLoading && guildError) setError(guildError);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/api/dashboard/webhooks?guildId=${encodeURIComponent(guildId)}`)
      .then((response) => readResponse<WebhookEntry[]>(response))
      .then((items) => { if (!cancelled) setWebhooks(items); })
      .catch((err) => { if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load webhooks."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [guildId, guildLoading, guildError]);

  const toggleEvent = (id: string) => {
    setCopied(false);
    setSelectedEvents((current) => current.includes(id) ? current.filter((event) => event !== id) : [...current, id]);
  };

  async function createWebhook() {
    if (!guildId || !endpointValidation.valid || selectedEvents.length === 0) return;
    setSaving(true); setError(null); setNotice(null); setSigningSecret(null);
    try {
      const created = await readResponse<WebhookEntry & { signingSecret: string }>(
        await fetch(`/api/dashboard/webhooks?guildId=${encodeURIComponent(guildId)}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: endpoint.trim(), events: selectedEvents }),
        })
      );
      setWebhooks((current) => [created, ...current]);
      setSigningSecret(created.signingSecret);
      setEndpoint("");
      setNotice("Webhook saved. Copy the signing secret now; it is only shown once.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create webhook.");
    } finally { setSaving(false); }
  }

  async function updateWebhook(id: string, changes: { enabled: boolean }) {
    if (!guildId) return;
    setError(null); setNotice(null);
    try {
      const updated = await readResponse<Partial<WebhookEntry>>(
        await fetch(`/api/dashboard/webhooks?guildId=${encodeURIComponent(guildId)}&webhookId=${encodeURIComponent(id)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(changes),
        })
      );
      setWebhooks((current) => current.map((item) => item.id === id ? { ...item, ...updated } : item));
    } catch (err) { setError(err instanceof Error ? err.message : "Could not update webhook."); }
  }

  async function deleteWebhook(id: string) {
    if (!guildId || !window.confirm("Delete this webhook and its delivery history?")) return;
    setError(null); setNotice(null);
    try {
      const response = await fetch(`/api/dashboard/webhooks?guildId=${encodeURIComponent(guildId)}&webhookId=${encodeURIComponent(id)}`, { method: "DELETE" });
      if (!response.ok) throw new Error(`Delete failed (${response.status}).`);
      setWebhooks((current) => current.filter((item) => item.id !== id));
      if (deliveryWebhookId === id) { setDeliveryWebhookId(null); setDeliveries([]); }
    } catch (err) { setError(err instanceof Error ? err.message : "Could not delete webhook."); }
  }

  async function testWebhook(id: string) {
    if (!guildId) return;
    setError(null); setNotice(null);
    try {
      const result = await readResponse<{ ok: boolean; status: string; attempts: number; httpStatus: number | null }>(
        await fetch(`/api/dashboard/webhooks?guildId=${encodeURIComponent(guildId)}&webhookId=${encodeURIComponent(id)}&action=test`, { method: "POST" })
      );
      setNotice(`Test delivery: ${result.status}; attempts ${result.attempts}; HTTP ${result.httpStatus ?? "no response"}.`);
    } catch (err) { setError(err instanceof Error ? err.message : "Test delivery failed."); }
  }

  async function loadDeliveries(id: string) {
    if (!guildId) return;
    setError(null);
    try {
      const items = await readResponse<DeliveryEntry[]>(
        await fetch(`/api/dashboard/webhooks?guildId=${encodeURIComponent(guildId)}&webhookId=${encodeURIComponent(id)}&action=deliveries`)
      );
      setDeliveryWebhookId(id);
      setDeliveries(items);
    } catch (err) { setError(err instanceof Error ? err.message : "Could not load delivery history."); }
  }

  async function copySigningSecret() {
    if (!signingSecret) return;
    try { await navigator.clipboard.writeText(signingSecret); setCopied(true); }
    catch { setCopied(false); }
  }

  return (
    <div>
      <PageHeader title="Webhooks" description="Manage signed event notifications sent by Aishu to your HTTPS endpoint." />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-card border border-accent/25 bg-accent/5 p-4">
        <div className="flex items-start gap-3">
          <div className="rounded-card bg-accent/15 p-2 text-accent-bright"><Webhook size={20} /></div>
          <div>
            <div className="font-medium text-base-100">Webhook Studio templates</div>
            <p className="mt-1 text-sm text-base-400">Open your template library to choose a starting point for webhook messages.</p>
          </div>
        </div>
        <a href={TEMPLATE_URL} target="_blank" rel="noreferrer" className="focus-ring inline-flex items-center gap-2 rounded-card bg-accent-dim px-4 py-2 text-sm font-medium text-white hover:bg-accent">
          Browse templates <ExternalLink size={15} />
        </a>
      </div>

      {(error || guildError) && <div className="mb-4 rounded-card border border-warn/30 bg-warn/10 px-4 py-3 text-sm text-warn" role="alert">{error || guildError}</div>}
      {notice && <div className="mb-4 rounded-card border border-good/30 bg-good/10 px-4 py-3 text-sm text-good" role="status">{notice}</div>}
      {!guildId && !guildLoading && <div className="mb-4 text-sm text-base-400">Choose a server that Aishu and your admin account can both access.</div>}

      {signingSecret && (
        <Card title="Webhook signing secret — copy now" description="This secret is shown only once. Store it securely at your receiver and use it to verify X-Aishu-Signature.">
          <TextArea readOnly value={signingSecret} rows={2} className="font-mono text-xs" />
          <div className="mt-3"><Button variant="secondary" onClick={() => void copySigningSecret()}>{copied ? <Check size={15} className="mr-2 inline" /> : <Copy size={15} className="mr-2 inline" />}{copied ? "Copied" : "Copy signing secret"}</Button></div>
        </Card>
      )}

      <div className="mt-4 space-y-4">
        <Card title="Add webhook destination" description="The bot validates HTTPS and resolves the destination again while connecting. Private, loopback, link-local, and reserved IPs are rejected.">
          <FieldGroup label="Webhook endpoint URL" hint="The URL is encrypted at rest on the bot host. It is not returned to the browser after saving.">
            <TextInput type="url" value={endpoint} onChange={(event) => setEndpoint(event.target.value)} placeholder="https://example.com/webhooks/aishu" autoComplete="off" spellCheck={false} aria-invalid={endpoint.length > 0 && !endpointValidation.valid} />
            <p className={`mt-2 text-xs ${endpointValidation.valid ? "text-good" : "text-base-500"}`} role="status">{endpointValidation.message}</p>
          </FieldGroup>
          <div className="mt-4">
            <p className="mb-2 text-sm font-medium text-base-200">Events</p>
            <div className="space-y-2">
              {EVENTS.map((event) => (
                <label key={event.id} className="flex cursor-pointer items-start gap-3 rounded-card border border-base-800 bg-base-950/70 p-3 hover:border-base-700">
                  <input type="checkbox" checked={selectedEvents.includes(event.id)} onChange={() => toggleEvent(event.id)} className="mt-1 h-4 w-4 accent-[color:var(--accent,#7c8cff)]" />
                  <span className="min-w-0 flex-1"><span className="block text-sm font-medium text-base-100">{event.label}</span><span className="mt-0.5 block text-xs text-base-400">{event.description}</span></span>
                  <code className="hidden text-xs text-base-500 sm:block">{event.id}</code>
                </label>
              ))}
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs text-base-500">{selectedEvents.length} event type(s) selected.</span>
            <Button onClick={() => void createWebhook()} disabled={saving || loading || !guildId || !endpointValidation.valid || selectedEvents.length === 0}>{saving ? "Saving…" : "Save webhook"}</Button>
          </div>
        </Card>

        <Card title="Configured webhooks" description="The destination URL itself is never returned to the browser. Test sends a real signed webhook event through the bot bridge.">
          {loading ? <p className="text-sm text-base-400">Loading webhook configuration…</p> : webhooks.length === 0 ? <p className="text-sm text-base-400">No webhooks configured for this server yet.</p> : (
            <div className="space-y-3">
              {webhooks.map((item) => (
                <div key={item.id} className="rounded-card border border-base-800 bg-base-950/70 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2"><span className="font-medium text-base-100">{item.endpointHost || "HTTPS destination"} · #{item.id}</span><Badge tone={item.enabled ? "good" : "warn"}>{item.enabled ? "Enabled" : "Disabled"}</Badge></div>
                      <p className="mt-2 text-xs text-base-400">Events: {item.events.join(", ")}</p>
                      <p className="mt-1 text-xs text-base-500">Created {new Date(item.createdAt).toLocaleString()}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="secondary" onClick={() => void testWebhook(item.id)}><Send size={14} className="mr-1 inline" />Test</Button>
                      <Button variant="secondary" onClick={() => void loadDeliveries(item.id)}><RefreshCw size={14} className="mr-1 inline" />Deliveries</Button>
                      <Button variant="secondary" onClick={() => void updateWebhook(item.id, { enabled: !item.enabled })}>{item.enabled ? "Disable" : "Enable"}</Button>
                      <Button variant="secondary" onClick={() => void deleteWebhook(item.id)}><Trash2 size={14} className="mr-1 inline" />Delete</Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {deliveryWebhookId && (
          <Card title={`Recent deliveries · webhook #${deliveryWebhookId}`} description="Only status metadata is stored here; payloads, endpoint URLs, and signatures are not shown.">
            {deliveries.length === 0 ? <p className="text-sm text-base-400">No deliveries recorded yet.</p> : (
              <div className="space-y-2">
                {deliveries.map((item) => <div key={item.eventId + item.createdAt} className="flex flex-wrap items-center justify-between gap-2 rounded-card border border-base-800 p-3 text-sm">
                  <div><p className="font-medium text-base-200">{item.event}</p><p className="text-xs text-base-500">{new Date(item.createdAt).toLocaleString()} · {item.attempts} attempt(s)</p></div>
                  <div className="text-right"><Badge tone={item.status === "delivered" ? "good" : "warn"}>{item.status}</Badge><p className="mt-1 text-xs text-base-500">HTTP {item.httpStatus ?? "—"}</p></div>
                </div>)}
              </div>
            )}
          </Card>
        )}

        <Card title="Payload preview" description="Fictional example payload for receiver development. Test deliveries use live timestamps and a unique event ID.">
          <div className="mb-3 flex items-center gap-2 text-sm text-base-300"><BellRing size={16} className="text-accent-bright" /><span>{selectedEvents[0] ?? "member.joined"} · version 1</span></div>
          <TextArea readOnly value={examplePayload} rows={10} className="font-mono text-xs leading-5" />
        </Card>

        <Card title="Security notes" description="Requests are signed with HMAC-SHA256 using the one-time signing secret. Verify the signature over timestamp + '.' + the exact raw request body and reject stale timestamps.">
          <div className="flex items-start gap-2 text-sm text-base-300"><ShieldCheck size={17} className="mt-0.5 shrink-0 text-good" /><p>Webhook secrets are encrypted at rest. Delivery requests use HTTPS, do not follow redirects, reject non-public destination IPs, use bounded timeouts, retry transient failures, and record redacted delivery metadata.</p></div>
          <div className="mt-3 flex items-start gap-2 text-sm text-warn"><CircleAlert size={17} className="mt-0.5 shrink-0" /><p>Keep the bot&apos;s encryption key stable and private. Changing it without migrating stored values makes existing webhook secrets unreadable.</p></div>
        </Card>
      </div>
    </div>
  );
}
