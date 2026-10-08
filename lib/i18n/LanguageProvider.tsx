"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { en, type Dict } from "./en";
import { kn } from "./kn";
import type { Language } from "@/types/database";

const DICTS: Record<Language, Dict> = { en, kn };
const STORAGE_KEY = "fb-lang";

interface LanguageContextValue {
  lang: Language;
  setLang: (lang: Language) => void;
  t: Dict;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>("en");

  // Restore the remembered language on mount (English default).
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "kn" || saved === "en") setLangState(saved);
    } catch {
      /* private mode / blocked storage — fall back to English */
    }
  }, []);

  // Keep <html lang> in sync so the Kannada font and screen readers apply.
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((next: Language) => {
    setLangState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: DICTS[lang] }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
