import { useState, useEffect, useMemo } from "react";
import useSWR from "swr";
import useSettings from "@/hooks/useSettings";

const fetcher = async (url) => {
  const res = await fetch(url);
  if (!res.ok) {
    const error = new Error("An error occurred while fetching the data.");
    error.info = await res.json().catch(() => ({}));
    error.status = res.status;
    throw error;
  }
  return res.json();
};

const swrConfig = {
  revalidateOnFocus: false,
  revalidateIfStale: false,
  revalidateOnReconnect: false,
  refreshInterval: 0,
};

export default function useDataHelper() {
  const { CLASS: classOrder = ["PB","1B","1H","1K","1M","1P","1U","2B","2H","2K","2M","2P","2U","3B","3H","3K","3M","3P","3U","4B","4H","4K","4M","4P","4U","5B","5H","5K","5M","5P","5U"] } = useSettings() || {};
  const [errorMsg, setErrorMsg] = useState(null);

  const { data: librarians, error: libErr } = useSWR("/api/library/getLibrarians", fetcher, swrConfig);
  const { data: students, error: studErr } = useSWR("/api/school/getStudents", fetcher, swrConfig);
  const { data: prefects, error: prefErr } = useSWR("/api/prefect/getPrefect", fetcher, swrConfig);
  const { data: users, error: userErr } = useSWR("/api/admin/getUsers", fetcher, swrConfig);
  const { data: staff, error: staffErr } = useSWR("/api/school/getStaff", fetcher, swrConfig);

  useEffect(() => {
    const err = libErr || studErr || prefErr || userErr || staffErr;
    if (err) {
      console.error("Error fetching data helper:", err);
      setErrorMsg("Error fetching data helper.");
    }
  }, [libErr, studErr, prefErr, userErr, staffErr]);

  const getStudentClass = (id, list = students || []) => {
    const found = list.find((s) => s.id === id);
    return found ? found.class : "";
  };

  const getStudentName = (id) => {
    const found = (students || []).find((s) => s.id === id);
    return found ? found.name : "";
  };

  const getStudentForm = (id) => {
    const cls = getStudentClass(id);
    if (cls === "PB") return 1;
    const formNum = parseInt(cls.charAt(0), 10);
    return cls && !isNaN(formNum) ? formNum : 3;
  };

  const getStaffGroup = (id) => {
    const found = (staff || []).find((s) => s.id === id);
    return found ? found.section : "";
  };

  const getStaffName = (id) => {
    const found = (staff || []).find((s) => s.id === id);
    return found ? found.name : "";
  };

  // Sort students & prefects based on school class order
  const sortedStudents = useMemo(() => {
    if (!students) return [];
    return [...students].sort((a, b) => {
      const idxA = classOrder.indexOf(a.class);
      const idxB = classOrder.indexOf(b.class);
      return idxA === idxB ? a.name.localeCompare(b.name) : idxA - idxB;
    });
  }, [students, classOrder]);

  const sortedLibrarians = useMemo(() => {
    if (!librarians) return [];
    return [...librarians].sort((a, b) => {
      const clsA = getStudentClass(a.id);
      const clsB = getStudentClass(b.id);
      const idxA = classOrder.indexOf(clsA);
      const idxB = classOrder.indexOf(clsB);
      return idxA === idxB ? a.name.localeCompare(b.name) : idxA - idxB;
    });
  }, [librarians, classOrder, students]);

  const sortedPrefects = useMemo(() => {
    if (!prefects) return [];
    return [...prefects].sort((a, b) => {
      const clsA = getStudentClass(a.id);
      const clsB = getStudentClass(b.id);
      const idxA = classOrder.indexOf(clsA);
      const idxB = classOrder.indexOf(clsB);
      return idxA === idxB ? a.name.localeCompare(b.name) : idxA - idxB;
    });
  }, [prefects, classOrder, students]);

  const sortedUsers = useMemo(() => {
    if (!users) return [];
    return [...users].sort((a, b) => a.username.localeCompare(b.username));
  }, [users]);

  const sortedStaff = useMemo(() => {
    if (!staff) return [];
    const sectionPriority = ["KBK", "AKP", "GURU"];
    return [...staff].sort((a, b) => {
      const secA = (a.section || "").toUpperCase();
      const secB = (b.section || "").toUpperCase();
      const idxA = sectionPriority.indexOf(secA);
      const idxB = sectionPriority.indexOf(secB);
      return idxA === idxB ? a.name.localeCompare(b.name) : idxA - idxB;
    });
  }, [staff]);

  return {
    studentsData: sortedStudents,
    librariansData: sortedLibrarians,
    prefectsData: sortedPrefects,
    clientsData: sortedUsers,
    staffsData: sortedStaff,
    getStudentClass,
    getStudentName,
    getStudentForm,
    getStaffGroup,
    getStaffName,
    error: errorMsg,
  };
}