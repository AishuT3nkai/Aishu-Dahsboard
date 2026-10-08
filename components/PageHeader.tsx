"use client";

import { GuildSwitcher } from "./GuildSwitcher";

export function PageHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="font-display text-xl font-semibold text-base-100">{title}</h1>
        {description && <p className="mt-1 text-sm text-base-400">{description}</p>}
      </div>
      <GuildSwitcher />
    </div>
  );
}
