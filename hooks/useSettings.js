import { useState, useEffect } from "react";

export default function useSettings() {
  const [settings, setSettings] = useState({
    NAME: "SMJK Katholik Melaka",
    SCHOOL_CODE: "MEB2099",
    STUDENT_EHADIR_LATE_HOUR: 7,
    STUDENT_EHADIR_LATE_MINUTE: 20,
    STUDENT_EHADIR_MINIMUM_THRESHOLD: 15,
    STAFF_EHADIR_MINIMUM_THRESHOLD: 15,
    ERPH_FEATURE_ENABLED: true,
    LIBRARY_FEATURE_ENABLED: true,
    PREFECT_FEATURE_ENABLED: true,
  });

  useEffect(() => {
    fetch("/api/admin/getSettings.json")
      .then((res) => res.json())
      .then((json) => {
        if (json?.data) setSettings(json.data);
      })
      .catch((err) => console.warn("Using default settings:", err));
  }, []);

  return settings;
}