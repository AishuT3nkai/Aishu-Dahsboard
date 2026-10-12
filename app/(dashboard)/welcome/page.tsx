"use client";

import { useEffect, useRef, useState } from "react";
import {
  AlignCenter,
  AlignLeft,
  ImagePlus,
  Layers3,
  Plus,
  RotateCcw,
  Trash2,
  Type,
} from "lucide-react";
import { useConfig } from "@/lib/useConfig";
import { PageHeader } from "@/components/PageHeader";
import { SaveBar } from "@/components/SaveBar";
import { Badge, Button, Card, FieldGroup, TextInput, TextArea, Toggle } from "@/components/ui";
import type { WelcomeGoodbyeConfig } from "@/lib/types";

type WelcomeDesign = {\n  layers: TextLayer[];\n  background: string;\n  backgroundColor: string;\n  accentColor: string;\n};\n\ntype TextLayer = {
  id: string;
  name: string;
  text: string;
  x: number;
  y: number;
  color: string;
  size: number;
  weight: "normal" | "bold";
  align: "left" | "center";
};

const initialLayers: TextLayer[] = [
  { id: "eyebrow", name: "Small label", text: "A NEW STAR HAS ARRIVED", x: 50, y: 28, color: "#c4b5fd", size: 10, weight: "bold", align: "center" },
  { id: "title", name: "Welcome title", text: "WELCOME!", x: 50, y: 43, color: "#ffffff", size: 30, weight: "bold", align: "center" },
  { id: "member", name: "Member name", text: "@NewMember", x: 50, y: 57, color: "#ddd6fe", size: 17, weight: "bold", align: "center" },
  { id: "footer", name: "Footer message", text: "You're member #128 · enjoy your stay", x: 50, y: 76, color: "#e5e7eb", size: 10, weight: "normal", align: "center" },
];

function fill(template: string, memberCount: number) {
  return template
    .replaceAll("{user}", "@NewMember")
    .replaceAll("{username}", "NewMember")
    .replaceAll("{server}", "Your Server")
    .replaceAll("{member_count}", String(memberCount));
}

function readImage(file: File, onRead: (value: string) => void) {
  if (!file.type.startsWith("image/")) return;
  if (file.size > 1.5 * 1024 * 1024) return;
  const reader = new FileReader();
  reader.onload = () => {
    if (typeof reader.result === "string") onRead(reader.result);
  };
  reader.readAsDataURL(file);
}

