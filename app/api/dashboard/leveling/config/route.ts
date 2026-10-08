import { bridge } from "@/lib/bridge";
import { createConfigRoute } from "@/lib/apiHelpers";
import { levelingConfigSchema } from "@/lib/validation";
import type { LevelingConfig } from "@/lib/types";

export const { GET, PUT } = createConfigRoute<LevelingConfig>(
  (guildId) => bridge.getLevelingConfig(guildId) as Promise<LevelingConfig>,
  (guildId, data) => bridge.setLevelingConfig(guildId, data),
  levelingConfigSchema
);
