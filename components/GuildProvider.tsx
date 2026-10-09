"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { DiscordGuildSummary } from "@/lib/types";

interface GuildContextValue {
  guilds: DiscordGuildSummary[];
  guildId: string | null;
  setGuildId: (id: string) => void;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

const GuildContext = createContext<GuildContextValue | null>(null);
const STORAGE_KEY = "aishu_selected_guild";

export function GuildProvider({ children }: { children: React.ReactNode }) {
  const [guilds, setGuilds] = useState<DiscordGuildSummary[]>([]);
  const [guildId, setGuildIdState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadTick, setReloadTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const res = await fetch("/api/guild");
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body.error ?? "Failed to load Discord servers.");

        const nextGuilds: DiscordGuildSummary[] = Array.isArray(body.guilds)
          ? body.guilds.filter(
              (guild: unknown): guild is DiscordGuildSummary =>
                typeof guild === "object" &&
                guild !== null &&
                "id" in guild &&
                typeof guild.id === "string" &&
                "name" in guild &&
                typeof guild.name === "string"
            ).map((guild) => ({
              id: guild.id,
              name: guild.name,
              icon: typeof guild.icon === "string" ? guild.icon : null,
            }))
          : [];
        if (cancelled) return;
        setGuilds(nextGuilds);

        let stored: string | null = null;
        try {
          stored = window.localStorage.getItem(STORAGE_KEY);
        } catch {
          // Continue with the first available guild when storage is unavailable.
        }
        const selectedStillAvailable = nextGuilds.find((guild) => guild.id === stored);
        const currentStillAvailable = nextGuilds.find((guild) => guild.id === guildId);
        const nextSelected = selectedStillAvailable?.id ?? currentStillAvailable?.id ?? nextGuilds[0]?.id ?? null;
        setGuildIdState(nextSelected);

        try {
          if (nextSelected) window.localStorage.setItem(STORAGE_KEY, nextSelected);
          else window.localStorage.removeItem(STORAGE_KEY);
        } catch {
          // Guild selection remains available for the current session.
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load Discord servers.");
          setGuilds([]);
          setGuildIdState(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [reloadTick]);

  const setGuildId = useCallback((id: string) => {
    setGuildIdState(id);
    try {
      window.localStorage.setItem(STORAGE_KEY, id);
    } catch {
      // The selected guild still works for this session when storage is unavailable.
    }
  }, []);

  const reload = useCallback(() => setReloadTick((tick) => tick + 1), []);

  return (
    <GuildContext.Provider value={{ guilds, guildId, setGuildId, loading, error, reload }}>
      {children}
    </GuildContext.Provider>
  );
}

export function useGuild() {
  const ctx = useContext(GuildContext);
  if (!ctx) throw new Error("useGuild must be used inside GuildProvider.");
  return ctx;
}
