"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Wallet,
  Receipt,
  CheckSquare,
  Building2,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Sidebar() {
  const pathname = usePathname();
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations();
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    {
      href: `/${locale}/dashboard`,
      label: t("nav.dashboard"),
      icon: LayoutDashboard,
    },
    {
      href: `/${locale}/dashboard/budgets`,
      label: t("nav.budgets"),
      icon: Wallet,
    },
    {
      href: `/${locale}/dashboard/allocations`,
      label: t("nav.expenses"),
      icon: Receipt,
    },
    {
      href: `/${locale}/dashboard/approvals`,
      label: t("nav.approvals"),
      icon: CheckSquare,
    },
    {
      href: `/${locale}/dashboard/divisions`,
      label: t("nav.divisions"),
      icon: Building2,
    },
    {
      href: `/${locale}/dashboard/users`,
      label: t("nav.users"),
      icon: Users,
    },
  ];

  const isActive = (href: string) => {
    if (href === `/${locale}/dashboard`) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-16 z-50 h-[calc(100vh-4rem)] w-64 border-r bg-background transition-transform duration-300",
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* Close button for mobile */}
        <div className="flex items-center justify-between p-4 md:hidden">
          <span className="text-lg font-semibold">
            {t("nav.menu") || "Menu"}
          </span>
          <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="flex h-full flex-col gap-2 p-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive(item.href)
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile menu button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 rounded-full bg-primary p-4 text-primary-foreground shadow-lg md:hidden hover:bg-primary/90 transition-colors"
          aria-label="Open menu"
        >
          <svg
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
      )}
    </>
  );
}
