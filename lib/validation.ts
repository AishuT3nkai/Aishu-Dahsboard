import { z } from "zod";

const snowflake = z.string().regex(/^\d{15,25}$/, "Must be a Discord ID (snowflake).");
const optionalSnowflake = snowflake.nullable();

export const verificationSchema = z.object({
  enabled: z.boolean(),
  channelId: optionalSnowflake,
  verifiedRoleId: optionalSnowflake,
  unverifiedRoleId: optionalSnowflake,
  minAccountAgeDays: z.number().int().min(0).max(365),
});

export const welcomeGoodbyeSchema = z.object({
  welcomeEnabled: z.boolean(),
  welcomeChannelId: optionalSnowflake,
  welcomeMessage: z.string().max(1000),
  goodbyeEnabled: z.boolean(),
  goodbyeChannelId: optionalSnowflake,
  goodbyeMessage: z.string().max(1000),
});

export const automodConfigSchema = z.object({
  enabled: z.boolean(),
  spam_enabled: z.boolean(),
  spam_messages: z.number().int().min(2).max(20),
  spam_window: z.number().int().min(2).max(60),
  duplicate_enabled: z.boolean(),
  duplicate_messages: z.number().int().min(2).max(20),
  duplicate_window: z.number().int().min(2).max(60),
  mention_enabled: z.boolean(),
  max_mentions: z.number().int().min(1).max(20),
  links_enabled: z.boolean(),
  invites_enabled: z.boolean(),
  keywords: z.array(z.string().min(1).max(100)).max(100),
  action: z.enum(["delete", "warn", "timeout"]),
  timeout_minutes: z.number().int().min(1).max(60),
  escalation: z.boolean(),
  exempt_roles: z.array(snowflake).max(100),
  exempt_channels: z.array(snowflake).max(100),
  action_cooldown: z.number().int().min(0).max(60),
});

export const moderationConfigSchema = z.object({
  logChannelId: optionalSnowflake,
  muteRoleId: optionalSnowflake,
});

export const ticketConfigSchema = z.object({
  categoryId: optionalSnowflake,
  supportRoleId: optionalSnowflake,
  namingPattern: z.string().min(1).max(50),
  openMessage: z.string().max(1000),
});

export const suggestionConfigSchema = z.object({
  channelId: optionalSnowflake,
});

export const reportConfigSchema = z.object({
  channelId: optionalSnowflake,
});

export const birthdayConfigSchema = z.object({
  enabled: z.boolean(),
  channelId: optionalSnowflake,
  announcementFormat: z.string().max(300),
});

export const autoroleConfigSchema = z.object({
  enabled: z.boolean(),
  roleId: optionalSnowflake,
});

export const levelingConfigSchema = z.object({
  enabled: z.boolean(),
  xpPerMessage: z.object({ min: z.number().int().min(0), max: z.number().int().min(0) }),
  xpCooldownSeconds: z.number().int().min(0).max(3600),
  xpMultiplier: z.number().min(0.1).max(10),
  levelUpChannelId: optionalSnowflake,
  levelUpMessage: z.string().max(500),
  excludedChannelIds: z.array(snowflake),
  excludedRoleIds: z.array(snowflake),
  antiSpamEnabled: z.boolean(),
});

export const levelRewardsSchema = z.array(
  z.object({ id: z.string(), level: z.number().int().min(1).max(1000), roleId: snowflake })
);

export const serverConfigSchema = z.object({
  prefix: z.string().min(1).max(5),
  moderationLogChannelId: optionalSnowflake,
});

export const xpSetSchema = z.object({ xp: z.number().int().min(0) });

export const suggestionDecisionSchema = z.object({
  decision: z.enum(["approved", "denied"]),
  note: z.string().max(500).optional(),
});
