import { bridge } from "@/lib/bridge";
import { createConfigRoute } from "@/lib/apiHelpers";
import { suggestionConfigSchema } from "@/lib/validation";
import type { SuggestionConfig } from "@/lib/types";

export const { GET, PUT } = createConfigRoute<SuggestionConfig>(
  (guildId) => bridge.getSuggestionConfig(guildId) as Promise<SuggestionConfig>,
  (guildId, data) => bridge.setSuggestionConfig(guildId, data),
  suggestionConfigSchema
);
