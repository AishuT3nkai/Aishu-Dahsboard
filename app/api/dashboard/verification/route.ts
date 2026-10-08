import { bridge } from "@/lib/bridge";
import { createConfigRoute } from "@/lib/apiHelpers";
import { verificationSchema } from "@/lib/validation";
import type { VerificationConfig } from "@/lib/types";

export const { GET, PUT } = createConfigRoute<VerificationConfig>(
  (guildId) => bridge.getVerification(guildId) as Promise<VerificationConfig>,
  (guildId, data) => bridge.setVerification(guildId, data),
  verificationSchema
);
