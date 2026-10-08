"use client";

import { useCallback, useEffect, useState } from "react";
import { useGuild } from "@/components/GuildProvider";

interface UseConfigResult<T> {
  data: T | null;
  draft: T | null;
  setDraft: (value: T | ((prev: T) => T)) => void;
  loading: boolean;
  saving: boolean;
  error: string | null;
  bridgeUnconfigured: boolean;
  dirty: boolean;
  save: () => Promise<void>;
  reload: () => void;
}

export function useConfig<T>(endpoint: string): UseConfigResult<T> {
  const { guildId } = useGuild();
  const [data, setData] = useState<T | null>(null);
  const [draft, setDraft] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bridgeUnconfigured, setBridgeUnconfigured] = useState(false);
  const [reloadTick, setReloadTick] = useState(0);

  useEffect(() => {
    if (!guildId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setBridgeUnconfigured(false);
    (async () => {
      try {
        const res = await fetch(`${endpoint}?guildId=${guildId}`);
        const body = await res.json();
        if (!res.ok) {
          if (body.code === "BRIDGE_NOT_CONFIGURED") setBridgeUnconfigured(true);
          throw new Error(body.error ?? "Failed to load.");
        }
        if (cancelled) return;
        setData(body.data);
        setDraft(body.data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [endpoint, guildId, reloadTick]);

  const save = useCallback(async () => {
    if (!guildId || draft === null) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`${endpoint}?guildId=${guildId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const body = await res.json();
      if (!res.ok) {
        if (body.code === "BRIDGE_NOT_CONFIGURED") setBridgeUnconfigured(true);
        throw new Error(body.error ?? "Failed to save.");
      }
      setData(body.data);
      setDraft(body.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save.");
      throw err;
    } finally {
      setSaving(false);
    }
  }, [endpoint, guildId, draft]);

  const dirty = JSON.stringify(data) !== JSON.stringify(draft);

  return {
    data,
    draft,
    setDraft: setDraft as UseConfigResult<T>["setDraft"],
    loading,
    saving,
    error,
    bridgeUnconfigured,
    dirty,
    save,
    reload: () => setReloadTick((t) => t + 1),
  };
}
