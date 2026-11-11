import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/router";
import useSettings from "@/hooks/useSettings";

export default function useAuth(requiredPermission = null) {
  const [signedIn, setSignedIn] = useState(false);
  const [userDetails, setUserDetails] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [featuresReady, setFeaturesReady] = useState(false);
  
  const { LIBRARY_FEATURE_ENABLED = true, PREFECT_FEATURE_ENABLED = true } = useSettings() || {};
  const router = useRouter();
  const checkedRef = useRef(false);
  const redirectingRef = useRef(false);

  const redirectToLogin = useCallback(() => {
    if (requiredPermission && !redirectingRef.current) {
      redirectingRef.current = true;
      const redirect = encodeURIComponent(router.asPath);
      router.push(`/auth/login?redirect=${redirect}`);
    }
  }, [router, requiredPermission]);

  const hasPermission = useCallback((perm, user = userDetails) => {
    const roles = (user?.role || "").split(",");
    return roles.includes("Owner") || roles.includes("All") || roles.includes(perm);
  }, [userDetails]);

  const isFeatureDisabled = useCallback((perm) => {
    if (!featuresReady) return false;
    if (perm?.startsWith("Lib_") && !LIBRARY_FEATURE_ENABLED) return true;
    if (perm?.startsWith("Pengawas") && !PREFECT_FEATURE_ENABLED) return true;
    return false;
  }, [LIBRARY_FEATURE_ENABLED, PREFECT_FEATURE_ENABLED, featuresReady]);

  const isOwner = useCallback((user = userDetails) => {
    return (user?.role || "").split(",").includes("Owner");
  }, [userDetails]);

  const checkPermissions = useCallback((perm, user = userDetails) => {
    if (!perm || isOwner(user)) return true;
    if (Array.isArray(perm)) {
      if (perm.every((p) => isFeatureDisabled(p))) return false;
      const validPerms = perm.filter((p) => !isFeatureDisabled(p));
      return validPerms.length === 0 || validPerms.some((p) => hasPermission(p, user));
    }
    return !isFeatureDisabled(perm) && hasPermission(perm, user);
  }, [hasPermission, isFeatureDisabled, isOwner, userDetails]);

  useEffect(() => {
    if (LIBRARY_FEATURE_ENABLED !== undefined && PREFECT_FEATURE_ENABLED !== undefined) {
      setFeaturesReady(true);
    }
  }, [LIBRARY_FEATURE_ENABLED, PREFECT_FEATURE_ENABLED]);

  useEffect(() => {
    if (checkedRef.current) return;
    (async () => {
      try {
        const res = await fetch("/api/auth/validate", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        const data = await res.json();
        if (res.ok && data.valid) {
          setSignedIn(true);
          setUserDetails(data.user);
        } else if (requiredPermission) {
          const redirect = encodeURIComponent(router.asPath);
          router.push(`/auth/login?redirect=${redirect}`);
        }
      } catch (err) {
        setSignedIn(false);
        setUserDetails(null);
      } finally {
        setMounted(true);
        checkedRef.current = true;
      }
    })();
  }, [router, requiredPermission]);

  return {
    signedIn,
    userDetails,
    hasPermission,
    mounted: mounted && featuresReady,
    checkPermissions,
    isOwner,
  };
}