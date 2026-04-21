"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { Locale } from "./config";
import {
  getMessages,
  format,
  type MessageKey,
  type Messages,
} from "./messages";

type Ctx = {
  locale: Locale;
  messages: Messages;
  t: (key: MessageKey, values?: Record<string, string>) => string;
};

const I18nContext = createContext<Ctx | null>(null);

export function I18nProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: ReactNode;
}) {
  const value = useMemo<Ctx>(() => {
    const messages = getMessages(locale);
    return {
      locale,
      messages,
      t: (key, values) => format(messages[key] ?? key, values),
    };
  }, [locale]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): Ctx {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside <I18nProvider>");
  return ctx;
}

export function useT(): Ctx["t"] {
  return useI18n().t;
}
