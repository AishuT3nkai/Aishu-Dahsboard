"use client";

import { useMemo, useState } from "react";
import { useConfig } from "@/lib/useConfig";
import { PageHeader } from "@/components/PageHeader";
import { SaveBar } from "@/components/SaveBar";
import { Card, FieldGroup, TextInput, TextArea, Toggle, Button } from "@/components/ui";
import type { WelcomeGoodbyeConfig } from "@/lib/types";

type CanvasAlign = "left" | "center" | "right";

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
  const [backgroundUrl, setBackgroundUrl] = useState("");
  const [accent, setAccent] = useState("#a78bfa");
  const [canvasAlign, setCanvasAlign] = useState<CanvasAlign>("center");
  const [cardTitle, setCardTitle] = useState("WELCOME!");
  const [cardSubtitle, setCardSubtitle] = useState("Glad to have you here ✨");
  const [showAvatar, setShowAvatar] = useState(true);
  const [showMemberCount, setShowMemberCount] = useState(true);
  const [showServerName, setShowServerName] = useState(true);
  const [previewMode, setPreviewMode] = useState<"welcome" | "goodbye">("welcome");

  const previewMessage = useMemo(() => {
    if (!draft) return "";
    return previewMode === "welcome"
      ? fill(draft.welcomeMessage, 128)
      : fill(draft.goodbyeMessage, 127);
  }, [draft, previewMode]);

  return (
    <div>
      <PageHeader
        title="Welcome Studio"
        description="Build a layered welcome-card concept, preview it live, and configure your welcome/goodbye messages."
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
          <Card title="Advanced card editor" description="Edit the composition and see the preview update instantly.">
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(300px,0.8fr)]">
              <div className="min-w-0 space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant={previewMode === "welcome" ? "primary" : "secondary"} onClick={() => setPreviewMode("welcome")}>Welcome preview</Button>
                  <Button type="button" variant={previewMode === "goodbye" ? "primary" : "secondary"} onClick={() => setPreviewMode("goodbye")}>Goodbye preview</Button>
                </div>
                <div
                  className="relative flex min-h-[280px] overflow-hidden rounded-2xl border border-base-700 bg-slate-950 bg-cover bg-center p-6 text-white shadow-xl sm:min-h-[340px]"
                  style={backgroundUrl.trim() ? { backgroundImage: `linear-gradient(135deg, rgba(10,12,25,.42), rgba(10,12,25,.78)), url("${backgroundUrl.replace(/["\\\\]/g, "")}")` } : undefined}
                >
                  {!backgroundUrl.trim() && (
                    <>
                      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(139,92,246,.45),transparent_55%),radial-gradient(ellipse_at_bottom_right,rgba(14,165,233,.28),transparent_55%)]" />
                      <div className="absolute -right-10 -top-16 h-48 w-48 rounded-full border border-white/10" />
                      <div className="absolute -right-2 -top-8 h-32 w-32 rounded-full border border-white/10" />
                      <div className="absolute -bottom-20 -left-8 h-48 w-48 rounded-full bg-fuchsia-500/10 blur-2xl" />
                    </>
                  )}
                  <div className={`relative z-10 flex w-full flex-col justify-center gap-3 ${canvasAlign === "left" ? "items-start text-left" : canvasAlign === "right" ? "items-end text-right" : "items-center text-center"}`}>
                    {showAvatar && (
                      <div className="rounded-full p-1 shadow-lg" style={{ backgroundColor: accent }}>
                        <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-slate-950 bg-gradient-to-br from-violet-300 to-sky-400 text-3xl font-bold text-slate-950">A</div>
                      </div>
                    )}
                    <div className="text-xs font-semibold uppercase tracking-[.28em]" style={{ color: accent }}>{previewMode === "welcome" ? "A NEW MEMBER HAS ARRIVED" : "A MEMBER HAS LEFT"}</div>
                    <h2 className="break-words text-3xl font-black tracking-tight sm:text-4xl">{cardTitle || (previewMode === "welcome" ? "WELCOME!" : "GOODBYE!")}</h2>
                    <p className="max-w-md break-words text-sm text-slate-200 sm:text-base">{cardSubtitle}</p>
                    {showServerName && <div className="rounded-full border border-white/15 bg-black/20 px-4 py-1.5 text-sm">Your Server</div>}
                    {showMemberCount && <div className="text-xs text-slate-300">{previewMode === "welcome" ? "MEMBER #128" : "MEMBER #127"}</div>}
                    <div className="mt-2 h-1 w-20 rounded-full" style={{ backgroundColor: accent }} />
                  </div>
                </div>
                <p className="text-xs text-base-400">Preview mockup only. Avatar, server name, and member count are sample data, not live Discord values.</p>
              </div>

              <div className="space-y-4">
                <FieldGroup label="Background image URL" hint="Use a publicly accessible HTTPS image URL. Image uploads are not connected yet.">
                  <TextInput value={backgroundUrl} onChange={(e) => setBackgroundUrl(e.target.value)} placeholder="https://example.com/background.jpg" />
                </FieldGroup>
                <FieldGroup label="Accent color">
                  <div className="flex items-center gap-3 rounded-card border border-base-700 bg-base-900 px-3 py-2">
                    <input aria-label="Accent color" type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="h-9 w-12 cursor-pointer rounded border-0 bg-transparent" />
                    <TextInput value={accent} onChange={(e) => setAccent(/^#[0-9a-fA-F]{6}$/.test(e.target.value) ? e.target.value : accent)} aria-label="Accent hex color" />
                  </div>
                </FieldGroup>
                <FieldGroup label="Card title">
                  <TextInput value={cardTitle} maxLength={60} onChange={(e) => setCardTitle(e.target.value)} placeholder="WELCOME!" />
                </FieldGroup>
                <FieldGroup label="Card subtitle">
                  <TextInput value={cardSubtitle} maxLength={140} onChange={(e) => setCardSubtitle(e.target.value)} placeholder="Glad to have you here ✨" />
                </FieldGroup>
                <FieldGroup label="Content alignment">
                  <div className="grid grid-cols-3 gap-2">
                    {(["left", "center", "right"] as const).map((align) => (
                      <Button key={align} type="button" variant={canvasAlign === align ? "primary" : "secondary"} onClick={() => setCanvasAlign(align)}>{align[0].toUpperCase() + align.slice(1)}</Button>
                    ))}
                  </div>
                </FieldGroup>
                <div className="space-y-2">
                  <Toggle label="Show avatar placeholder" checked={showAvatar} onChange={setShowAvatar} />
                  <Toggle label="Show server name" checked={showServerName} onChange={setShowServerName} />
                  <Toggle label="Show member count" checked={showMemberCount} onChange={setShowMemberCount} />
                </div>
                <Button type="button" variant="secondary" onClick={() => { setBackgroundUrl(""); setAccent("#a78bfa"); setCanvasAlign("center"); setCardTitle("WELCOME!"); setCardSubtitle("Glad to have you here ✨"); setShowAvatar(true); setShowMemberCount(true); setShowServerName(true); }}>Reset visual preview</Button>
              </div>
            </div>
          </Card>

          <div className="rounded-card border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-base-200">
            <p className="font-semibold text-amber-200">Integration status: visual design is a local preview</p>
            <p className="mt-1 text-base-300">The existing bridge contract only saves enabled state, channel IDs, and plain-text messages. Background, colors, layout, and card layers are not sent to or persisted by the bot. This editor does not pretend those settings are live; connecting card rendering requires a compatible bot-side API/runtime change, which has intentionally not been made.</p>
          </div>

          <Card title="Welcome message settings">
            <div className="space-y-4">
              <Toggle label="Welcome messages enabled" checked={draft.welcomeEnabled} onChange={(v) => setDraft({ ...draft, welcomeEnabled: v })} />
              <FieldGroup label="Welcome channel ID">
                <TextInput value={draft.welcomeChannelId ?? ""} onChange={(e) => setDraft({ ...draft, welcomeChannelId: e.target.value || null })} placeholder="123456789012345678" />
              </FieldGroup>
              <FieldGroup label="Welcome message" hint="Variables: {user} {username} {server} {member_count}">
                <TextArea value={draft.welcomeMessage} onChange={(e) => setDraft({ ...draft, welcomeMessage: e.target.value })} />
              </FieldGroup>
              <div className="rounded-card border border-base-800 bg-base-950 px-3 py-3 text-sm text-base-300">
                <span className="mr-2 text-xs uppercase tracking-wide text-base-500">Message preview</span>
                <p className="mt-2 whitespace-pre-wrap">{fill(draft.welcomeMessage, 128)}</p>
              </div>
            </div>
          </Card>

          <Card title="Goodbye settings">
            <div className="space-y-4">
              <Toggle label="Goodbye messages enabled" checked={draft.goodbyeEnabled} onChange={(v) => setDraft({ ...draft, goodbyeEnabled: v })} />
              <FieldGroup label="Goodbye channel ID">
                <TextInput value={draft.goodbyeChannelId ?? ""} onChange={(e) => setDraft({ ...draft, goodbyeChannelId: e.target.value || null })} placeholder="123456789012345678" />
              </FieldGroup>
              <FieldGroup label="Goodbye message" hint="Variables: {user} {username} {server} {member_count}">
                <TextArea value={draft.goodbyeMessage} onChange={(e) => setDraft({ ...draft, goodbyeMessage: e.target.value })} />
              </FieldGroup>
              <div className="rounded-card border border-base-800 bg-base-950 px-3 py-3 text-sm text-base-300">
                <span className="mr-2 text-xs uppercase tracking-wide text-base-500">Message preview</span>
                <p className="mt-2 whitespace-pre-wrap">{fill(draft.goodbyeMessage, 127)}</p>
              </div>
            </div>
          </Card>

          <p className="text-xs text-base-500">
            Auto role has moved to its own page — see <a href="/autorole" className="text-accent-bright hover:underline">Auto role</a>.
          </p>
          <p className="text-xs text-base-500">Live message sample: {previewMessage}</p>
        </div>
      )}
    </div>
  );
}
