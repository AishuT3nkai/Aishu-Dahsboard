"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card, Badge, TextInput } from "@/components/ui";
import { COMMANDS, COMMAND_CATEGORIES } from "@/data/commands";
import type { CommandDoc } from "@/lib/types";

function statusBadge(status: CommandDoc["status"]) {
  if (status === "live") return <Badge tone="good">Live</Badge>;
  if (status === "planned") return <Badge tone="warn">Planned — not built yet</Badge>;
  return <Badge tone="bad">Should move to dashboard-only</Badge>;
}

export default function CommandsPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | "All">("All");

  const filtered = useMemo(() => {
    return COMMANDS.filter((c) => {
      if (category !== "All" && c.category !== category) return false;
      if (!query) return true;
      const q = query.toLowerCase();
      return c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q);
    });
  }, [query, category]);

  return (
    <div>
      <PageHeader title="Command info" description="Full documentation for every Aishu Bot command." />

      <div className="mb-4 flex flex-wrap gap-2">
        <TextInput
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search commands…"
          className="max-w-xs"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as typeof category)}
          className="focus-ring rounded-card border border-base-700 bg-base-900 px-3 py-2 text-sm text-base-100"
        >
          <option value="All">All categories</option>
          {COMMAND_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-3">
        {filtered.map((c) => (
          <Card key={c.name}>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm text-accent-bright">{c.name}</span>
                <Badge>{c.category}</Badge>
                <Badge tone="neutral">{c.side === "member" ? "Member-side" : "Dashboard/Admin-side"}</Badge>
              </div>
              {statusBadge(c.status)}
            </div>
            <p className="text-sm text-base-300">{c.description}</p>
            <dl className="mt-3 grid gap-x-6 gap-y-1.5 text-xs sm:grid-cols-2">
              <div>
                <dt className="text-base-500">Usage</dt>
                <dd className="font-mono text-base-200">{c.usage}</dd>
              </div>
              <div>
                <dt className="text-base-500">Permission</dt>
                <dd className="text-base-200">{c.permission}</dd>
              </div>
              <div>
                <dt className="text-base-500">Example</dt>
                <dd className="font-mono text-base-200">{c.example}</dd>
              </div>
              <div>
                <dt className="text-base-500">Languages</dt>
                <dd className="text-base-200">{c.availableLanguages.join(" • ")}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-base-500">Expected behavior</dt>
                <dd className="text-base-200">{c.expectedBehavior}</dd>
              </div>
              {c.relatedDashboardConfig && (
                <div className="sm:col-span-2">
                  <dt className="text-base-500">Related dashboard configuration</dt>
                  <dd className="text-base-200">{c.relatedDashboardConfig}</dd>
                </div>
              )}
              {c.note && (
                <div className="sm:col-span-2 rounded-card border border-warn/20 bg-warn/5 px-3 py-2 text-warn">
                  {c.note}
                </div>
              )}
            </dl>
          </Card>
        ))}
        {filtered.length === 0 && <p className="text-sm text-base-500">No commands match that search.</p>}
      </div>
    </div>
  );
}
