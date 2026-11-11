"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import useSWR, { mutate, preload } from "swr";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiCalendar,
  FiStar,
  FiSearch,
  FiX,
  FiUser,
  FiEdit3,
  FiAlertCircle,
  FiRefreshCw,
  FiLogIn,
  FiLogOut,
  FiInfo,
  FiCloudOff,
  FiCheckCircle,
  FiClock,
} from "react-icons/fi";
import useSettings from "@/hooks/useSettings"; // or wherever your useSettings hook is placed

// Fetcher with status check
const fetcher = async (url) => {
  const res = await fetch(url);
  if (!res.ok) {
    const error = new Error(`Fetch failed: ${res.status}`);
    error.status = res.status;
    throw error;
  }
  return res.json();
};

const swrOptions = {
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
  dedupingInterval: 60000,
  keepPreviousData: true,
};

const ALL_ATTENDANCE_API = "/api/school/edatang/teachers/getAllAttendance";

// Absence Reason presets
const STUDENT_REASONS = [
  { value: "MC", label: "MC", icon: "🤒", color: "red" },
  { value: "Pertandingan", label: "Pertandingan", icon: "🏆", color: "purple" },
  { value: "Urusan Keluarga", label: "Urusan Keluarga", icon: "👨‍👩‍👧‍👦", color: "pink" },
  { value: "Other", label: "Other", icon: "📝", color: "gray" },
];

const STAFF_REASONS = [
  { value: "MC", label: "MC", icon: "🤒", color: "red" },
  { value: "TR", label: "TR", icon: "🚨", color: "orange" },
  { value: "CR", label: "CR", icon: "📚", color: "green" },
  { value: "CRK", label: "CRK", icon: "🏠", color: "teal" },
  { value: "Other", label: "Other", icon: "📝", color: "gray" },
];

// Date helpers
const getWeekdayShort = (dateStr) =>
  new Date(dateStr).toLocaleDateString("en-US", { weekday: "short" });

const getTodayKL = () =>
  new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kuala_Lumpur" });

const formatLongDate = (dateStr) =>
  new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

const INSPIRATIONAL_QUOTES = [
  "Education is the passport to the future, for tomorrow belongs to those who prepare for it today.",
  "The beautiful thing about learning is that no one can take it away from you.",
  "Success is not final, failure is not fatal: it is the courage to continue that counts.",
  "Believe you can and you're halfway there.",
  "Every accomplishment starts with the decision to try.",
  "The future of the world is in my classroom today.",
  "Education is not preparation for life; education is life itself.",
  "The only way to do great work is to love what you do.",
];

