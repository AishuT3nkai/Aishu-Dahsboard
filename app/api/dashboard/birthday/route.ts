import { bridge } from "@/lib/bridge";
import { createConfigRoute } from "@/lib/apiHelpers";
import { birthdayConfigSchema } from "@/lib/validation";
import type { BirthdayConfig } from "@/lib/types";

export const { GET, PUT } = createConfigRoute<BirthdayConfig>(
  (guildId) => bridge.getBirthdayConfig(guildId) as Promise<BirthdayConfig>,
  (guildId, data) => bridge.setBirthdayConfig(guildId, data),
  birthdayConfigSchema
);
