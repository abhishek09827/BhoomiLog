"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const navItems = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Lands", href: "/dashboard/lands" },
  { label: "Farmers", href: "/dashboard/farmers" },
  { label: "Agreements", href: "/dashboard/agreements" },
  { label: "Crops", href: "/dashboard/crops" },
  { label: "Parchi", href: "/dashboard/parchi" },
  { label: "Payments", href: "/dashboard/payments" },
]

export function SidebarNav() {
  const pathname = usePathname()

  return (
    <nav className="space-y-2">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "block px-4 py-2 rounded-lg text-sm font-medium transition-colors",
            pathname === item.href ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-accent",
          )}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  )
}