export default function EHadirPage() {
  const [mounted, setMounted] = useState(false);
  const [greeting, setGreeting] = useState("");
  const [currentDateFormatted, setCurrentDateFormatted] = useState("");
  const [dailyQuote, setDailyQuote] = useState("");
  const [searchId, setSearchId] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [isEditingId, setIsEditingId] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userRole, setUserRole] = useState(""); // "student" | "staff"
  const [todayRecord, setTodayRecord] = useState(null);
  const [historyRecords, setHistoryRecords] = useState([]);
  const [checkingAttendance, setCheckingAttendance] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadingStaffRecords, setLoadingStaffRecords] = useState(false);
  const [isOffDay, setIsOffDay] = useState(false);
  const [offDayLabel, setOffDayLabel] = useState("");
  const allowedDaysRef = useRef(["Mon", "Tue", "Wed", "Thu", "Fri"]);
  const [staffAllowedDays, setStaffAllowedDays] = useState(null);

  // Student reason modal state
  const [studentReason, setStudentReason] = useState("");
  const [studentCustomReason, setStudentCustomReason] = useState("");
  const [studentModalOpen, setStudentModalOpen] = useState(false);
  const [savingStudentReason, setSavingStudentReason] = useState(false);
  const [studentReasonSaved, setStudentReasonSaved] = useState(false);
  const [studentSavedReasonText, setStudentSavedReasonText] = useState("");
  const [studentModalDate, setStudentModalDate] = useState("");

  // Staff reason modal state
  const [staffReason, setStaffReason] = useState("");
  const [staffCustomReason, setStaffCustomReason] = useState("");
  const [staffModalOpen, setStaffModalOpen] = useState(false);
  const [savingStaffReason, setSavingStaffReason] = useState(false);
  const [staffReasonSaved, setStaffReasonSaved] = useState(false);
  const [staffSavedReasonText, setStaffSavedReasonText] = useState("");
  const [staffModalDate, setStaffModalDate] = useState("");

  const {
    STUDENT_EHADIR_MINIMUM_THRESHOLD = 15,
    STAFF_EHADIR_MINIMUM_THRESHOLD = 15,
  } = useSettings() || {};

  const { data: studentsData } = useSWR("/api/school/getStudents", fetcher, swrOptions);
  const { data: staffData } = useSWR("/api/school/getStaff", fetcher, swrOptions);
  const { data: absenceReasonsData } = useSWR(
    "/api/school/edatang/teachers/getAbsenceReasons",
    fetcher,
    swrOptions
  );

  useEffect(() => {
    setMounted(true);
    const hour = new Date().getHours();
    setGreeting(
      hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening"
    );
    setDailyQuote(
      INSPIRATIONAL_QUOTES[Math.floor(Math.random() * INSPIRATIONAL_QUOTES.length)]
    );
    setCurrentDateFormatted(
      new Date().toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    );
  }, []);

  const getCachedOrFetch = async (url) => {
    try {
      return await mutate(url, fetcher(url), { revalidate: false });
    } catch (e) {
      console.warn(`getCachedOrFetch failed for ${url}:`, e);
      return null;
    }
  };

  const getStaffAttendanceBatch = async () => {
    try {
      const data = await mutate(ALL_ATTENDANCE_API, fetcher(ALL_ATTENDANCE_API), {
        revalidate: false,
      });
      return Array.isArray(data) ? data : [];
    } catch (e) {
      console.warn("Failed to load getAllAttendance batch:", e);
      return [];
    }
  };

  const mapStaffAttendanceByDate = (id, attendanceArray) => {
    const map = new Map();
    if (!Array.isArray(attendanceArray) || attendanceArray.length === 0) return map;
    const strId = String(id);
    for (const record of attendanceArray) {
      if (String(record.id) !== strId) continue;
      const d = (record.date || "").split("T")[0];
      if (d) map.set(d, record);
    }
    return map;
  };

  const mapGlobalStaffHeadcount = (attendanceArray) => {
    const map = new Map();
    if (!Array.isArray(attendanceArray)) return map;
    for (const item of attendanceArray) {
      const d = (item.date || "").split("T")[0];
      if (d) map.set(d, (map.get(d) || 0) + 1);
    }
    return map;
  };

  const cleanAllowedDays = (days) => {
    const allDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const defaultDays = ["Mon", "Tue", "Wed", "Thu", "Fri"];
    try {
      if (!days || (Array.isArray(days) && days.length === 0)) return [...defaultDays];
      let list = days;
      if (typeof days === "string") {
        list = days.replace(/["'\[\]\\]/g, "").trim().split(",").map((d) => d.trim()).filter(Boolean);
      }
      if (!Array.isArray(list)) return [...defaultDays];
      const cleaned = list
        .map((d) => String(d).replace(/["'\\]/g, "").trim())
        .filter((d) => d.length > 0)
        .map((d) => d.charAt(0).toUpperCase() + d.slice(1).toLowerCase())
        .filter((d) => allDays.some((ad) => ad.toLowerCase() === d.toLowerCase()))
        .filter((d, idx, arr) => arr.findIndex((t) => t.toLowerCase() === d.toLowerCase()) === idx)
        .sort((a, b) => allDays.indexOf(a) - allDays.indexOf(b));
      return cleaned.length > 0 ? cleaned : [...defaultDays];
    } catch (e) {
      console.error("Error cleaning allowedDays:", e, days);
      return [...defaultDays];
    }
  };

  const fetchStaffSettings = async (id) => {
    const url = `/api/school/edatang/teachers/getSettings?id=${id}`;
    try {
      const res = await mutate(url, fetcher(url), { revalidate: false });
      if (res && res.allowed_days) {
        return cleanAllowedDays(res.allowed_days);
      }
    } catch (e) {
      console.warn("Failed to fetch staff settings:", e);
    }
    return ["Mon", "Tue", "Wed", "Thu", "Fri"];
  };

  const checkIsOffDay = async (dateStr, id, role, threshold) => {
    const weekday = getWeekdayShort(dateStr);
    const dayOfWeek = new Date(dateStr).getDay();
    const isWorkingDay = (allowedDaysRef.current || ["Mon", "Tue", "Wed", "Thu", "Fri"]).includes(weekday);

    if ((dayOfWeek === 0 || dayOfWeek === 6) && !isWorkingDay) {
      setIsOffDay(true);
      setOffDayLabel(dayOfWeek === 0 ? "Sunday - Weekend" : "Saturday - Weekend");
      return true;
    }

    let isPresent = false;
    if (role === "staff") {
      const batch = await getStaffAttendanceBatch();
      isPresent = mapStaffAttendanceByDate(id, batch).has(dateStr);
    } else {
      try {
        const studentUrl = `/api/school/edatang/getAttendance?date=${dateStr}`;
        const data = await mutate(studentUrl, fetcher(studentUrl), { revalidate: false });
        if (data) isPresent = data.some((s) => String(s.id) === String(id));
      } catch (e) {
        console.warn("Failed to check student attendance record:", e);
      }
    }

    if (isPresent) {
      setIsOffDay(false);
      setOffDayLabel("");
      return false;
    }

    // Check if whole school had holiday based on attendance threshold
    if (role === "staff") {
      try {
        const batch = await getStaffAttendanceBatch();
        if ((mapGlobalStaffHeadcount(batch).get(dateStr) || 0) < threshold) {
          setIsOffDay(true);
          setOffDayLabel("Public Holiday / School Off Day");
          return true;
        }
      } catch (e) {
        console.warn("Failed to check staff batch headcount:", e);
      }
    } else {
      try {
        const studentUrl = `/api/school/edatang/getAttendance?date=${dateStr}`;
        const data = await mutate(studentUrl, fetcher(studentUrl), { revalidate: false });
        if (data && data.length < threshold) {
          setIsOffDay(true);
          setOffDayLabel("Public Holiday / School Off Day");
          return true;
        }
      } catch (e) {
        console.warn("Failed to check global attendance:", e);
      }
    }

    if (role !== "staff" || isWorkingDay) {
      setIsOffDay(false);
      setOffDayLabel("");
      return false;
    }

    setIsOffDay(true);
    setOffDayLabel(`${weekday} - Not a working day (Off Day)`);
    return true;
  };

  const fetchTodayAttendance = async (id, role) => {
    const today = getTodayKL();
    await checkIsOffDay(today, id, role, role === "student" ? STUDENT_EHADIR_MINIMUM_THRESHOLD : STAFF_EHADIR_MINIMUM_THRESHOLD);

    if (role === "student") {
      try {
        const reasons = absenceReasonsData || (await getCachedOrFetch("/api/school/edatang/teachers/getAbsenceReasons"));
        if (reasons) {
          const match = reasons.find((r) => r.id === id && r.date?.split("T")[0] === today);
          if (match) {
            setStudentSavedReasonText(match.reason);
            setStudentReasonSaved(true);
          }
        }
      } catch (e) {
        console.warn("Failed to fetch absence reason:", e);
      }

      try {
        const data = await getCachedOrFetch(`/api/school/edatang/getAttendance?date=${today}`);
        if (data) {
          const record = data.find((item) => item.id === id);
          setTodayRecord(record ? { ...record, isPresent: true, date: today } : { isPresent: false, date: today });
        }
      } catch (e) {
        setTodayRecord({ isPresent: false, date: today });
      }
    }

    if (role === "staff") {
      try {
        const reasons = absenceReasonsData || (await getCachedOrFetch("/api/school/edatang/teachers/getAbsenceReasons"));
        if (reasons) {
          const match = reasons.find((r) => r.id === id && r.date?.split("T")[0] === today);
          if (match) {
            setStaffSavedReasonText(match.reason);
            setStaffReasonSaved(true);
          }
        }
      } catch (e) {
        console.warn("Failed to fetch staff absence reason:", e);
      }

      try {
        const batch = await getStaffAttendanceBatch();
        const record = mapStaffAttendanceByDate(id, batch).get(today) || null;
        setTodayRecord(record ? { ...record, isPresent: true, date: today } : { isPresent: false, date: today });
      } catch (e) {
        setTodayRecord({ isPresent: false, date: today });
      }
    }
  };

  const fetchPreviousStaffRecords = async (id, customDays = null) => {
    try {
      const pastDates = [];
      const now = new Date();
      for (let i = 1; i <= 30; i++) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        pastDates.push(d.toLocaleDateString("en-CA", { timeZone: "Asia/Kuala_Lumpur" }));
      }

      preload("/api/school/edatang/teachers/getAbsenceReasons", fetcher);
      const absenceData =
        (await mutate("/api/school/edatang/teachers/getAbsenceReasons", fetcher("/api/school/edatang/teachers/getAbsenceReasons"), { revalidate: false })) || [];
      const batch = await getStaffAttendanceBatch();
      const attendanceMap = mapStaffAttendanceByDate(id, batch);
      const headcountMap = mapGlobalStaffHeadcount(batch);

      const workingDays = customDays || allowedDaysRef.current || ["Mon", "Tue", "Wed", "Thu", "Fri"];
      const records = [];

      for (const d of pastDates) {
        const dayOfWeek = new Date(d).getDay();
        const weekday = getWeekdayShort(d);
        const isAllowed = workingDays.includes(weekday);
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

        let isOff = false;
        let offReason = "";

        if (isWeekend && !isAllowed) {
          isOff = true;
          offReason = dayOfWeek === 0 ? "Sunday" : "Saturday";
        } else if (!isWeekend && !isAllowed) {
          isOff = true;
          offReason = `${weekday} - Off Day`;
        }

        if (!isOff && (headcountMap.get(d) || 0) < STAFF_EHADIR_MINIMUM_THRESHOLD) {
          isOff = true;
          offReason = "Public Holiday / School Off Day";
        }

        const staffLog = attendanceMap.get(d) || null;
        if (staffLog) {
          records.push({
            date: d,
            isPresent: true,
            checkInTime: staffLog.check_in_time || staffLog.attendance_time || "-",
            checkOutTime: staffLog.check_out_time || staffLog.checkout_time || "-",
            isOffDay: isOff,
            offDayReason: offReason,
            isWeekend,
            isAllowedDay: isAllowed,
          });
        } else {
          const matchedReason = absenceData.find((item) => item.id === id && item.date?.split("T")[0] === d);
          const isAbsent = isAllowed && !isOff;
          records.push({
            date: d,
            isPresent: false,
            checkInTime: "-",
            checkOutTime: "-",
            absenceReason: matchedReason?.reason || null,
            isOffDay: isOff,
            offDayReason: offReason,
            isWeekend,
            isAllowedDay: isAllowed,
            isAbsent,
          });
        }
      }

      const filtered = records.filter(
        (r) => r.isPresent || (r.isAllowedDay && !r.isOffDay) || (r.isOffDay && !r.isWeekend) || !r.isWeekend || r.isAllowedDay
      );
      setHistoryRecords(filtered);
    } catch (e) {
      console.error("Failed to fetch previous attendance:", e);
    }
  };

  const handleSearch = async () => {
    if (!searchId.trim()) {
      setErrorMessage("Please enter a Student/Staff ID");
      return;
    }

    setIsSearching(true);
    setCheckingAttendance(true);
    setErrorMessage("");
    setSelectedUser(null);
    setTodayRecord(null);
    setHistoryRecords([]);
    setStudentSavedReasonText("");
    setStaffSavedReasonText("");
    setStudentReasonSaved(false);
    setStaffReasonSaved(false);
    setIsOffDay(false);
    setOffDayLabel("");
    setHasSearched(false);
    setIsEditingId(false);
    setStaffAllowedDays(null);
    setLoadingStaffRecords(false);
    allowedDaysRef.current = ["Mon", "Tue", "Wed", "Thu", "Fri"];

    try {
      let foundUser = null;
      let detectedRole = "";

      // 1. Try finding in students list
      try {
        const students = studentsData || (await getCachedOrFetch("/api/school/getStudents"));
        if (students) {
          const match = students.find((s) => s.id === searchId.trim());
          if (match) {
            foundUser = match;
            detectedRole = "student";
          }
        }
      } catch (e) {
        console.warn("Failed to fetch students:", e);
      }

      // 2. Try finding in staff list
      if (!foundUser) {
        try {
          const staff = staffData || (await getCachedOrFetch("/api/school/getStaff"));
          if (staff) {
            const match = staff.find((s) => s.id === searchId.trim());
            if (match) {
              foundUser = match;
              detectedRole = "staff";
            }
          }
        } catch (e) {
          console.warn("Failed to fetch teachers:", e);
        }
      }

      if (!foundUser) {
        setErrorMessage(`No user found with ID: ${searchId.trim()}`);
        setIsSearching(false);
        setCheckingAttendance(false);
        setHasSearched(true);
        return;
      }

      setSelectedUser(foundUser);
      setUserRole(detectedRole);
      setHasSearched(true);

      if (detectedRole === "staff") {
        setLoadingStaffRecords(true);
        const days = await fetchStaffSettings(foundUser.id);
        allowedDaysRef.current = days;
        setStaffAllowedDays(days);
        await getStaffAttendanceBatch();
      }

      await fetchTodayAttendance(foundUser.id, detectedRole);

      if (detectedRole === "staff") {
        await fetchPreviousStaffRecords(foundUser.id, allowedDaysRef.current);
        setLoadingStaffRecords(false);
      }
    } catch (e) {
      console.error("Error searching user:", e);
      setErrorMessage("Failed to search for user. Please try again.");
      setHasSearched(true);
    } finally {
      setIsSearching(false);
      setCheckingAttendance(false);
      setLoadingStaffRecords(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setStudentSavedReasonText("");
    setStaffSavedReasonText("");
    setStudentReasonSaved(false);
    setStaffReasonSaved(false);
    setIsOffDay(false);
    setOffDayLabel("");

    if (selectedUser) {
      const today = getTodayKL();
      const urls = [
        "/api/school/edatang/teachers/getAbsenceReasons",
        "/api/school/getStudents",
        "/api/school/getStaff",
      ];

      if (userRole === "staff") {
        urls.push(ALL_ATTENDANCE_API);
        setLoadingStaffRecords(true);
      } else {
        urls.push(`/api/school/edatang/getAttendance?date=${today}`);
        urls.push(`/api/school/edatang/teachers/getAttendance?date=${today}`);
      }

      await Promise.all(urls.map((u) => mutate(u)));

      if (userRole === "staff") {
        const days = await fetchStaffSettings(selectedUser.id);
        allowedDaysRef.current = days;
        setStaffAllowedDays(days);
        await getStaffAttendanceBatch();
      }

      await fetchTodayAttendance(selectedUser.id, userRole);

      if (userRole === "staff") {
        await fetchPreviousStaffRecords(selectedUser.id, allowedDaysRef.current);
        setLoadingStaffRecords(false);
      }
    }
    setIsRefreshing(false);
  };

  const handleSaveStudentReason = async (targetDate) => {
    const finalReason = studentReason === "Other" ? studentCustomReason : studentReason;
    if (!finalReason) return;
    setSavingStudentReason(true);
    try {
      const res = await fetch("/api/school/edatang/teachers/saveAbsenceReason", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedUser.id, date: targetDate, reason: finalReason }),
      });
      if (res.ok) {
        await mutate("/api/school/edatang/teachers/getAbsenceReasons");
        if (targetDate === getTodayKL()) {
          setStudentSavedReasonText(finalReason);
          setStudentReasonSaved(true);
        }
        setStudentModalOpen(false);
        if (userRole === "staff") await fetchPreviousStaffRecords(selectedUser.id);
      }
    } catch (e) {
      console.error("Failed to save reason:", e);
    } finally {
      setSavingStudentReason(false);
    }
  };

  const handleSaveStaffReason = async (targetDate) => {
    const finalReason = staffReason === "Other" ? staffCustomReason : staffReason;
    if (!finalReason) return;
    setSavingStaffReason(true);
    try {
      const res = await fetch("/api/school/edatang/teachers/saveAbsenceReason", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedUser.id, date: targetDate, reason: finalReason }),
      });
      if (res.ok) {
        await mutate("/api/school/edatang/teachers/getAbsenceReasons");
        if (targetDate === getTodayKL()) {
          setStaffSavedReasonText(finalReason);
          setStaffReasonSaved(true);
        }
        setStaffModalOpen(false);
        await fetchPreviousStaffRecords(selectedUser.id);
      }
    } catch (e) {
      console.error("Failed to save staff reason:", e);
    } finally {
      setSavingStaffReason(false);
    }
  };

  // Determine Badge Status
  let statusCard = null;
  if (todayRecord) {
    if (checkingAttendance) {
      statusCard = { emoji: "⏳", text: "Checking...", color: "gray", bgColor: "bg-gray-100 dark:bg-gray-800 border-gray-300" };
    } else if (isOffDay) {
      statusCard = { emoji: "🏖️", text: offDayLabel || "Off Day", color: "blue", bgColor: "bg-blue-50 dark:bg-blue-900/20 border-blue-300" };
    } else if (todayRecord.isPresent && todayRecord.isLate) {
      statusCard = { emoji: "⏰", text: "Present (Late)", color: "orange", bgColor: "bg-orange-50 dark:bg-orange-900/20 border-orange-300" };
    } else if (todayRecord.isPresent) {
      statusCard = { emoji: "✅", text: "Present Today", color: "green", bgColor: "bg-green-50 dark:bg-green-900/20 border-green-300" };
    } else {
      statusCard = { emoji: "❌", text: "Not Present", color: "red", bgColor: "bg-red-50 dark:bg-red-900/20 border-red-300" };
    }
  }

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 dark:from-blue-800 dark:to-indigo-900 text-white shadow-xl">
        <div className="container mx-auto px-4 py-8">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
            <div className="inline-flex items-center justify-center p-3 bg-white/20 rounded-2xl mb-4">
              <FiCalendar className="w-8 h-8" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Attendance Check</h1>
            <p className="text-blue-100">Check attendance status for students and staff</p>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Daily Quote Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-xl p-6 mb-6 text-center"
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            <FiStar className="text-yellow-500" size={18} />
            <p className="text-gray-600 dark:text-gray-400 italic">"{dailyQuote}"</p>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{currentDateFormatted}</p>
        </motion.div>

        {/* Initial Search Box */}
        {!hasSearched && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-md mx-auto">
            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-xl p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg mx-auto mb-4">
                <FiSearch className="text-white" size={28} />
              </div>
              <h3 className="text-xl font-bold mb-2 text-gray-800 dark:text-white">Check Attendance</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm">
                Enter a Student ID or Staff ID to check their attendance status.
              </p>

              <div className="relative mb-4">
                <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchId}
                  onChange={(e) => setSearchId(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                  placeholder="Enter Student/Staff ID..."
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 dark:text-white text-center"
                />
              </div>

              <button
                onClick={handleSearch}
                disabled={isSearching}
                className="w-full py-3 bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white rounded-xl font-semibold shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSearching ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <FiSearch size={18} /> Search
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}

        {/* Top Mini ID Selector when active */}
        {hasSearched && selectedUser && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-md mx-auto mb-6">
            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-xl p-4">
              {isEditingId ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Enter New ID</span>
                    <button
                      onClick={() => setIsEditingId(false)}
                      className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <FiX size={18} className="text-gray-500" />
                    </button>
                  </div>
                  <div className="flex gap-2 items-center">
                    <div className="flex-1 relative">
                      <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                      <input
                        type="text"
                        value={searchId}
                        onChange={(e) => setSearchId(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            handleSearch();
                            setIsEditingId(false);
                          }
                        }}
                        placeholder="Enter Student/Staff ID..."
                        className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 dark:text-white"
                        autoFocus
                      />
                    </div>
                    <button
                      onClick={() => {
                        handleSearch();
                        setIsEditingId(false);
                      }}
                      disabled={isSearching}
                      className="px-4 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2 flex-shrink-0"
                    >
                      {isSearching ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <FiSearch size={16} />
                          <span className="text-sm">Search</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md">
                      <FiUser className="text-white" size={18} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Showing results for</p>
                      <p className="font-mono font-bold text-gray-900 dark:text-white">{selectedUser.id}</p>
                      {userRole === "staff" && staffAllowedDays && (
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          Working days: {staffAllowedDays.join(", ")}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setIsEditingId(true)}
                    className="px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white rounded-xl font-medium shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                  >
                    <FiEdit3 size={16} />
                    <span className="text-sm">Change ID</span>
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Error Notification */}
        <AnimatePresence>
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-md mx-auto mb-6 p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 flex items-center gap-3"
            >
              <FiAlertCircle size={20} />
              <span className="font-medium">{errorMessage}</span>
              <button
                onClick={() => {
                  setErrorMessage("");
                  setHasSearched(false);
                }}
                className="ml-auto"
              >
                <FiX size={20} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results View */}
        <AnimatePresence>
          {selectedUser && hasSearched && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              {/* Profile Card */}
              <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-xl p-6 mb-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                      <FiUser className="text-white" size={28} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        {selectedUser.name || "Unknown"}
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400">
                        <span
                          className={`inline-block px-3 py-0.5 rounded-full text-xs font-semibold ${
                            userRole === "student"
                              ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                              : "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                          }`}
                        >
                          {userRole?.toUpperCase()}
                        </span>
                      </p>
                      {userRole === "staff" && staffAllowedDays && (
                        <p className="text-xs text-gray-400 mt-1">Working Days: {staffAllowedDays.join(", ")}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {selectedUser.class && (
                      <div className="text-center px-4 py-2 bg-gray-50 dark:bg-gray-700 rounded-xl">
                        <p className="text-xs text-gray-500 dark:text-gray-400">Class</p>
                        <p className="font-bold text-gray-900 dark:text-white">{selectedUser.class}</p>
                      </div>
                    )}
                    <div className="text-center px-4 py-2 bg-gray-50 dark:bg-gray-700 rounded-xl">
                      <p className="text-xs text-gray-500 dark:text-gray-400">ID</p>
                      <p className="font-bold text-gray-900 dark:text-white font-mono">{selectedUser.id}</p>
                    </div>
                    <button
                      onClick={handleRefresh}
                      disabled={isRefreshing}
                      className="p-2 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      <FiRefreshCw
                        size={20}
                        className={`text-gray-600 dark:text-gray-400 ${isRefreshing ? "animate-spin" : ""}`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Today's Attendance Card */}
              <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-xl p-8 mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3 mb-6">
                  <FiCalendar className="text-indigo-500" size={24} />
                  Today's Attendance
                </h3>

                {checkingAttendance || (userRole === "staff" && loadingStaffRecords) ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse mb-4" />
                    <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 animate-pulse rounded mb-2" />
                    {userRole === "staff" && loadingStaffRecords && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                        Loading all staff attendance records...
                      </p>
                    )}
                  </div>
                ) : (
                  statusCard && (
                    <div className="text-center">
                      <div
                        className={`w-28 h-28 mx-auto mb-6 rounded-full ${statusCard.bgColor} border-2 flex items-center justify-center`}
                      >
                        <span className="text-5xl">{statusCard.emoji}</span>
                      </div>
                      <h2 className={`text-2xl font-extrabold mb-4 text-${statusCard.color}-600 dark:text-${statusCard.color}-400`}>
                        {statusCard.text}
                      </h2>

                      {todayRecord?.isPresent && (
                        <div className="space-y-3 mt-6">
                          {(todayRecord.attendance_time || todayRecord.check_in_time) && (
                            <div className="flex items-center justify-center gap-3 p-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                              <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                <FiLogIn className="text-green-600" size={20} />
                              </div>
                              <div className="text-left">
                                <p className="text-xs text-green-600 font-medium">CHECK IN TIME</p>
                                <p className="text-lg font-bold text-green-700 dark:text-green-300">
                                  {todayRecord.attendance_time || todayRecord.check_in_time}
                                </p>
                              </div>
                            </div>
                          )}

                          {(todayRecord.checkout_time || todayRecord.check_out_time) && (
                            <div className="flex items-center justify-center gap-3 p-3 rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
                              <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                                <FiLogOut className="text-purple-600" size={20} />
                              </div>
                              <div className="text-left">
                                <p className="text-xs text-purple-600 font-medium">CHECK OUT TIME</p>
                                <p className="text-lg font-bold text-purple-700 dark:text-purple-300">
                                  {todayRecord.checkout_time || todayRecord.check_out_time}
                                </p>
                              </div>
                            </div>
                          )}

                          {todayRecord.isLate && (
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-full border border-orange-200 dark:border-orange-700">
                              <span>⏰</span>
                              <span className="font-semibold">Late Arrival</span>
                            </div>
                          )}
                        </div>
                      )}

                      {isOffDay && !todayRecord?.isPresent && (
                        <div className="flex items-center justify-center gap-3 p-4 rounded-2xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 mt-4">
                          <FiInfo className="text-blue-500" size={24} />
                          <p className="text-blue-700 dark:text-blue-300 font-medium">
                            {offDayLabel} - No school today!
                          </p>
                        </div>
                      )}

                      {!todayRecord?.isPresent && !isOffDay && todayRecord && (
                        <div className="mt-6 space-y-4">
                          <div className="flex items-center justify-center gap-3 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                            <FiCloudOff className="text-red-500" size={24} />
                            <p className="text-red-600 dark:text-red-400 font-medium">Not marked present today.</p>
                          </div>

                          {userRole === "staff" && staffSavedReasonText && (
                            <div className="flex items-center justify-center gap-2 p-3 rounded-xl bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
                              <FiInfo className="text-orange-500" size={16} />
                              <span className="text-orange-700 dark:text-orange-300 text-sm">
                                Absence Reason: <span className="font-semibold">{staffSavedReasonText}</span>
                              </span>
                            </div>
                          )}

                          {userRole === "student" && studentSavedReasonText && (
                            <div className="flex items-center justify-center gap-2 p-3 rounded-xl bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
                              <FiInfo className="text-orange-500" size={16} />
                              <span className="text-orange-700 dark:text-orange-300 text-sm">
                                Absence Reason: <span className="font-semibold">{studentSavedReasonText}</span>
                              </span>
                            </div>
                          )}

                          {userRole === "staff" && (
                            <div>
                              {staffReasonSaved ? (
                                <div className="flex items-center justify-center gap-2 p-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                                  <FiCheckCircle className="text-green-500" size={20} />
                                  <span className="text-green-700 dark:text-green-300">
                                    Reason saved: {staffSavedReasonText}
                                  </span>
                                  <button
                                    onClick={() => {
                                      setStaffReason(staffSavedReasonText || "");
                                      setStaffCustomReason("");
                                      setStaffModalDate(getTodayKL());
                                      setStaffModalOpen(true);
                                    }}
                                    className="text-xs text-blue-500 hover:text-blue-700 ml-2 underline"
                                  >
                                    Change
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => {
                                    setStaffModalDate(getTodayKL());
                                    setStaffReason("");
                                    setStaffCustomReason("");
                                    setStaffModalOpen(true);
                                  }}
                                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-all shadow-md hover:shadow-lg flex items-center gap-2 mx-auto"
                                >
                                  <FiCalendar size={18} />
                                  Set Absence Reason
                                </button>
                              )}
                            </div>
                          )}

                          {userRole === "student" && (
                            <div>
                              {studentReasonSaved ? (
                                <div className="flex items-center justify-center gap-2 p-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                                  <FiCheckCircle className="text-green-500" size={20} />
                                  <span className="text-green-700 dark:text-green-300">
                                    Reason saved: {studentSavedReasonText}
                                  </span>
                                  <button
                                    onClick={() => {
                                      setStudentReason(studentSavedReasonText || "");
                                      setStudentCustomReason("");
                                      setStudentModalDate(getTodayKL());
                                      setStudentModalOpen(true);
                                    }}
                                    className="text-xs text-blue-500 hover:text-blue-700 ml-2 underline"
                                  >
                                    Change
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => {
                                    setStudentModalDate(getTodayKL());
                                    setStudentReason("");
                                    setStudentCustomReason("");
                                    setStudentModalOpen(true);
                                  }}
                                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-all shadow-md hover:shadow-lg"
                                >
                                  Set Absence Reason
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                )}
              </div>

              {/* 30-Day Staff History Table */}
              {userRole === "staff" && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-xl p-6"
                >
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3 mb-4">
                    <FiClock className="text-indigo-500" size={24} />
                    Previous Attendance Records
                  </h3>

                  {loadingStaffRecords ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <div className="w-16 h-16 rounded-full border-4 border-indigo-200 dark:border-indigo-800 border-t-indigo-500 animate-spin mb-4" />
                      <p className="text-sm text-gray-500 dark:text-gray-400">Loading 30-day attendance history...</p>
                    </div>
                  ) : historyRecords.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">No previous records found.</div>
                  ) : (
                    <>
                      {/* Desktop Table View */}
                      <div className="hidden md:block overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-lg">
                            <tr>
                              <th className="p-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Date</th>
                              <th className="p-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Day</th>
                              <th className="p-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Status</th>
                              <th className="p-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Check In</th>
                              <th className="p-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Check Out</th>
                              <th className="p-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Reason</th>
                              <th className="p-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {historyRecords.map((rec, i) => (
                              <tr
                                key={i}
                                className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition"
                              >
                                <td className="p-3 font-medium text-gray-900 dark:text-white">
                                  {formatLongDate(rec.date)}
                                </td>
                                <td className="p-3 text-gray-600 dark:text-gray-400">
                                  {getWeekdayShort(rec.date)}
                                  {rec.isOffDay && !rec.isAllowedDay && (
                                    <span className="text-xs text-blue-500 ml-1">(Off)</span>
                                  )}
                                </td>
                                <td className="p-3">
                                  {rec.isPresent ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                                      ✅ Present
                                      {!rec.isAllowedDay && <span className="text-xs ml-1">(Extra)</span>}
                                    </span>
                                  ) : rec.isOffDay ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                                      🏖️ {rec.offDayReason || "Off Day"}
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
                                      ❌ Absent
                                    </span>
                                  )}
                                </td>
                                <td className="p-3 text-gray-700 dark:text-gray-300 font-mono text-sm">{rec.checkInTime}</td>
                                <td className="p-3 text-gray-700 dark:text-gray-300 font-mono text-sm">{rec.checkOutTime}</td>
                                <td className="p-3 text-gray-600 dark:text-gray-400 text-sm">
                                  {rec.isOffDay ? (
                                    <span className="text-blue-500">Off Day</span>
                                  ) : rec.absenceReason ? (
                                    <span className="text-orange-600 dark:text-orange-400 font-medium">
                                      {rec.absenceReason}
                                    </span>
                                  ) : rec.isPresent ? (
                                    <span className="text-gray-400">-</span>
                                  ) : rec.isAbsent ? (
                                    <span className="text-gray-400 italic">No reason given</span>
                                  ) : (
                                    <span className="text-gray-400">-</span>
                                  )}
                                </td>
                                <td className="p-3">
                                  {rec.isAbsent && (
                                    <button
                                      onClick={() => {
                                        setStaffModalDate(rec.date);
                                        setStaffReason(rec.absenceReason || "");
                                        setStaffCustomReason("");
                                        setStaffModalOpen(true);
                                      }}
                                      className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-900/50 rounded-lg text-xs font-medium transition-colors flex items-center gap-1"
                                    >
                                      <FiEdit3 size={12} />
                                      {rec.absenceReason ? "Edit" : "Add Reason"}
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Mobile Card View */}
                      <div className="md:hidden space-y-3">
                        {historyRecords.map((rec, i) => (
                          <div
                            key={i}
                            className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 border border-gray-200 dark:border-gray-600"
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <p className="font-semibold text-gray-900 dark:text-white">{formatLongDate(rec.date)}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {getWeekdayShort(rec.date)}
                                  {rec.isOffDay && !rec.isAllowedDay && (
                                    <span className="text-blue-500 ml-1">(Off Day)</span>
                                  )}
                                </p>
                              </div>
                              {rec.isPresent ? (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                                  ✅ Present
                                  {!rec.isAllowedDay && <span className="text-xs ml-1">(Extra)</span>}
                                </span>
                              ) : rec.isOffDay ? (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                                  🏖️ Off Day
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
                                  ❌ Absent
                                </span>
                              )}
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-sm mt-3">
                              <div>
                                <p className="text-xs text-gray-500">Check In</p>
                                <p className="font-mono text-gray-700 dark:text-gray-300">{rec.checkInTime}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Check Out</p>
                                <p className="font-mono text-gray-700 dark:text-gray-300">{rec.checkOutTime}</p>
                              </div>
                            </div>

                            <div className="mt-2">
                              <p className="text-xs text-gray-500">Reason</p>
                              <p className="text-sm text-gray-700 dark:text-gray-300">
                                {rec.isOffDay ? (
                                  <span className="text-blue-500">Off Day</span>
                                ) : rec.absenceReason ? (
                                  <span className="text-orange-600 dark:text-orange-400 font-medium">
                                    {rec.absenceReason}
                                  </span>
                                ) : rec.isPresent ? (
                                  "-"
                                ) : rec.isAbsent ? (
                                  <span className="text-gray-400 italic">No reason given</span>
                                ) : (
                                  "-"
                                )}
                              </p>
                            </div>

                            {rec.isAbsent && (
                              <button
                                onClick={() => {
                                  setStaffModalDate(rec.date);
                                  setStaffReason(rec.absenceReason || "");
                                  setStaffCustomReason("");
                                  setStaffModalOpen(true);
                                }}
                                className="mt-3 w-full px-3 py-1.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-900/50 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1"
                              >
                                <FiEdit3 size={12} />
                                {rec.absenceReason ? "Edit Reason" : "Add Reason"}
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty State When User Not Found */}
        {!selectedUser && !checkingAttendance && hasSearched && !errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md mx-auto bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-xl p-12 text-center"
          >
            <FiUser className="w-20 h-20 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">No User Found</h3>
            <p className="text-gray-500 dark:text-gray-400">Try searching with a different ID.</p>
          </motion.div>
        )}
      </div>

      {/* Student Reason Modal */}
      <AnimatePresence>
        {studentModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center bg-black/70 z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6"
            >
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Set Absence Reason</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Select a reason for <span className="font-semibold">{selectedUser?.name}</span>'s absence on{" "}
                <span className="font-semibold">{formatLongDate(studentModalDate)}</span>.
              </p>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {STUDENT_REASONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setStudentReason(opt.value)}
                    className={`w-full p-3 rounded-xl text-left transition-all flex items-center gap-3 ${
                      studentReason === opt.value
                        ? "bg-indigo-100 dark:bg-indigo-900/30 border-2 border-indigo-500 text-indigo-700 dark:text-indigo-300"
                        : "bg-gray-50 dark:bg-gray-700 border-2 border-transparent hover:border-gray-300 text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    <span className="text-xl">{opt.icon}</span>
                    <span className="font-medium">{opt.label}</span>
                  </button>
                ))}
              </div>

              {studentReason === "Other" && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-3">
                  <input
                    type="text"
                    value={studentCustomReason}
                    onChange={(e) => setStudentCustomReason(e.target.value)}
                    placeholder="Please specify the reason..."
                    className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </motion.div>
              )}

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setStudentModalOpen(false)}
                  className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSaveStudentReason(studentModalDate)}
                  disabled={!studentReason || (studentReason === "Other" && !studentCustomReason) || savingStudentReason}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-blue-600 text-white hover:from-indigo-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
                >
                  {savingStudentReason ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <FiCheckCircle size={18} /> Save Reason
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Staff Reason Modal */}
      <AnimatePresence>
        {staffModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center bg-black/70 z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6"
            >
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Set Absence Reason</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Select a reason for <span className="font-semibold">{selectedUser?.name}</span>'s absence on{" "}
                <span className="font-semibold">{formatLongDate(staffModalDate)}</span>.
              </p>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {STAFF_REASONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setStaffReason(opt.value)}
                    className={`w-full p-3 rounded-xl text-left transition-all flex items-center gap-3 ${
                      staffReason === opt.value
                        ? "bg-indigo-100 dark:bg-indigo-900/30 border-2 border-indigo-500 text-indigo-700 dark:text-indigo-300"
                        : "bg-gray-50 dark:bg-gray-700 border-2 border-transparent hover:border-gray-300 text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    <span className="text-xl">{opt.icon}</span>
                    <span className="font-medium">{opt.label}</span>
                  </button>
                ))}
              </div>

              {staffReason === "Other" && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-3">
                  <input
                    type="text"
                    value={staffCustomReason}
                    onChange={(e) => setStaffCustomReason(e.target.value)}
                    placeholder="Please specify the reason..."
                    className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </motion.div>
              )}

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setStaffModalOpen(false)}
                  className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSaveStaffReason(staffModalDate)}
                  disabled={!staffReason || (staffReason === "Other" && !staffCustomReason) || savingStaffReason}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-blue-600 text-white hover:from-indigo-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
                >
                  {savingStaffReason ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <FiCheckCircle size={18} /> Save Reason
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}