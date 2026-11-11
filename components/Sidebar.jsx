"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  FiHome,
  FiCamera,
  FiClock,
  FiBookOpen,
  FiBookmark,
  FiShield,
  FiSettings,
  FiCpu,
  FiMenu,
  FiX,
} from "react-icons/fi";

const NAV_ITEMS = [
  { href: "/", label: "Home", icon: FiHome },
  { href: "/school/ehadir/attendance", label: "E-Hadir Scan", icon: FiCamera },
  { href: "/ehadir", label: "Check Status", icon: FiClock },
  { href: "/erph", label: "E-RPH", icon: FiBookOpen },
  { href: "/library", label: "Library", icon: FiBookmark },
  { href: "/prefect", label: "Prefect", icon: FiShield },
  { href: "/tools/aiChat", label: "AI Assistant", icon: FiCpu },
  { href: "/admin", label: "Admin Panel", icon: FiSettings },
];

export default function Sidebar() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile Top Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/20 text-white shadow-xl"
      >
        {isOpen ? <FiX size={20} /> : <FiMenu size={20} />}
      </button>

      {/* Backdrop overlay on mobile */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="lg:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
        />
      )}

      {/* Actual Left Vertical Sidebar (Desktop + Mobile Slide-Out) */}
      <aside
        className={`fixed left-0 top-0 h-screen bg-black/70 backdrop-blur-2xl border-r border-white/10 z-40 flex flex-col items-center py-6 justify-between text-white transition-all duration-300 ${
          isOpen ? "w-[220px] px-4" : "w-[70px] lg:w-[80px]"
        } ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        {/* Brand Logo */}
        <Link
          href="/"
          onClick={() => setIsOpen(false)}
          className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center hover:scale-105 transition shadow-lg mt-8 lg:mt-0 flex-shrink-0"
        >
          <span className="font-extrabold text-sm text-blue-400">CHS</span>
        </Link>

        {/* Navigation Links */}
        <nav className="flex flex-col gap-3 w-full my-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = router.pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-4 rounded-xl py-3 transition-all ${
                  isOpen ? "px-4 w-full" : "justify-center w-12 h-12 mx-auto"
                } ${
                  active
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 font-semibold"
                    : "text-gray-400 hover:text-white hover:bg-white/10"
                }`}
              >
                <Icon size={20} className="flex-shrink-0" />
                {isOpen && <span className="text-xs truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* System Online Status Indicator */}
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          {isOpen && <span className="text-[10px] text-gray-400">System Online</span>}
        </div>
      </aside>
    </>
  );
}