export default function WelcomePage() {
  const { draft, setDraft, loading, saving, error, bridgeUnconfigured, dirty, save, data } =
    useConfig<WelcomeGoodbyeConfig>("/api/dashboard/welcome");
  const [layers, setLayers] = useState<TextLayer[]>(initialLayers);
  const [selectedId, setSelectedId] = useState("title");
  const [background, setBackground] = useState("");
  const [backgroundColor, setBackgroundColor] = useState("#17152d");
  const [accentColor, setAccentColor] = useState("#8b5cf6");
  const [tab, setTab] = useState<"design" | "message" | "goodbye">("design");\n  const [designHydrated, setDesignHydrated] = useState(false);\n  const [designSaveError, setDesignSaveError] = useState(false);
  const backgroundInput = useRef<HTMLInputElement>(null);
  const selectedLayer = layers.find((layer) => layer.id === selectedId);\n\n  useEffect(() => {\n    try {\n      const saved = window.localStorage.getItem("aishu-welcome-design-v1");\n      if (saved) {\n        const parsed = JSON.parse(saved) as Partial<WelcomeDesign>;\n        if (Array.isArray(parsed.layers) && parsed.layers.every((layer) =>\n          typeof layer.id === "string" && typeof layer.text === "string" &&\n          Number.isFinite(layer.x) && Number.isFinite(layer.y) &&\n          /^#[0-9a-fA-F]{6}$/.test(layer.color) && Number.isFinite(layer.size)\n        )) setLayers(parsed.layers);\n        if (typeof parsed.background === "string" && parsed.background.startsWith("data:image/")) setBackground(parsed.background);\n        if (typeof parsed.backgroundColor === "string" && /^#[0-9a-fA-F]{6}$/.test(parsed.backgroundColor)) setBackgroundColor(parsed.backgroundColor);\n        if (typeof parsed.accentColor === "string" && /^#[0-9a-fA-F]{6}$/.test(parsed.accentColor)) setAccentColor(parsed.accentColor);\n      }\n    } catch {\n      setDesignSaveError(true);\n    } finally {\n      setDesignHydrated(true);\n    }\n  }, []);\n\n  useEffect(() => {\n    if (!designHydrated) return;\n    try {\n      const design: WelcomeDesign = { layers, background, backgroundColor, accentColor };\n      window.localStorage.setItem("aishu-welcome-design-v1", JSON.stringify(design));\n      setDesignSaveError(false);\n    } catch {\n      setDesignSaveError(true);\n    }\n  }, [layers, background, backgroundColor, accentColor, designHydrated]);

  function updateLayer(id: string, patch: Partial<TextLayer>) {
    setLayers((current) => current.map((layer) => layer.id === id ? { ...layer, ...patch } : layer));
  }

  function removeLayer(id: string) {\n    const remaining = layers.filter((layer) => layer.id !== id);\n    setLayers(remaining);\n    if (selectedId === id) setSelectedId(remaining[0]?.id ?? "");\n  }\n\n  function addLayer() {
    const id = `text-${Date.now()}`;
    setLayers((current) => [...current, {
      id, name: `Text layer ${current.length + 1}`, text: "Your text here",
      x: 50, y: 65, color: "#ffffff", size: 16, weight: "bold", align: "center",
    }]);
    setSelectedId(id);
  }

  function resetDesign() {
    setLayers(initialLayers);
    setSelectedId("title");
    setBackground("");
    setBackgroundColor("#17152d");
    setAccentColor("#8b5cf6");
  }

  return (
    <div>
      <PageHeader
        title="Welcome Studio"
        description="Build a custom welcome-card composition with editable text layers, positioning, colors, and a background."
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
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-accent/25 bg-accent/5 p-4">
            <div className="flex items-start gap-3">
              <div className="rounded-card bg-accent/15 p-2 text-accent-bright"><Layers3 size={21} /></div>
              <div>
                <div className="font-medium text-base-100">Advanced canvas editor</div>
                <p className="mt-1 max-w-2xl text-sm text-base-400">
                  Arrange multiple text layers and preview your card. The current bot bridge only stores message text and channel settings; visual design is a local preview draft and is not sent to Discord.
                </p>
              </div>
            </div>
            <Badge tone="warn">Visual design: local draft</Badge>
          </div>

          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Welcome settings">
            <Button type="button" variant={tab === "design" ? "primary" : "secondary"} onClick={() => setTab("design")}>Canvas editor</Button>
            <Button type="button" variant={tab === "message" ? "primary" : "secondary"} onClick={() => setTab("message")}>Welcome message</Button>
            <Button type="button" variant={tab === "goodbye" ? "primary" : "secondary"} onClick={() => setTab("goodbye")}>Goodbye</Button>
          </div>

          {tab === "design" && (
            <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.8fr)]">
              <Card title="Live canvas" description="Preview only · sample member data · card ratio 16:9">
                <div className="overflow-hidden rounded-xl border border-base-700 bg-base-950 p-2 sm:p-4">
                  <div
                    className="relative mx-auto aspect-video w-full max-w-3xl overflow-hidden rounded-lg border border-white/10"
                    style={{
                      backgroundColor,
                      backgroundImage: background ? `linear-gradient(135deg, ${accentColor}35, transparent 60%), url("${background}")` : `radial-gradient(ellipse at 20% 15%, ${accentColor}70, transparent 48%), radial-gradient(ellipse at 90% 85%, #0ea5e955, transparent 50%)`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                    aria-label="Welcome card preview"
                  >
                    <div className="absolute inset-0 bg-black/10" />
                    <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full border border-white/15 bg-black/25 px-2 py-1 backdrop-blur-sm sm:left-5 sm:top-5 sm:px-3">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: accentColor }} />
                      <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-white/80 sm:text-[10px]">Aishu Community</span>
                    </div>
                    <div className="absolute left-1/2 top-[58%] flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white/80 text-lg font-bold text-white shadow-xl sm:h-16 sm:w-16 sm:text-2xl" style={{ backgroundColor: accentColor }}>
                      N
                    </div>
                    {layers.map((layer) => (
                      <button
                        key={layer.id}
                        type="button"
                        onClick={() => setSelectedId(layer.id)}
                        className={`absolute z-10 max-w-[92%] -translate-x-1/2 -translate-y-1/2 rounded px-1 py-0.5 outline-none transition-shadow ${selectedId === layer.id ? "ring-2 ring-white ring-offset-2 ring-offset-transparent" : "hover:ring-1 hover:ring-white/50"}`}
                        style={{
                          left: `${layer.x}%`,
                          top: `${layer.y}%`,
                          color: layer.color,
                          fontSize: `clamp(8px, ${layer.size / 7.5}vw, ${layer.size}px)`,
                          fontWeight: layer.weight === "bold" ? 800 : 400,
                          textAlign: layer.align,
                          textShadow: "0 2px 12px #0009",
                          whiteSpace: "pre-wrap",
                        }}
                        aria-label={`Select ${layer.name}`}
                      >
                        {layer.text}
                      </button>
                    ))}
                    <div className="absolute bottom-3 right-3 rounded-full border border-white/15 bg-black/25 px-2 py-1 text-[9px] text-white/60">WELCOME PREVIEW</div>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                  <div className="text-xs text-base-500">Tip: select a text item on the canvas or from the layers list to edit it.</div>
                  <Button type="button" variant="secondary" onClick={resetDesign}><RotateCcw size={14} className="mr-2 inline" />Reset design</Button>
                </div>
              </Card>

              <div className="space-y-4">
                <Card title="Background & theme">
                  <div className="space-y-4">
                    <FieldGroup label="Background color">
                      <div className="flex gap-2">
                        <input aria-label="Background color" type="color" value={backgroundColor} onChange={(event) => setBackgroundColor(event.target.value)} className="h-10 w-12 rounded border border-base-700 bg-base-900 p-1" />
                        <TextInput value={backgroundColor} onChange={(event) => /^#[0-9a-fA-F]{6}$/.test(event.target.value) && setBackgroundColor(event.target.value)} />
                      </div>
                    </FieldGroup>
                    <FieldGroup label="Accent color">
                      <div className="flex gap-2">
                        <input aria-label="Accent color" type="color" value={accentColor} onChange={(event) => setAccentColor(event.target.value)} className="h-10 w-12 rounded border border-base-700 bg-base-900 p-1" />
                        <TextInput value={accentColor} onChange={(event) => /^#[0-9a-fA-F]{6}$/.test(event.target.value) && setAccentColor(event.target.value)} />
                      </div>
                    </FieldGroup>
                    <input ref={backgroundInput} type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) readImage(file, setBackground); event.currentTarget.value = ""; }} />
                    <Button type="button" variant="secondary" className="w-full" onClick={() => backgroundInput.current?.click()}><ImagePlus size={15} className="mr-2 inline" />Upload background image</Button>
                    <p className="text-xs text-base-500">Image files up to 1.5 MB. Design settings are saved only in this browser; they are not uploaded to the dashboard server or Discord.</p>\n                    {designSaveError && <p role="status" className="text-xs text-warn">This browser could not save the design draft. Storage may be unavailable or full.</p>}
                    {background && <Button type="button" variant="secondary" className="w-full" onClick={() => setBackground("")}>Remove background image</Button>}
                  </div>
                </Card>

                <Card title="Layers" description="Select a layer to change its text, position, and typography.">
                  <div className="space-y-2">
                    {layers.map((layer) => (
                      <div key={layer.id} className={`flex items-center gap-2 rounded-card border p-2 ${selectedId === layer.id ? "border-accent bg-accent/10" : "border-base-800 bg-base-950/60"}`}>
                        <button type="button" onClick={() => setSelectedId(layer.id)} className="min-w-0 flex-1 text-left">
                          <span className="block truncate text-sm font-medium text-base-100">{layer.name}</span>
                          <span className="block truncate text-xs text-base-500">{layer.text}</span>
                        </button>
                        <button type="button" onClick={() => removeLayer(layer.id)} className="rounded p-2 text-base-500 hover:bg-base-800 hover:text-bad" aria-label={`Delete ${layer.name}`}><Trash2 size={15} /></button>
                      </div>
                    ))}
                    <Button type="button" variant="secondary" className="w-full" onClick={addLayer}><Plus size={15} className="mr-2 inline" />Add text layer</Button>
                  </div>
                </Card>

                {selectedLayer && (
                  <Card title="Selected layer" description={selectedLayer.name}>
                    <div className="space-y-4">
                      <FieldGroup label="Text">
                        <TextArea rows={2} maxLength={120} value={selectedLayer.text} onChange={(event) => updateLayer(selectedLayer.id, { text: event.target.value })} />
                      </FieldGroup>
                      <div className="grid grid-cols-2 gap-3">
                        <FieldGroup label="Text color">
                          <input aria-label="Text color" type="color" value={selectedLayer.color} onChange={(event) => updateLayer(selectedLayer.id, { color: event.target.value })} className="h-10 w-full rounded border border-base-700 bg-base-900 p-1" />
                        </FieldGroup>
                        <FieldGroup label="Font size · px">
                          <TextInput type="number" min={8} max={48} value={selectedLayer.size} onChange={(event) => updateLayer(selectedLayer.id, { size: Math.min(48, Math.max(8, Number(event.target.value) || 8)) })} />
                        </FieldGroup>
                      </div>
                      <FieldGroup label={`Horizontal position · ${selectedLayer.x}%`}>
                        <input aria-label="Horizontal position" type="range" min={5} max={95} value={selectedLayer.x} onChange={(event) => updateLayer(selectedLayer.id, { x: Number(event.target.value) })} className="w-full accent-[color:var(--accent,#8b5cf6)]" />
                      </FieldGroup>
                      <FieldGroup label={`Vertical position · ${selectedLayer.y}%`}>
                        <input aria-label="Vertical position" type="range" min={8} max={92} value={selectedLayer.y} onChange={(event) => updateLayer(selectedLayer.id, { y: Number(event.target.value) })} className="w-full accent-[color:var(--accent,#8b5cf6)]" />
                      </FieldGroup>
                      <div className="grid grid-cols-2 gap-2">
                        <Button type="button" variant={selectedLayer.weight === "bold" ? "primary" : "secondary"} onClick={() => updateLayer(selectedLayer.id, { weight: selectedLayer.weight === "bold" ? "normal" : "bold" })}><Type size={14} className="mr-2 inline" />{selectedLayer.weight === "bold" ? "Bold" : "Normal"}</Button>
                        <Button type="button" variant="secondary" onClick={() => updateLayer(selectedLayer.id, { align: selectedLayer.align === "center" ? "left" : "center" })}>{selectedLayer.align === "center" ? <AlignCenter size={14} className="mr-2 inline" /> : <AlignLeft size={14} className="mr-2 inline" />}{selectedLayer.align === "center" ? "Centered" : "Left aligned"}</Button>
                      </div>
                    </div>
                  </Card>
                )}
              </div>
            </div>
          )}

          {tab === "message" && (
            <Card title="Welcome message" description="These fields use the existing bot bridge contract. They are separate from the visual card draft.">
              <div className="space-y-4">
                <Toggle label="Welcome messages enabled" checked={draft.welcomeEnabled} onChange={(value) => setDraft({ ...draft, welcomeEnabled: value })} />
                <FieldGroup label="Welcome channel ID" hint="Paste the Discord channel ID. A channel picker needs a bridge lookup endpoint.">
                  <TextInput value={draft.welcomeChannelId ?? ""} onChange={(event) => setDraft({ ...draft, welcomeChannelId: event.target.value || null })} placeholder="123456789012345678" inputMode="numeric" />
                </FieldGroup>
                <FieldGroup label="Welcome message" hint="Variables: {user} {username} {server} {member_count}">
                  <TextArea value={draft.welcomeMessage} onChange={(event) => setDraft({ ...draft, welcomeMessage: event.target.value })} maxLength={2000} />
                </FieldGroup>
                <div className="rounded-card border border-base-800 bg-base-950 px-3 py-3 text-sm text-base-300">
                  <span className="mb-1 block text-xs uppercase tracking-wide text-base-500">Message preview</span>
                  {fill(draft.welcomeMessage, 128)}
                </div>
                <p className="text-xs text-warn">The existing bot runtime may still use its built-in welcome text. Saving this message does not enable the visual card until bot-side support is implemented and tested.</p>
              </div>
            </Card>
          )}

          {tab === "goodbye" && (
            <Card title="Goodbye settings">
              <div className="space-y-4">
                <Toggle label="Goodbye messages enabled" checked={draft.goodbyeEnabled} onChange={(value) => setDraft({ ...draft, goodbyeEnabled: value })} />
                <FieldGroup label="Goodbye channel ID">
                  <TextInput value={draft.goodbyeChannelId ?? ""} onChange={(event) => setDraft({ ...draft, goodbyeChannelId: event.target.value || null })} placeholder="123456789012345678" inputMode="numeric" />
                </FieldGroup>
                <FieldGroup label="Goodbye message" hint="Variables: {user} {username} {server} {member_count}">
                  <TextArea value={draft.goodbyeMessage} onChange={(event) => setDraft({ ...draft, goodbyeMessage: event.target.value })} maxLength={2000} />
                </FieldGroup>
                <div className="rounded-card border border-base-800 bg-base-950 px-3 py-3 text-sm text-base-300">
                  <span className="mb-1 block text-xs uppercase tracking-wide text-base-500">Message preview</span>
                  {fill(draft.goodbyeMessage, 127)}
                </div>
              </div>
            </Card>
          )}

          <p className="text-xs text-base-500">
            Auto role has moved to its own page — see{" "}
            <a href="/autorole" className="text-accent-bright hover:underline">Auto role</a>.
          </p>
        </div>
      )}
    </div>
  );
}
