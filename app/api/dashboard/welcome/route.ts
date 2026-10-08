import { bridge } from "@/lib/bridge";
import { createConfigRoute } from "@/lib/apiHelpers";
import { welcomeGoodbyeSchema } from "@/lib/validation";
import type { WelcomeGoodbyeConfig } from "@/lib/types";

export const { GET, PUT } = createConfigRoute<WelcomeGoodbyeConfig>(
  (guildId) => bridge.getWelcomeGoodbye(guildId) as Promise<WelcomeGoodbyeConfig>,
  (guildId, data) => bridge.setWelcomeGoodbye(guildId, data),
  welcomeGoodbyeSchema
);
