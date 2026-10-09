"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  ShieldCheck,
  Gavel,
  ShieldAlert,
  DoorOpen,
  Ticket,
  Lightbulb,
  Flag,
  Cake,
  UserPlus,
  TrendingUp,
  Languages,
  Server,
  BookOpen,
  Settings,
  Menu,
  X,
  LogOut,
} from "lucide-react";
import type { SessionUser } from "@/lib/types";

const NAV_SECTIONS: { label: string; items: { href: string; label: string; icon: React.ElementType }[] }[] = [
  {
    label: "",
    items: [{ href: "/overview", label: "Overview", icon: LayoutDashboard }],
  },
  {
    label: "Server",
    items: [
      { href: "/server", label: "Server config", icon: Server },
      { href: "/verification", label: "Verification", icon: ShieldCheck },
      { href: "/moderation", label: "Moderation", icon: Gavel },
      { href: "/automod", label: "AutoMod", icon: ShieldAlert },
      { href: "/welcome", label: "Welcome & goodbye", icon: DoorOpen },
      { href: "/tickets", label: "Tickets", icon: Ticket },
      { href: "/suggestions", label: "Suggestions", icon: Lightbulb },
      { href: "/reports", label: "Reports", icon: Flag },
      { href: "/birthday", label: "Birthday", icon: Cake },
      { href: "/autorole", label: "Auto role", icon: UserPlus },
      { href: "/leveling", label: "Leveling", icon: TrendingUp },
      { href: "/languages", label: "Languages", icon: Languages },
    ],
  },
  {
    label: "Reference",
    items: [
      { href: "/commands", label: "Command info", icon: BookOpen },
      { href: "/settings", label: "Settings", icon: Settings },
    ],
  },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-1 flex-col gap-5 overflow-y-auto px-3 py-4">
      {NAV_SECTIONS.map((section, i) => (
        <div key={i}>
          {section.label && (
            <div className="mb-1.5 px-3 text-xs font-medium uppercase tracking-wide text-base-500">
              {section.label}
            </div>
          )}
          <div className="flex flex-col gap-0.5">
            {section.items.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={`focus-ring flex items-center gap-2.5 rounded-card px-3 py-2 text-sm transition-colors ${
                    active
                      ? "bg-accent/15 text-accent-bright"
                      : "text-base-300 hover:bg-base-800 hover:text-base-100"
                  }`}
                >
                  <Icon size={16} strokeWidth={2} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

function ProfileBlock({ user }: { user: SessionUser }) {
  const avatarUrl = user.avatar
    ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=64`
    : `https://cdn.discordapp.com/embed/avatars/${Number(BigInt(user.id) % 5n)}.png`;

  return (
    <div className="flex items-center gap-3 border-t border-base-800 px-4 py-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={avatarUrl} alt="" className="h-8 w-8 rounded-full" />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-base-100">{user.username}</div>
        <div className="text-xs text-base-500">Dashboard admin</div>
      </div>
      <form action="/api/auth/logout" method="post">
        <button type="submit" className="focus-ring rounded-card p-2 text-base-400 hover:bg-base-800 hover:text-base-100" title="Log out">
          <LogOut size={16} />
        </button>
      </form>
    </div>
  );
}

export function Sidebar({ user }: { user: SessionUser }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-base-800 bg-base-900/40 md:flex">
        <div className="flex items-center gap-2 px-4 py-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-card bg-accent/15 font-display text-sm font-semibold text-accent-bright">
            A
          </div>
          <span className="font-display text-sm font-semibold text-base-100">Aishu Bot</span>
        </div>
        <NavLinks />
        <ProfileBlock user={user} />
      </aside>

      {/* Mobile top bar */}
      <div className="flex items-center justify-between border-b border-base-800 bg-base-900/60 px-4 py-3 md:hidden">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-card bg-accent/15 font-display text-xs font-semibold text-accent-bright">
            A
          </div>
          <span className="font-display text-sm font-semibold text-base-100">Aishu Bot</span>
        </div>
        <button
          className="focus-ring rounded-card p-2 text-base-300"
          onClick={() => setMobileOpen(true)}
          aria-label="Open navigation"
        >
          <Menu size={20} />
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-72 flex-col bg-base-900">
            <div className="flex items-center justify-between px-4 py-4">
              <span className="font-display text-sm font-semibold text-base-100">Aishu Bot</span>
              <button
                className="focus-ring rounded-card p-2 text-base-300"
                onClick={() => setMobileOpen(false)}
                aria-label="Close navigation"
              >
                <X size={20} />
              </button>
            </div>
            <NavLinks onNavigate={() => setMobileOpen(false)} />
            <ProfileBlock user={user} />
          </div>
        </div>
      )}
    </>
  );
}
