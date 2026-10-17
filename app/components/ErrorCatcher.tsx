"use client";
import { useEffect } from "react";

export default function ErrorCatcher() {
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      let email = "anonymous";
      try { 
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i) || "";
          if (k.startsWith("sb-") && k.endsWith("-auth-token")) {
            const raw = localStorage.getItem(k);
            if (raw) {
              const j = JSON.parse(raw);
              email = j?.user?.email || "anonymous";
              if (email !== "anonymous") break;
            }
          }
        }
      } catch(e){}
      
      fetch("/api/log-error", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          url: window.location.href,
          type: "frontend_crash",
          message: event.message,
          stack: event.error?.stack || "No stack",
          context: { filename: event.filename, lineno: event.lineno }
        })
      }).catch(() => {});
    };

    window.addEventListener("error", handleError);
    return () => window.removeEventListener("error", handleError);
  }, []);
  return null;
}