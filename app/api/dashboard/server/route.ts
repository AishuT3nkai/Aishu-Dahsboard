import { bridge } from "@/lib/bridge";
import { createConfigRoute } from "@/lib/apiHelpers";
import { serverConfigSchema } from "@/lib/validation";
import type { ServerConfig } from "@/lib/types";

export const { GET, PUT } = createConfigRoute<ServerConfig>(
  (guildId) => bridge.getServerConfig(guildId) as Promise<ServerConfig>,
  (guildId, data) => bridge.setServerConfig(guildId, data),
  serverConfigSchema
);
