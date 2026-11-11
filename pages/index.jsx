"use client";

import React, { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import { motion } from "framer-motion";

export default function HomePage() {
  const [studentCount, setStudentCount] = useState(0);
  const [staffCount, setStaffCount] = useState(0);
  const [currentDate, setCurrentDate] = useState("Tuesday, 10 November 2026");
  const [greeting, setGreeting] = useState("Good Morning");

  useEffect(() => {
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

    fetch("/api/school/getStudents")
      .then((res) => res.json())
      .then((data) => setStudentCount(Array.isArray(data) ? data.length : 0))
      .catch(() => setStudentCount(0));

    fetch("/api/school/getStaff")
      .then((res) => res.json())
      .then((data) => setStaffCount(Array.isArray(data) ? data.length : 0))
      .catch(() => setStaffCount(0));
  }, []);

  return (
    <>
      <Head>
        <title>SMJK Katholik Melaka - SEMS</title>
        <meta name="title" content="SMJK Katholik Melaka" />
        <meta name="description" content="School Management System for SMJK Katholik Melaka" />
      </Head>

      <div className="flex flex-col min-h-screen lg:ml-[80px] font-out bg-[#fffdfd] dark:bg-[#242424] overflow-x-hidden text-white pb-16 lg:pb-0">
        <main className="flex-grow overflow-auto">
          <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
            <div
              className="relative min-h-screen w-full bg-cover bg-center bg-fixed"
              style={{ backgroundImage: "url('/background.jpg')" }}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/70" />

              <div className="relative z-10 max-w-7xl mx-auto px-4 py-8 md:py-12 min-h-screen flex flex-col">
                {/* Top Live Date Pill */}
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="flex justify-between items-center mb-6 flex-wrap gap-3"
                >
                  <div className="bg-white/10 backdrop-blur-md rounded-full px-4 py-2 text-white text-sm flex items-center gap-2 border border-white/10 shadow-lg">
                    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 448 512" className="text-blue-300" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                      <path d="M0 464c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48V192H0v272zm320-196c0-6.6 5.4-12 12-12h40c6.6 0 12 5.4 12 12v40c0 6.6-5.4 12-12 12h-40c-6.6 0-12-5.4-12-12v-40zm0 128c0-6.6 5.4-12 12-12h40c6.6 0 12 5.4 12 12v40c0 6.6-5.4 12-12 12h-40c-6.6 0-12-5.4-12-12v-40zM192 268c0-6.6 5.4-12 12-12h40c6.6 0 12 5.4 12 12v40c0 6.6-5.4 12-12 12h-40c-6.6 0-12-5.4-12-12v-40zm0 128c0-6.6 5.4-12 12-12h40c6.6 0 12 5.4 12 12v40c0 6.6-5.4 12-12 12h-40c-6.6 0-12-5.4-12-12v-40zM64 268c0-6.6 5.4-12 12-12h40c6.6 0 12 5.4 12 12v40c0 6.6-5.4 12-12 12H76c-6.6 0-12-5.4-12-12v-40zm0 128c0-6.6 5.4-12 12-12h40c6.6 0 12 5.4 12 12v40c0 6.6-5.4 12-12 12H76c-6.6 0-12-5.4-12-12v-40zM400 64h-48V16c0-8.8-7.2-16-16-16h-32c-8.8 0-16 7.2-16 16v48H160V16c0-8.8-7.2-16-16-16h-32c-8.8 0-16 7.2-16 16v48H48C21.5 64 0 85.5 0 112v48h448v-48c0-26.5-21.5-48-48-48z" />
                    </svg>
                    <span>{currentDate}</span>
                  </div>
                </motion.div>

                {/* Hero Logo & SEMS Title */}
                <div className="flex-1 flex flex-col items-center justify-center">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-8"
                  >
                    <div className="inline-block mb-4">
                      <div className="w-24 h-24 mx-auto bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-2xl border border-white/20">
                        <span className="text-4xl font-extrabold text-blue-400">CHS</span>
                      </div>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-bold text-white drop-shadow-lg mb-2">SEMS</h1>
                    <p className="text-xl text-blue-200 font-medium">School Management System</p>
                    <p className="text-sm text-gray-300 mt-2">Version: v3.3.0</p>
                  </motion.div>

                  {/* Greeting */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="text-center mb-12"
                  >
                    <p className="text-2xl md:text-3xl text-white font-light mb-2">{greeting}</p>
                    <div className="inline-block" />
                  </motion.div>

                  {/* Student & Staff Metric Cards */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-3xl mb-12"
                  >
                    <motion.div whileHover={{ scale: 1.03 }} className="bg-white/10 backdrop-blur-md rounded-2xl p-4 text-center hover:bg-white/20 transition-all duration-300 group cursor-pointer border border-white/10 shadow-lg">
                      <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 448 512" className="w-8 h-8 text-blue-300 mx-auto mb-2 group-hover:scale-110 transition-transform" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                        <path d="M319.4 320.6L224 416l-95.4-95.4C57.1 323.7 0 382.2 0 454.4v9.6c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48v-9.6c0-72.2-57.1-130.7-128.6-133.8zM13.6 79.8l6.4 1.5v58.4c-7 4.2-12 11.5-12 20.3 0 8.4 4.6 15.4 11.1 19.7L3.5 242c-1.7 6.9 2.1 14 7.6 14h41.8c5.5 0 9.3-7.1 7.6-14l-15.6-62.3C51.4 175.4 56 168.4 56 160c0-8.8-5-16.1-12-20.3V87.1l66 15.9c-8.6 17.2-14 36.4-14 57 0 70.7 57.3 128 128 128s128-57.3 128-128c0-20.6-5.3-39.8-14-57l96.3-23.2c18.2-4.4 18.2-27.1 0-31.5l-190.4-46c-13-3.1-26.7-3.1-39.7 0L13.6 48.2c-18.1 4.4-18.1 27.2 0 31.6z" />
                      </svg>
                      <p className="text-2xl font-bold text-white">{studentCount}</p>
                      <p className="text-sm text-gray-300">Total Students</p>
                    </motion.div>

                    <motion.div whileHover={{ scale: 1.03 }} className="bg-white/10 backdrop-blur-md rounded-2xl p-4 text-center hover:bg-white/20 transition-all duration-300 group cursor-pointer border border-white/10 shadow-lg">
                      <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 640 512" className="w-8 h-8 text-green-300 mx-auto mb-2 group-hover:scale-110 transition-transform" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                        <path d="M208 352c-2.39 0-4.78.35-7.06 1.09C187.98 357.3 174.35 360 160 360c-14.35 0-27.98-2.7-40.95-6.91-2.28-.74-4.66-1.09-7.05-1.09C49.94 352-.33 402.48 0 464.62.14 490.88 21.73 512 48 512h224c26.27 0 47.86-21.12 48-47.38.33-62.14-49.94-112.62-112-112.62zm-48-32c53.02 0 96-42.98 96-96s-42.98-96-96-96-96 42.98-96 96 42.98 96 96 96zM592 0H208c-26.47 0-48 22.25-48 49.59V96c23.42 0 45.1 6.78 64 17.8V64h352v288h-64v-64H384v64h-76.24c19.1 16.69 33.12 38.73 39.69 64H592c26.47 0 48-22.25 48-49.59V49.59C640 22.25 618.47 0 592 0z" />
                      </svg>
                      <p className="text-2xl font-bold text-white">{staffCount}</p>
                      <p className="text-sm text-gray-300">Total Staff</p>
                    </motion.div>
                  </motion.div>

                  {/* Quick Access Modules with Motion */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="w-full max-w-4xl mb-12"
                  >
                    <p className="text-center text-white/70 text-sm mb-3 flex items-center justify-center gap-2">
                      <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" className="w-3 h-3" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                        <path d="M501.1 395.7L384 278.6c-23.1-23.1-57.6-27.6-85.4-13.9L192 158.1V96L64 0 0 64l96 128h62.1l106.6 106.6c-13.6 27.8-9.2 62.3 13.9 85.4l117.1 117.1c14.6 14.6 38.2 14.6 52.7 0l52.7-52.7c14.5-14.6 14.5-38.2 0-52.7zM331.7 225c28.3 0 54.9 11 74.9 31l19.4 19.4c15.8-6.9 30.8-16.5 43.8-29.5 37.1-37.1 49.7-89.3 37.9-136.7-2.2-9-13.5-12.1-20.1-5.5l-74.4 74.4-67.9-11.3L334 98.9l74.4-74.4c6.6-6.6 3.4-17.9-5.7-20.2-47.4-11.7-99.6.9-136.6 37.9-28.5 28.5-41.9 66.1-41.2 103.6l82.1 82.1c8.1-1.9 16.5-2.9 24.7-2.9zm-103.9 82l-56.7-56.7L18.7 402.8c-25 25-25 65.5 0 90.5s65.5 25 90.5 0l123.6-123.6c-7.6-19.9-9.9-41.6-5-62.7zM64 472c-13.2 0-24-10.8-24-24 0-13.3 10.7-24 24-24s24 10.7 24 24c0 13.2-10.7 24-24 24z" />
                      </svg>
                      Quick Access Modules
                    </p>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                      <Link href="/school/ehadir/attendance" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 rounded-xl px-3 py-3 text-white text-xs font-medium flex flex-col items-center justify-center gap-2 shadow-lg transition hover:scale-105">
                        <span className="text-xl">📷</span>
                        <span className="text-xs">E-Hadir Scanner</span>
                      </Link>

                      <Link href="/ehadir" className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:opacity-90 rounded-xl px-3 py-3 text-white text-xs font-medium flex flex-col items-center justify-center gap-2 shadow-lg transition hover:scale-105">
                        <span className="text-xl">🕒</span>
                        <span className="text-xs">Attendance Check</span>
                      </Link>

                      <Link href="/erph" className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-90 rounded-xl px-3 py-3 text-white text-xs font-medium flex flex-col items-center justify-center gap-2 shadow-lg transition hover:scale-105">
                        <span className="text-xl">📖</span>
                        <span className="text-xs">E-RPH</span>
                      </Link>

                      <Link href="/library" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 rounded-xl px-3 py-3 text-white text-xs font-medium flex flex-col items-center justify-center gap-2 shadow-lg transition hover:scale-105">
                        <span className="text-xl">📚</span>
                        <span className="text-xs">Library</span>
                      </Link>

                      <Link href="/prefect" className="bg-gradient-to-r from-amber-600 to-orange-600 hover:opacity-90 rounded-xl px-3 py-3 text-white text-xs font-medium flex flex-col items-center justify-center gap-2 shadow-lg transition hover:scale-105">
                        <span className="text-xl">🛡️</span>
                        <span className="text-xs">Prefects</span>
                      </Link>

                      <Link href="/admin" className="bg-gradient-to-r from-zinc-700 to-gray-800 hover:opacity-90 rounded-xl px-3 py-3 text-white text-xs font-medium flex flex-col items-center justify-center gap-2 shadow-lg transition hover:scale-105">
                        <span className="text-xl">⚙️</span>
                        <span className="text-xs">Admin Panel</span>
                      </Link>

                      <Link href="/tools/aiChat" className="bg-gradient-to-r from-violet-500 to-purple-500 hover:opacity-90 rounded-xl px-3 py-3 text-white text-xs font-medium flex flex-col items-center justify-center gap-2 shadow-lg transition hover:scale-105">
                        <span className="text-xl">🤖</span>
                        <span className="text-xs">AI Assistant</span>
                      </Link>
                    </div>
                  </motion.div>

                  {/* System Status Badges */}
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="text-center">
                    <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-gray-300">
                      <div className="flex items-center gap-1">
                        <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" className="text-green-400 w-3 h-3" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                          <path d="M504 256c0 136.967-111.033 248-248 248S8 392.967 8 256 119.033 8 256 8s248 111.033 248 248zM227.314 387.314l184-184c6.248-6.248 6.248-16.379 0-22.627l-22.627-22.627c-6.248-6.249-16.379-6.249-22.628 0L216 308.118l-70.059-70.059c-6.248-6.248-16.379-6.248-22.628 0l-22.627 22.627c-6.248 6.248-6.248 16.379 0 22.627l104 104c6.249 6.249 16.379 6.249 22.628.001z" />
                        </svg>
                        <span>System Operational</span>
                      </div>
                      <span className="text-gray-500">•</span>
                      <div className="flex items-center gap-1">
                        <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" className="text-blue-400 w-3 h-3" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                          <path d="M480 160H32c-17.673 0-32-14.327-32-32V64c0-17.673 14.327-32 32-32h448c17.673 0 32 14.327 32 32v64c0 17.673-14.327 32-32 32zm-48-88c-13.255 0-24 10.745-24 24s10.745 24 24 24 24-10.745 24-24-10.745-24-24-24zm-64 0c-13.255 0-24 10.745-24 24s10.745 24 24 24 24-10.745 24-24-10.745-24-24-24zm112 248H32c-17.673 0-32-14.327-32-32v-64c0-17.673 14.327-32 32-32h448c17.673 0 32 14.327 32 32v64c0 17.673-14.327 32-32 32zm-48-88c-13.255 0-24 10.745-24 24s10.745 24 24 24 24-10.745 24-24-10.745-24-24-24zm-64 0c-13.255 0-24 10.745-24 24s10.745 24 24 24 24-10.745 24-24-10.745-24-24-24zm112 248H32c-17.673 0-32-14.327-32-32v-64c0-17.673 14.327-32 32-32h448c17.673 0 32 14.327 32 32v64c0 17.673-14.327 32-32 32zm-48-88c-13.255 0-24 10.745-24 24s10.745 24 24 24 24-10.745 24-24-10.745-24-24-24zm-64 0c-13.255 0-24 10.745-24 24s10.745 24 24 24 24-10.745 24-24-10.745-24-24-24z" />
                        </svg>
                        <span>Secure Connection</span>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-gradient-to-r from-zinc-100 to-zinc-50 dark:from-zinc-800 dark:to-zinc-900 text-black dark:text-white shadow-2xl mt-auto">
          <div className="container mx-auto px-4 py-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
              <div className="text-center md:text-left">
                <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-sky-600 to-blue-600 bg-clip-text text-transparent">SEMS</h2>
                <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">Delivering excellence and useful services for school administration.</p>
              </div>

              <div className="text-center md:text-left">
                <h3 className="font-bold text-2xl mb-6 relative inline-block">
                  Contact Us
                  <span className="absolute bottom-0 left-0 w-12 h-1 bg-gradient-to-r from-sky-500 to-blue-500 rounded-full" />
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-center md:justify-start gap-3">
                    <p className="text-gray-700 dark:text-gray-300">Tel: 06-283 1261</p>
                  </div>
                  <div className="flex items-center justify-center md:justify-start gap-3">
                    <p className="text-gray-700 dark:text-gray-300">Email: meb2099@moe.edu.my</p>
                  </div>
                  <div className="flex items-center justify-center md:justify-start gap-3">
                    <p className="text-gray-700 dark:text-gray-300">Address: 251, Jalan Gajah Berang, Kampung Tujuh, 75200 Melaka</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative flex justify-center">
              <div className="bg-gradient-to-r from-sky-100 to-blue-100 dark:from-zinc-800 dark:to-zinc-900 px-6 py-3 rounded-full shadow-md">
                <p className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                  Copyright © 2024 - 2026 School Education Management System. All rights reserved.
                </p>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}