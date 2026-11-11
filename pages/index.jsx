"use client";

import React, { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import useSettings from "@/hooks/useSettings";

export default function HomePage() {
  const settings = useSettings();
  const [studentCount, setStudentCount] = useState(0);
  const [staffCount, setStaffCount] = useState(0);
  const [greeting, setGreeting] = useState("Good Morning");
  const [currentDate, setCurrentDate] = useState("");

  useEffect(() => {
    // 1. Time greeting & date
    const now = new Date();
    const hour = now.getHours();
    setGreeting(
      hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening"
    );
    setCurrentDate(
      now.toLocaleDateString("en-US", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    );

    // 2. Fetch live counts from your public JSON data
    fetch("/api/school/getStudents.json")
      .then((res) => res.json())
      .then((data) => setStudentCount(Array.isArray(data) ? data.length : 0))
      .catch(() => setStudentCount(0));

    fetch("/api/school/getStaff.json")
      .then((res) => res.json())
      .then((data) => setStaffCount(Array.isArray(data) ? data.length : 0))
      .catch(() => setStaffCount(0));
  }, []);

  return (
    <>
      <Head>
        <title>{settings.NAME} - School Management System</title>
        <meta name="description" content="School Education Management System" />
      </Head>

      <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white font-out">
        <main className="flex-grow flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
          {/* Top Date Pill */}
          <div className="mb-6 bg-white/10 backdrop-blur-md rounded-full px-5 py-2 text-sm flex items-center gap-2 border border-white/10 shadow-lg">
            <span className="text-blue-300">📅</span>
            <span>{currentDate || "Loading date..."}</span>
          </div>

          {/* Center Brand */}
          <div className="text-center mb-8">
            <div className="w-24 h-24 mx-auto mb-4 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-2xl border border-white/20">
              <span className="text-4xl font-extrabold text-blue-400">CHS</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight drop-shadow-lg mb-2">
              SEMS
            </h1>
            <p className="text-xl text-blue-200 font-medium">School Management System</p>
            <p className="text-xs text-gray-400 mt-1">Version: v3.3.0</p>
          </div>

          {/* Greeting */}
          <div className="text-center mb-10">
            <p className="text-2xl md:text-3xl font-light">{greeting}</p>
          </div>

          {/* Student & Staff Counters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-xl mb-10">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 text-center border border-white/10 hover:bg-white/20 transition-all shadow-xl">
              <span className="text-3xl">👨‍🎓</span>
              <p className="text-3xl font-bold mt-2">{studentCount}</p>
              <p className="text-sm text-gray-300">Total Students</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 text-center border border-white/10 hover:bg-white/20 transition-all shadow-xl">
              <span className="text-3xl">👨‍🏫</span>
              <p className="text-3xl font-bold mt-2">{staffCount}</p>
              <p className="text-sm text-gray-300">Total Staff</p>
            </div>
          </div>

          {/* Quick Access Modules */}
          <div className="w-full max-w-2xl mb-12">
            <p className="text-center text-white/70 text-sm mb-4 font-medium">
              ⚡ Quick Access Modules
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              <Link
                href="/ehadir"
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 p-3.5 rounded-xl text-center text-xs font-semibold shadow-lg transition flex flex-col items-center gap-1.5"
              >
                <span className="text-lg">🕒</span>
                <span>E-Hadir</span>
              </Link>

              <Link
                href="/erph"
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-90 p-3.5 rounded-xl text-center text-xs font-semibold shadow-lg transition flex flex-col items-center gap-1.5"
              >
                <span className="text-lg">📖</span>
                <span>E-RPH</span>
              </Link>

              <Link
                href="/library"
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 p-3.5 rounded-xl text-center text-xs font-semibold shadow-lg transition flex flex-col items-center gap-1.5"
              >
                <span className="text-lg">📚</span>
                <span>Library (PSS)</span>
              </Link>

              <Link
                href="/prefect"
                className="bg-gradient-to-r from-amber-600 to-orange-600 hover:opacity-90 p-3.5 rounded-xl text-center text-xs font-semibold shadow-lg transition flex flex-col items-center gap-1.5"
              >
                <span className="text-lg">🛡️</span>
                <span>Prefect Board</span>
              </Link>

              <Link
                href="/admin"
                className="bg-gradient-to-r from-zinc-700 to-gray-800 hover:opacity-90 p-3.5 rounded-xl text-center text-xs font-semibold shadow-lg transition flex flex-col items-center gap-1.5"
              >
                <span className="text-lg">⚙️</span>
                <span>Admin Panel</span>
              </Link>

              <Link
                href="/tools/barcodeGenerator"
                className="bg-gradient-to-r from-sky-600 to-cyan-600 hover:opacity-90 p-3.5 rounded-xl text-center text-xs font-semibold shadow-lg transition flex flex-col items-center gap-1.5"
              >
                <span className="text-lg">🏷️</span>
                <span>Barcodes</span>
              </Link>

              <Link
                href="/school/pembelajaran"
                className="bg-gradient-to-r from-rose-600 to-red-600 hover:opacity-90 p-3.5 rounded-xl text-center text-xs font-semibold shadow-lg transition flex flex-col items-center gap-1.5"
              >
                <span className="text-lg">💻</span>
                <span>Pembelajaran</span>
              </Link>

              <Link
                href="/tools/aiChat"
                className="bg-gradient-to-r from-violet-600 to-purple-600 hover:opacity-90 p-3.5 rounded-xl text-center text-xs font-semibold shadow-lg transition flex flex-col items-center gap-1.5"
              >
                <span className="text-lg">🤖</span>
                <span>AI Assistant</span>
              </Link>
            </div>
          </div>

          {/* Operational Status Indicators */}
          <div className="flex items-center justify-center gap-4 text-xs text-gray-300">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span> System Operational
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-400"></span> Secure Connection
            </span>
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-black/40 backdrop-blur-md border-t border-white/10 text-gray-300 text-xs py-6 px-4">
          <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
            <div>
              <p className="font-bold text-white text-sm">{settings.NAME}</p>
              <p className="text-gray-400 mt-0.5">{settings.ADDRESS}</p>
              <p className="text-gray-400">Email: {settings.EMAIL} | Fax: {settings.FAX}</p>
            </div>
            <p className="text-gray-500">
              Copyright © 2024 - 2026 School Education Management System. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </>
  );
}