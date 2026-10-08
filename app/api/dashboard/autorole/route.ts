import { bridge } from "@/lib/bridge";
import { createConfigRoute } from "@/lib/apiHelpers";
import { autoroleConfigSchema } from "@/lib/validation";
import type { AutoroleConfig } from "@/lib/types";

export const { GET, PUT } = createConfigRoute<AutoroleConfig>(
  (guildId) => bridge.getAutoroleConfig(guildId) as Promise<AutoroleConfig>,
  (guildId, data) => bridge.setAutoroleConfig(guildId, data),
  autoroleConfigSchema
);
