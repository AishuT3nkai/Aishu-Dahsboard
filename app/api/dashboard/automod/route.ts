import { bridge } from "@/lib/bridge";
import { createConfigRoute } from "@/lib/apiHelpers";
import { automodConfigSchema } from "@/lib/validation";
import type { AutomodConfig } from "@/lib/types";

export const { GET, PUT } = createConfigRoute<AutomodConfig>(
  (guildId) => bridge.getAutomodConfig(guildId) as Promise<AutomodConfig>,
  (guildId, data) => bridge.setAutomodConfig(guildId, data),
  automodConfigSchema
);
