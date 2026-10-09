export interface SessionUser {
  id: string;
  username: string;
  avatar: string | null;
}

export interface DiscordGuildSummary {
  id: string;
  name: string;
  icon: string | null;
}

export interface OverviewStats {
  botOnline: boolean;
  botLatencyMs: number | null;
  guildName: string;
  memberCount: number;
  onlineCount: number | null;
  verificationEnabled: boolean;
  welcomeEnabled: boolean;
  goodbyeEnabled: boolean;
  ticketsEnabled: boolean;
  levelingEnabled: boolean;
  openSuggestions: number;
  openReports: number;
}

export interface VerificationConfig {
  enabled: boolean;
  channelId: string | null;
  verifiedRoleId: string | null;
  unverifiedRoleId: string | null;
  minAccountAgeDays: number;
}

export interface WelcomeGoodbyeConfig {
  welcomeEnabled: boolean;
  welcomeChannelId: string | null;
  welcomeMessage: string;
  goodbyeEnabled: boolean;
  goodbyeChannelId: string | null;
  goodbyeMessage: string;
}

export interface AutomodConfig {
  enabled: boolean;
  spam_enabled: boolean;
  spam_messages: number;
  spam_window: number;
  duplicate_enabled: boolean;
  duplicate_messages: number;
  duplicate_window: number;
  mention_enabled: boolean;
  max_mentions: number;
  links_enabled: boolean;
  invites_enabled: boolean;
  keywords: string[];
  action: "delete" | "warn" | "timeout";
  timeout_minutes: number;
  escalation: boolean;
  exempt_roles: string[];
  exempt_channels: string[];
  action_cooldown: number;
}

export interface ModerationConfig {
  logChannelId: string | null;
  muteRoleId: string | null;
}

export interface WarningEntry {
  id: string;
  userId: string;
  username: string;
  moderatorId: string;
  reason: string;
  createdAt: string;
}

export interface TicketConfig {
  categoryId: string | null;
  supportRoleId: string | null;
  namingPattern: string;
  openMessage: string;
}

export interface SuggestionEntry {
  id: string;
  userId: string;
  username: string;
  content: string;
  status: "pending" | "approved" | "denied";
  note: string | null;
  createdAt: string;
}

export interface SuggestionConfig {
  channelId: string | null;
}

export interface ReportEntry {
  id: string;
  userId: string;
  username: string;
  content: string;
  status: "open" | "closed";
  createdAt: string;
}

export interface ReportConfig {
  channelId: string | null;
}

export interface BirthdayConfig {
  enabled: boolean;
  channelId: string | null;
  announcementFormat: string;
}

export interface AutoroleConfig {
  enabled: boolean;
  roleId: string | null;
}

export interface LevelingConfig {
  enabled: boolean;
  xpPerMessage: { min: number; max: number };
  xpCooldownSeconds: number;
  xpMultiplier: number;
  levelUpChannelId: string | null;
  levelUpMessage: string;
  excludedChannelIds: string[];
  excludedRoleIds: string[];
  antiSpamEnabled: boolean;
}

export interface LevelRewardEntry {
  id: string;
  level: number;
  roleId: string;
}

export interface LevelingUserEntry {
  userId: string;
  username: string;
  xp: number;
  level: number;
  rank: number;
}

export interface LanguageStats {
  totalMembersWithPreference: number;
  breakdown: { code: "id" | "tl" | "en"; label: string; count: number }[];
}

export interface ServerConfig {
  prefix: string;
  moderationLogChannelId: string | null;
}

export type CommandSide = "member" | "dashboard";

export interface CommandDoc {
  name: string;
  category:
    | "Community"
    | "Verification"
    | "Moderation"
    | "Server"
    | "Welcome"
    | "Tickets"
    | "Birthday"
    | "Suggestions"
    | "Reports"
    | "Leveling"
    | "Utility";
  description: string;
  usage: string;
  permission: string;
  example: string;
  expectedBehavior: string;
  relatedDashboardConfig: string | null;
  availableLanguages: ("ID" | "TL" | "EN")[];
  side: CommandSide;
  status: "live" | "planned" | "moving-to-dashboard";
  note?: string;
}
