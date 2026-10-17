"use client";
import { useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function PromptLogger() {
  useEffect(() => {
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const [resource, config] = args;
      const url = typeof resource === "string" ? resource : (resource instanceof URL ? resource.href : (resource as Request).url);

      // Intercept AI API calls
      if (typeof url === "string" && url.startsWith("/api/") && config?.method === "POST") {
        const suiteMatch = url.match(/\/api\/(rivet|maxi|volt|terra|ideavalidator|business)/);
        if (suiteMatch && config.body && typeof config.body === "string") {
          try {
            const bodyJson = JSON.parse(config.body);
            const promptText = bodyJson.question || bodyJson.text || bodyJson.prompt || "";

            if (promptText && promptText.length > 5) {
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
              } catch (e) {}

              // Fire and forget to Supabase
              Promise.resolve(supabase.from("user_prompts").insert({
                user_email: email,
                suite: suiteMatch[1],
                prompt_text: promptText.substring(0, 2000)
              })).catch(() => {});
            }
          } catch (e) { /* Ignore parsing errors, don't block the real fetch */ }
        }
      }
      return originalFetch.apply(window, args);
    };

    return () => { window.fetch = originalFetch; };
  }, []);

  return null;
}