"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Wallet,
  Receipt,
  CheckSquare,
  BarChart3,
  Building2,
  Users,
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const t = useTranslations();

  const navItems = [
    {
      href: "/dashboard",
      label: t("nav.dashboard"),
      icon: LayoutDashboard,
    },
    {
      href: "/budgets",
      label: t("nav.budgets"),
      icon: Wallet,
    },
    {
      href: "/expenses",
      label: t("nav.expenses"),
      icon: Receipt,
    },
    {
      href: "/approvals",
      label: t("nav.approvals"),
      icon: CheckSquare,
    },
    {
      href: "/reports",
      label: t("nav.reports"),
      icon: BarChart3,
    },
    {
      href: "/departments",
      label: t("nav.departments"),
      icon: Building2,
    },
    {
      href: "/users",
      label: t("nav.users"),
      icon: Users,
    },
  ];

  const isActive = (href: string) => {
    return pathname.includes(href);
  };

  return (
    <aside className="fixed left-0 top-16 z-40 h-[calc(100vh-4rem)] w-64 border-r bg-background">
      <nav className="flex h-full flex-col gap-2 p-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
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
  );
}
