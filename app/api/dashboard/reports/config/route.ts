import { bridge } from "@/lib/bridge";
import { createConfigRoute } from "@/lib/apiHelpers";
import { reportConfigSchema } from "@/lib/validation";
import type { ReportConfig } from "@/lib/types";

export const { GET, PUT } = createConfigRoute<ReportConfig>(
  (guildId) => bridge.getReportConfig(guildId) as Promise<ReportConfig>,
  (guildId, data) => bridge.setReportConfig(guildId, data),
  reportConfigSchema
);
