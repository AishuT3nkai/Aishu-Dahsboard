import { bridge } from "@/lib/bridge";
import { createConfigRoute } from "@/lib/apiHelpers";
import { levelRewardsSchema } from "@/lib/validation";
import type { LevelRewardEntry } from "@/lib/types";

export const { GET, PUT } = createConfigRoute<LevelRewardEntry[]>(
  (guildId) => bridge.listLevelRewards(guildId) as Promise<LevelRewardEntry[]>,
  (guildId, data) => bridge.setLevelRewards(guildId, data),
  levelRewardsSchema
);
