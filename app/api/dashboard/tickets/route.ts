import { bridge } from "@/lib/bridge";
import { createConfigRoute } from "@/lib/apiHelpers";
import { ticketConfigSchema } from "@/lib/validation";
import type { TicketConfig } from "@/lib/types";

export const { GET, PUT } = createConfigRoute<TicketConfig>(
  (guildId) => bridge.getTicketConfig(guildId) as Promise<TicketConfig>,
  (guildId, data) => bridge.setTicketConfig(guildId, data),
  ticketConfigSchema
);
