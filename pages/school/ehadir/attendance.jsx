"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaSync,
  FaCloudUploadAlt,
  FaCloud,
  FaWifi,
  FaClock,
  FaExclamationTriangle,
  FaUserGraduate,
  FaUserTie,
  FaCheck,
  FaTimes,
  FaKeyboard,
  FaCamera,
  FaSearch,
  FaIdCard,
  FaSpinner,
  FaCheckCircle,
  FaQrcode,
  FaSignInAlt,
  FaSignOutAlt,
  FaCalendarAlt,
  FaQuoteRight,
  FaUserCircle,
} from "react-icons/fa";
import { MdDashboard, MdClose, MdFlipCameraIos } from "react-icons/md";
import useAuth from "@/hooks/useAuth";
import useDataHelper from "@/hooks/useDataHelper";
import useSettings from "@/hooks/useSettings";

const TIMEOUT_MS = 1500;

// Fetch with timeout
const fetchWithTimeout = async (url, options = {}, timeout = TIMEOUT_MS) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timer);
    return res;
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
};

// Offline Storage Queue
const offlineStorage = {
  get(key) {
    try {
      const data = localStorage.getItem(`unified_attendance_cache_${key}`);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },
  set(key, val) {
    try {
      localStorage.setItem(`unified_attendance_cache_${key}`, JSON.stringify({ data: val, timestamp: Date.now() }));
    } catch (e) {
      console.warn("Failed to save to cache:", e);
    }
  },
  getPendingSubmissions() {
    try {
      const data = localStorage.getItem("unified_attendance_pending_submissions");
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },
  addPendingSubmission(sub) {
    try {
      const list = this.getPendingSubmissions();
      const item = { ...sub, cachedAt: Date.now(), queueId: `${sub.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` };
      list.push(item);
      localStorage.setItem("unified_attendance_pending_submissions", JSON.stringify(list));
      return list;
    } catch (e) {
      return this.getPendingSubmissions();
    }
  },
  clearPendingSubmissions() {
    try {
      localStorage.removeItem("unified_attendance_pending_submissions");
    } catch {}
  },
  getAttendanceData(date, type = "student") {
    return this.get(`${type}_attendance_${date}`);
  },
  setAttendanceData(date, data, type = "student") {
    this.set(`${type}_attendance_${date}`, data);
  },
};

// 20-Second Anti-Duplicate Cooldown Manager
const cooldownMap = new Map();
const cooldownManager = {
  isOnCooldown(id) {
    const entry = cooldownMap.get(id);
    if (!entry) return false;
    if (Date.now() - entry >= 20000) {
      cooldownMap.delete(id);
      return false;
    }
    return true;
  },
  getRemainingCooldown(id) {
    const entry = cooldownMap.get(id);
    if (!entry) return 0;
    const remaining = 20000 - (Date.now() - entry);
    return remaining > 0 ? Math.ceil(remaining / 1000) : 0;
  },
  setCooldown(id) {
    cooldownMap.set(id, Date.now());
    setTimeout(() => cooldownMap.delete(id), 21000);
  },
};

const INSPIRATIONAL_QUOTES = [
  "Education is the passport to the future, for tomorrow belongs to those who prepare for it today.",
  "The beautiful thing about learning is that no one can take it away from you.",
  "Success is not final, failure is not fatal: it is the courage to continue that counts.",
  "The only way to do great work is to love what you do.",
  "Your attitude determines your direction.",
  "Every accomplishment starts with the decision to try.",
  "Don't watch the clock; do what it does. Keep going.",
  "The future depends on what you do today.",
  "Believe you can and you're halfway there.",
  "Small steps every day lead to big results.",
  "Excellence is not a skill, it's an attitude.",
  "Today a reader, tomorrow a leader.",
  "The expert in anything was once a beginner.",
  "Your potential is endless. Go do what you were created to do.",
  "Strive for progress, not perfection.",
  "Be so good they can't ignore you.",
  "The harder you work, the luckier you get.",
  "Dream big. Work hard. Stay focused.",
  "Leadership is not about being in charge. It's about taking care of those in your charge.",
  "Great teachers inspire greatness in others.",
];

export default function UnifiedAttendancePage() {
  const router = useRouter();
  const scannerRef = useRef(null);
  const inputRef = useRef(null);

  const [activeTab, setActiveTab] = useState("Record");
  const [errorMessage, setErrorMessage] = useState("");
  const [successToast, setSuccessToast] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [typedId, setTypedId] = useState("");
  const [studentRecords, setStudentRecords] = useState([]);
  const [staffRecords, setStaffRecords] = useState([]);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [keepScannerOpen, setKeepScannerOpen] = useState(false);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [showCameraError, setShowCameraError] = useState(false);

  // Scanned Card Popup State
  const [showPopup, setShowPopup] = useState(false);
  const [popupData, setPopupData] = useState({
    type: "student",
    name: "",
    id: "",
    class: "",
    action: "",
    time: "",
    isLate: false,
    greeting: "",
  });
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [loadingAvatar, setLoadingAvatar] = useState(false);
  const popupTimerRef = useRef(null);

  // Settings & Auth Hooks
  const { SCHOOL_CODE = "meb2099", CLASS = [], STUDENT_EHADIR_LATE_HOUR = 7, STUDENT_EHADIR_LATE_MINUTE = 20, STUDENT_CHECKOUT_ENABLED = false } = useSettings() || {};
  const { mounted: authMounted } = useAuth(["EHadir_User", "EDatang_User"]);
  const { studentsData = [], getStudentClass, staffsData = [], getStaffGroup } = useDataHelper();

  // Search & Filtering States
  const [searchFilterOpen, setSearchFilterOpen] = useState(false);
  const [studentSearchTerm, setStudentSearchTerm] = useState("");
  const [staffSearchTerm, setStaffSearchTerm] = useState("");
  const [selectedClass, setSelectedClass] = useState("All");
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [studentActionType, setStudentActionType] = useState("checkin");
  const [isProcessingStudents, setIsProcessingStudents] = useState(false);
  const [processedStudentCount, setProcessedStudentCount] = useState(0);

  const [selectedStaffIds, setSelectedStaffIds] = useState([]);
  const [staffActionType, setStaffActionType] = useState("checkin");
  const [isProcessingStaff, setIsProcessingStaff] = useState(false);
  const [processedStaffCount, setProcessedStaffCount] = useState(0);

  // Camera settings
  const [availableCameras, setAvailableCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [scanMode, setScanMode] = useState("both"); // "both" | "barcode" | "qrcode"
  const [torchOn, setTorchOn] = useState(false);
  const [lastScannedCode, setLastScannedCode] = useState("");
  const [lastScanTime, setLastScanTime] = useState(0);
  const isScanningBusy = useRef(false);

  // Today Date String (YYYY-MM-DD in Malaysia Time)
  const [currentDateString, setCurrentDateString] = useState(() => {
    return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kuala_Lumpur" });
  });

  // Offline status
  const [isOnline, setIsOnline] = useState(true);
  const [pendingQueue, setPendingQueue] = useState([]);

  // Auto-focus input for USB Barcode Scanners
  useEffect(() => {
    const focusTimer = setInterval(() => {
      if (!isScannerOpen && activeTab === "Record" && inputRef.current) {
        inputRef.current.focus();
      }
    }, 2000);
    return () => clearInterval(focusTimer);
  }, [isScannerOpen, activeTab]);

  // Fetch today's records
  const fetchStudentAttendance = useCallback(async () => {
    try {
      const res = await fetchWithTimeout(`/api/school/edatang/getAttendance?date=${currentDateString}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        const mapped = data.map((item) => {
          const t = item.attendance_time || "";
          let isLate = false;
          if (t) {
            const [timePart, modifier] = t.split(" ");
            let [h, m] = timePart.split(":").map(Number);
            if (modifier === "PM" && h !== 12) h += 12;
            if (modifier === "AM" && h === 12) h = 0;
            isLate = h > STUDENT_EHADIR_LATE_HOUR || (h === STUDENT_EHADIR_LATE_HOUR && m > STUDENT_EHADIR_LATE_MINUTE);
          }
          return {
            ...item,
            checkInTime: item.attendance_time,
            checkOutTime: item.checkout_time,
            isLate,
            hasCheckin: !!item.attendance_time,
            hasCheckout: !!item.checkout_time,
          };
        });
        mapped.sort((a, b) => (b.checkInTime || "").localeCompare(a.checkInTime || ""));
        setStudentRecords(mapped);
        offlineStorage.setAttendanceData(currentDateString, mapped, "student");
      }
    } catch {
      const cached = offlineStorage.getAttendanceData(currentDateString, "student");
      if (cached) setStudentRecords(cached);
    }
  }, [currentDateString, STUDENT_EHADIR_LATE_HOUR, STUDENT_EHADIR_LATE_MINUTE]);

  const fetchStaffAttendance = useCallback(async () => {
    try {
      const res = await fetchWithTimeout(`/api/school/edatang/teachers/getAttendance?date=${currentDateString}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setStaffRecords(data);
        offlineStorage.setAttendanceData(currentDateString, data, "staff");
      }
    } catch {
      const cached = offlineStorage.getAttendanceData(currentDateString, "staff");
      if (cached) setStaffRecords(cached);
    }
  }, [currentDateString]);

  useEffect(() => {
    fetchStudentAttendance();
    fetchStaffAttendance();
  }, [fetchStudentAttendance, fetchStaffAttendance]);

  // Load Student Avatar
  const loadAvatar = useCallback(async (id, type = "student") => {
    if (!id) return;
    setLoadingAvatar(true);
    setAvatarUrl(null);
    try {
      const code = (SCHOOL_CODE || "meb2099").toLowerCase();
      const cleanId = id.replace("/", "_");
      const url = `https://cdn.owonico.link/files/sems/${code}/${type === "staff" ? "staff" : "student"}/${cleanId}.jpg`;
      const img = new Image();
      img.src = `${url}?t=${Date.now()}`;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        setTimeout(() => reject(new Error("Timeout")), 4000);
      });
      setAvatarUrl(url);
    } catch {
      setAvatarUrl(null);
    } finally {
      setLoadingAvatar(false);
    }
  }, [SCHOOL_CODE]);

  // Trigger Popup Card on Successful Scan
  const triggerPopup = (record) => {
    if (popupTimerRef.current) clearTimeout(popupTimerRef.current);
    setPopupData(record);
    setShowPopup(true);
    popupTimerRef.current = setTimeout(() => {
      setShowPopup(false);
      setAvatarUrl(null);
    }, 5000);
  };

  // Main Scan Processing Function
  const handleProcessId = async (inputCode) => {
    const rawId = (inputCode || typedId).trim();
    if (!rawId) {
      setErrorMessage("Please enter an ID.");
      return;
    }

    if (cooldownManager.isOnCooldown(rawId)) {
      const sec = cooldownManager.getRemainingCooldown(rawId);
      setErrorMessage(`Please wait ${sec}s before scanning this ID again.`);
      setTypedId("");
      return;
    }

    setErrorMessage("");

    // 1. Look up student first
    const student = studentsData.find((s) => s.id === rawId);
    if (student) {
      await processStudentScan(rawId, student);
      setTypedId("");
      return;
    }

    // 2. Look up staff member
    const staff = staffsData.find((t) => t.id === rawId);
    if (staff) {
      await processStaffScan(rawId, staff);
      setTypedId("");
      return;
    }

    setErrorMessage("Invalid ID. No student or staff found.");
    setTypedId("");
  };

  const processStudentScan = async (id, student) => {
    loadAvatar(id, "student");
    const now = new Date();
    const h = now.getHours();
    const m = String(now.getMinutes()).padStart(2, "0");
    const s = String(now.getSeconds()).padStart(2, "0");
    const timeFormatted = `${h % 12 || 12}:${m}:${s} ${h >= 12 ? "PM" : "AM"}`;

    const existing = studentRecords.find((r) => r.id === id);
    let isLate = h > STUDENT_EHADIR_LATE_HOUR || (h === STUDENT_EHADIR_LATE_HOUR && Number(m) > STUDENT_EHADIR_LATE_MINUTE);

    const payload = {
      id,
      name: student.name,
      kelas: getStudentClass(id),
      attendanceTime: timeFormatted,
      date: currentDateString,
    };

    cooldownManager.setCooldown(id);

    try {
      const res = await fetchWithTimeout("/api/school/edatang/saveAttendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        triggerPopup({
          type: "student",
          name: student.name,
          id: student.id,
          class: getStudentClass(id),
          action: "Check In",
          time: timeFormatted,
          isLate,
          greeting: isLate ? "Anda Telah Lewat" : "Kehadiran Direkodkan!",
        });
        fetchStudentAttendance();
      }
    } catch {
      triggerPopup({
        type: "student",
        name: student.name,
        id: student.id,
        class: getStudentClass(id),
        action: "Check In",
        time: timeFormatted,
        isLate,
        greeting: "Saved (Offline)",
      });
    }
  };

  const processStaffScan = async (id, staff) => {
    loadAvatar(id, "staff");
    const now = new Date();
    const h = now.getHours();
    const m = String(now.getMinutes()).padStart(2, "0");
    const s = String(now.getSeconds()).padStart(2, "0");
    const timeFormatted = `${h % 12 || 12}:${m}:${s} ${h >= 12 ? "PM" : "AM"}`;

    const existing = staffRecords.find((r) => r.id === id);
    const action = existing && !existing.check_out_time ? "Check Out" : "Check In";

    const payload = {
      id,
      name: staff.name,
      checkInTime: action === "Check Out" ? existing.check_in_time : timeFormatted,
      checkOutTime: action === "Check Out" ? timeFormatted : "",
      action,
      date: currentDateString,
    };

    cooldownManager.setCooldown(id);

    try {
      const res = await fetchWithTimeout("/api/school/edatang/teachers/saveAttendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        triggerPopup({
          type: "staff",
          name: staff.name,
          id: staff.id,
          class: "",
          action,
          time: timeFormatted,
          isLate: false,
          greeting: `Selamat ${h < 12 ? "Pagi" : "Petang"}, ${staff.name}`,
        });
        fetchStaffAttendance();
      }
    } catch {
      triggerPopup({
        type: "staff",
        name: staff.name,
        id: staff.id,
        class: "",
        action,
        time: timeFormatted,
        isLate: false,
        greeting: "Saved (Offline)",
      });
    }
  };

  // Launch Camera with html5-qrcode
  const startCameraScanner = async () => {
    setIsScannerOpen(true);
    setCameraActive(false);

    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const cameras = await Html5Qrcode.getCameras();
      if (cameras && cameras.length > 0) {
        setAvailableCameras(cameras);
        const backCam = cameras.find((c) => c.label.toLowerCase().includes("back") || c.label.toLowerCase().includes("environment"));
        const cameraId = backCam ? backCam.id : cameras[0].id;
        setSelectedCameraId(cameraId);

        const html5QrCode = new Html5Qrcode("reader");
        scannerRef.current = html5QrCode;

        await html5QrCode.start(
          cameraId,
          { fps: 15, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            if (isScanningBusy.current) return;
            const now = Date.now();
            if (decodedText !== lastScannedCode || now - lastScanTime > 2000) {
              isScanningBusy.current = true;
              setLastScannedCode(decodedText);
              setLastScanTime(now);
              if (navigator.vibrate) navigator.vibrate(100);

              handleProcessId(decodedText).finally(() => {
                isScanningBusy.current = false;
                if (!keepScannerOpen) stopCameraScanner();
              });
            }
          },
          () => {}
        );
        setCameraActive(true);
      } else {
        setCameraError("No cameras detected.");
        setShowCameraError(true);
      }
    } catch (err) {
      setCameraError(err.message || "Failed to start camera.");
      setShowCameraError(true);
      stopCameraScanner();
    }
  };

  const stopCameraScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch {}
      scannerRef.current = null;
    }
    setIsScannerOpen(false);
    setCameraActive(false);
  };

  const studentPresentCount = studentRecords.filter((s) => s.hasCheckin).length;
  const studentAbsentCount = Math.max(0, studentsData.length - studentPresentCount);
  const staffPresentCount = staffRecords.filter((s) => s.check_in_time).length;
  const staffAbsentCount = Math.max(0, staffsData.length - staffPresentCount);

  if (!authMounted) return null;

  return (
    <>
      <Head>
        <title>E-Hadir Kiosk - Unified Attendance Scanner</title>
      </Head>

      <div className="relative min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 text-gray-800 dark:text-gray-100 font-sans pb-16 lg:pb-0 lg:ml-[80px]">
        <div className="container mx-auto px-4 py-6 max-w-7xl">
          {/* Top Title Banner */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg shadow-blue-500/25 text-white">
                <MdDashboard size={28} />
              </div>
              <div>
                <h1 className="text-3xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Unified Attendance
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">SMJK Katholik Melaka • Kiosk Scanner</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 rounded-full text-xs font-semibold flex items-center gap-1.5 border border-emerald-300/30">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Live Station
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Metrics & Actions */}
            <div className="lg:col-span-1 space-y-4">
              {/* Live Status Counters */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-lg border border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-2 mb-1 text-blue-600">
                    <FaUserGraduate size={16} />
                    <span className="text-xs font-medium text-gray-500">Students</span>
                  </div>
                  <p className="text-2xl font-bold">{studentsData.length}</p>
                  <p className="text-[11px] text-emerald-500 font-medium">{studentPresentCount} Present</p>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-lg border border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-2 mb-1 text-purple-600">
                    <FaUserTie size={16} />
                    <span className="text-xs font-medium text-gray-500">Staff</span>
                  </div>
                  <p className="text-2xl font-bold">{staffsData.length}</p>
                  <p className="text-[11px] text-emerald-500 font-medium">{staffPresentCount} Present</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-lg border border-gray-100 dark:border-gray-700">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Quick Scanner Options</h3>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      setActiveTab("Record");
                      setTimeout(() => inputRef.current?.focus(), 100);
                    }}
                    className="p-3.5 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white font-semibold flex flex-col items-center justify-center gap-2 shadow-lg shadow-teal-500/20 hover:scale-[1.02] transition"
                  >
                    <FaKeyboard size={20} />
                    <span className="text-xs">Barcode / Key In</span>
                  </button>

                  <button
                    onClick={startCameraScanner}
                    className="p-3.5 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-semibold flex flex-col items-center justify-center gap-2 shadow-lg shadow-blue-500/20 hover:scale-[1.02] transition"
                  >
                    <FaCamera size={20} />
                    <span className="text-xs">Camera Scan</span>
                  </button>
                </div>
              </div>

              {/* Manual Barcode Input Card */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-lg border border-gray-100 dark:border-gray-700">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Scan Barcode / IC</h3>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleProcessId();
                  }}
                  className="space-y-3"
                >
                  <div className="relative">
                    <input
                      ref={inputRef}
                      type="text"
                      value={typedId}
                      onChange={(e) => setTypedId(e.target.value)}
                      placeholder="Scan or enter ID (e.g. 130815040173)"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 font-mono text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <FaIdCard className="absolute left-3.5 top-3.5 text-gray-400" size={18} />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-md transition"
                  >
                    Submit ID
                  </button>
                </form>

                {errorMessage && (
                  <p className="mt-3 p-2.5 bg-red-50 dark:bg-red-950/40 border border-red-300 text-red-600 text-xs rounded-xl flex items-center gap-2">
                    <FaExclamationTriangle /> {errorMessage}
                  </p>
                )}
              </div>
            </div>

            {/* Right Column: Live Attendance Feeds */}
            <div className="lg:col-span-2 space-y-4">
              {/* Student Log Table */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <FaUserGraduate className="text-blue-500" />
                    <h3 className="font-bold text-sm">Students Today ({studentRecords.length})</h3>
                  </div>
                  <span className="text-xs text-gray-400 font-mono">Cut-off: 07:20 AM</span>
                </div>

                <div className="overflow-y-auto max-h-[300px]">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                      <tr>
                        <th className="p-3">Name</th>
                        <th className="p-3">Class</th>
                        <th className="p-3">Check In</th>
                        <th className="p-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                      {studentRecords.length === 0 ? (
                        <tr>
                          <td colSpan="4" className="text-center p-6 text-gray-400">
                            No student check-ins recorded yet.
                          </td>
                        </tr>
                      ) : (
                        studentRecords.map((item, idx) => (
                          <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                            <td className="p-3 font-semibold truncate max-w-[150px]">{item.name}</td>
                            <td className="p-3 font-mono">{item.class || item.kelas}</td>
                            <td className="p-3 font-mono">{item.checkInTime || "-"}</td>
                            <td className="p-3">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  item.isLate
                                    ? "bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-300"
                                    : "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300"
                                }`}
                              >
                                {item.isLate ? "LEWAT" : "HADIR"}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Staff Log Table */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <FaUserTie className="text-purple-500" />
                    <h3 className="font-bold text-sm">Staff Today ({staffRecords.length})</h3>
                  </div>
                </div>

                <div className="overflow-y-auto max-h-[220px]">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                      <tr>
                        <th className="p-3">Name</th>
                        <th className="p-3">Check In</th>
                        <th className="p-3">Check Out</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                      {staffRecords.length === 0 ? (
                        <tr>
                          <td colSpan="3" className="text-center p-6 text-gray-400">
                            No staff clock-ins yet.
                          </td>
                        </tr>
                      ) : (
                        staffRecords.map((item, idx) => (
                          <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                            <td className="p-3 font-semibold truncate max-w-[150px]">{item.name}</td>
                            <td className="p-3 font-mono">{item.check_in_time || "-"}</td>
                            <td className="p-3 font-mono">{item.check_out_time || "-"}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 5-Second Student Scan Popup Card */}
        <AnimatePresence>
          {showPopup && popupData.name && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4"
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-white/20"
              >
                {/* Header Banner */}
                <div
                  className={`p-6 text-center text-white relative ${
                    popupData.isLate
                      ? "bg-gradient-to-r from-red-600 via-orange-500 to-yellow-600"
                      : "bg-gradient-to-r from-green-500 via-emerald-600 to-teal-600"
                  }`}
                >
                  <div className="w-14 h-14 mx-auto rounded-full bg-white/20 flex items-center justify-center mb-2 shadow-inner">
                    {popupData.isLate ? <FaExclamationTriangle size={24} /> : <FaCheckCircle size={24} />}
                  </div>
                  <h2 className="text-xl font-extrabold">{popupData.greeting}</h2>
                  {popupData.isLate && <p className="text-yellow-200 font-bold text-xs mt-1">⚠️ ANDA TELAH LEWAT</p>}
                  <p className="text-xs opacity-80 mt-0.5">{popupData.action} at {popupData.time}</p>
                </div>

                {/* Profile Body */}
                <div className="p-6 flex flex-col sm:flex-row items-center gap-6">
                  {/* Student Portrait */}
                  <div className="w-28 h-36 rounded-2xl bg-gray-100 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 overflow-hidden flex items-center justify-center shadow-md flex-shrink-0">
                    {loadingAvatar ? (
                      <FaSpinner className="animate-spin text-gray-400" size={24} />
                    ) : avatarUrl ? (
                      <img src={avatarUrl} alt={popupData.name} className="w-full h-full object-cover" />
                    ) : (
                      <FaUserCircle className="text-gray-400" size={48} />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 space-y-2 text-center sm:text-left">
                    <p className="text-xs text-gray-400 font-semibold uppercase">{popupData.type}</p>
                    <h3 className="text-lg font-bold leading-tight">{popupData.name}</h3>
                    <p className="text-xs text-gray-500 font-mono">ID: {popupData.id}</p>
                    {popupData.class && (
                      <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 rounded-lg text-xs font-bold">
                        Class: {popupData.class}
                      </span>
                    )}
                  </div>
                </div>

                {/* 5-Second Countdown Bar */}
                <div className="h-1.5 bg-gray-100 dark:bg-gray-700 w-full overflow-hidden">
                  <motion.div
                    initial={{ width: "100%" }}
                    animate={{ width: "0%" }}
                    transition={{ duration: 5, ease: "linear" }}
                    className={`h-full ${popupData.isLate ? "bg-red-500" : "bg-emerald-500"}`}
                  />
                </div>

                <div className="p-4 bg-gray-50 dark:bg-gray-700/30 text-center">
                  <button
                    onClick={() => setShowPopup(false)}
                    className="w-full py-2.5 bg-gray-800 dark:bg-gray-600 text-white font-semibold text-xs rounded-xl"
                  >
                    Dismiss
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Camera Modal */}
        <AnimatePresence>
          {isScannerOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4"
            >
              <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl p-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-bold text-sm flex items-center gap-2">
                    <FaQrcode /> Camera Scanner
                  </h3>
                  <button onClick={stopCameraScanner} className="p-1 hover:bg-gray-100 rounded-lg">
                    <MdClose size={20} />
                  </button>
                </div>

                <div id="reader" className="w-full aspect-square rounded-xl overflow-hidden bg-black" />

                <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={keepScannerOpen}
                      onChange={(e) => setKeepScannerOpen(e.target.checked)}
                      className="rounded"
                    />
                    Continuous scanning mode
                  </label>
                  <button onClick={stopCameraScanner} className="text-blue-500 underline font-medium">
                    Close Camera
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}