"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  FiHome,
  FiClock,
  FiBookOpen,
  FiBookmark,
  FiShield,
  FiSettings,
  FiCpu,
} from "react-icons/fi";

const NAV_ITEMS = [
  { href: "/", label: "Home", icon: FiHome },
  { href: "/school/ehadir/attendance", label: "E-Hadir Scan", icon: FiClock },
  { href: "/erph", label: "E-RPH", icon: FiBookOpen },
  { href: "/library", label: "Library", icon: FiBookmark },
  { href: "/prefect", label: "Prefect", icon: FiShield },
  { href: "/tools/aiChat", label: "AI", icon: FiCpu },
  { href: "/admin", label: "Admin", icon: FiSettings },
];

export default function Sidebar() {
  const router = useRouter();

  return (
    <>
      {/* Desktop Left Sidebar (Fixed 80px) */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-[80px] bg-black/40 backdrop-blur-xl border-r border-white/10 z-50 flex-col items-center py-6 justify-between text-white">
        {/* Brand Crest */}
        <Link href="/" className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center hover:scale-105 transition shadow-lg">
          <span className="font-bold text-sm text-blue-400">CHS</span>
        </Link>

        {/* Center Icons */}
        <nav className="flex flex-col gap-4">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = router.pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                  active
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30"
                    : "text-gray-400 hover:text-white hover:bg-white/10"
                }`}
              >
                <Icon size={20} />
              </Link>
            );
          })}
        </nav>

        {/* Bottom Status Dot */}
        <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" title="System Operational" />
      </aside>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-black/70 backdrop-blur-xl border-t border-white/10 z-50 flex items-center justify-around px-2 text-white">
        {NAV_ITEMS.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const active = router.pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`p-2 rounded-xl flex flex-col items-center gap-1 ${
                active ? "text-blue-400" : "text-gray-400"
              }`}
            >
              <Icon size={20} />
              <span className="text-[10px]">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}