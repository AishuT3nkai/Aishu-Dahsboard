import { bridge } from "@/lib/bridge";
import { createConfigRoute } from "@/lib/apiHelpers";
import { moderationConfigSchema } from "@/lib/validation";
import type { ModerationConfig } from "@/lib/types";

export const { GET, PUT } = createConfigRoute<ModerationConfig>(
  (guildId) => bridge.getModerationConfig(guildId) as Promise<ModerationConfig>,
  (guildId, data) => bridge.setModerationConfig(guildId, data),
  moderationConfigSchema
);
