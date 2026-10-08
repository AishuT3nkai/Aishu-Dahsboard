"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { DiscordGuildSummary } from "@/lib/types";

interface GuildContextValue {
  guilds: DiscordGuildSummary[];
  guildId: string | null;
  setGuildId: (id: string) => void;
  loading: boolean;
  error: string | null;
}

const GuildContext = createContext<GuildContextValue | null>(null);

const STORAGE_KEY = "aishu_selected_guild";

export function GuildProvider({ children }: { children: React.ReactNode }) {
  const [guilds, setGuilds] = useState<DiscordGuildSummary[]>([]);
  const [guildId, setGuildIdState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/guild");
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? "Failed to load guilds.");
        }
        const body = (await res.json()) as { guilds: DiscordGuildSummary[] };
        if (cancelled) return;
        setGuilds(body.guilds);
        const stored = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
        const valid = body.guilds.find((g) => g.id === stored);
        setGuildIdState(valid ? valid.id : body.guilds[0]?.id ?? null);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load guilds.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setGuildId = useCallback((id: string) => {
    setGuildIdState(id);
    if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, id);
  }, []);

  return (
    <GuildContext.Provider value={{ guilds, guildId, setGuildId, loading, error }}>
      {children}
    </GuildContext.Provider>
  );
}

export function useGuild() {
  const ctx = useContext(GuildContext);
  if (!ctx) throw new Error("useGuild must be used inside GuildProvider.");
  return ctx;
}
