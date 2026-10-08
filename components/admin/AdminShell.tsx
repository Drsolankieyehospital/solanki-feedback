"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "./icons";
import type { AdminIdentity } from "@/lib/auth";

interface NavItem {
  href: string;
  label: string;
  icon: IconName;
  adminOnly?: boolean;
}

const NAV: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: "grid" },
  { href: "/admin/feedback", label: "Feedback", icon: "list" },
  { href: "/admin/reports/staff", label: "Staff report", icon: "user" },
  { href: "/admin/reports/date", label: "Date report", icon: "calendar" },
  { href: "/admin/qr", label: "QR codes", icon: "qr" },
  { href: "/admin/staff", label: "OPD staff", icon: "badge", adminOnly: true },
  { href: "/admin/backups", label: "Backups", icon: "save", adminOnly: true },
  { href: "/admin/users", label: "Users", icon: "users", adminOnly: true },
];

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function AdminShell({
  admin,
  signOutAction,
  children,
}: {
  admin: AdminIdentity;
  signOutAction: () => void;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const items = NAV.filter((n) => !n.adminOnly || admin.role === "admin");

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  return (
    <div className="flex min-h-dvh bg-canvas">
      {/* sidebar / drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[260px] max-w-[84vw] flex-col bg-surface p-3.5 pt-5 shadow-[0_0_40px_rgba(10,20,40,.25)] transition-transform duration-200 md:static md:z-auto md:w-[232px] md:shadow-none md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        } md:border-r md:border-divider`}
      >
        <div className="flex items-center gap-2.5 px-2 pb-4">
          <span className="grid h-[38px] w-[38px] flex-none place-items-center rounded-xl bg-primary shadow-card">
            <svg viewBox="0 0 24 24" fill="none" className="h-[22px] w-[22px]">
              <path
                d="M12 5C6.5 5 2.7 9.2 1.5 12c1.2 2.8 5 7 10.5 7s9.3-4.2 10.5-7C21.3 9.2 17.5 5 12 5Z"
                stroke="#fff"
                strokeWidth="1.6"
              />
              <circle cx="12" cy="12" r="3.2" fill="#fff" />
            </svg>
          </span>
          <div className="leading-tight">
            <b className="font-display text-[14.5px] text-ink">Dr. Solanki</b>
            <span className="block text-[11px] text-muted">
              Eye Hospital · Feedback
            </span>
          </div>
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="ml-auto p-1.5 text-muted md:hidden"
          >
            <Icon name="x" className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex flex-col gap-0.5">
          {items.map((n) => {
            const active = isActive(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13.5px] font-medium transition ${
                  active
                    ? "bg-primary text-white"
                    : "text-muted hover:bg-primary-tint hover:text-ink"
                }`}
              >
                <Icon name={n.icon} />
                {n.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto flex items-center gap-2.5 border-t border-divider px-2 pt-3">
          <span className="grid h-8 w-8 flex-none place-items-center rounded-full bg-gradient-to-br from-[#F6C9B8] to-[#F4A6C0] text-[12px] font-bold text-[#7a3b52]">
            {initials(admin.fullName)}
          </span>
          <div className="min-w-0 leading-tight">
            <b className="block truncate text-[12.5px] text-ink">
              {admin.fullName}
            </b>
            <span className="text-[11px] capitalize text-muted">{admin.role}</span>
          </div>
          <form action={signOutAction} className="ml-auto">
            <button
              type="submit"
              aria-label="Sign out"
              className="grid h-8 w-8 place-items-center rounded-lg text-muted transition hover:bg-primary-tint hover:text-ink"
            >
              <Icon name="logout" className="h-[18px] w-[18px]" />
            </button>
          </form>
        </div>
      </aside>

      {/* scrim */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-[rgba(10,20,40,.45)] md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-divider bg-canvas/85 px-4 py-3 backdrop-blur md:px-6">
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setOpen(true)}
            className="grid h-[38px] w-[38px] place-items-center rounded-xl border border-divider bg-surface text-ink md:hidden"
          >
            <Icon name="menu" className="h-5 w-5" />
          </button>
          <div className="font-display text-[15px] font-semibold text-ink">
            {NAV.find((n) => isActive(n.href))?.label ?? "Admin"}
          </div>
        </header>

        <main className="min-w-0 flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
