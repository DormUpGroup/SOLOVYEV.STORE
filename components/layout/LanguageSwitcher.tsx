"use client";

import { useEffect, useId, useRef, useState } from "react";
import { localeLabels, locales, type Locale } from "@/lib/i18n";
import { useI18n } from "@/components/providers/I18nProvider";

export function LanguageSwitcher() {
  const { locale, setLocale, isHydrated, dict } = useI18n();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const displayLocale = isHydrated ? locale : "en";

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const selectLocale = (code: Locale) => {
    setLocale(code);
    setOpen(false);
  };

  return (
    <div className="lang-switcher" ref={rootRef}>
      <button
        type="button"
        className="lang-switcher-trigger"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={dict.common.language}
      >
        <span>{localeLabels[displayLocale]}</span>
        <svg
          className={`lang-switcher-chevron ${open ? "open" : ""}`}
          viewBox="0 0 12 12"
          width="10"
          height="10"
          aria-hidden="true"
        >
          <path
            d="M2 4.5 6 8.5 10 4.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open ? (
        <ul
          id={listId}
          className="lang-switcher-menu"
          role="listbox"
          aria-label={dict.common.language}
        >
          {locales.map((code) => (
            <li key={code} role="option" aria-selected={displayLocale === code}>
              <button
                type="button"
                className={`lang-switcher-option ${displayLocale === code ? "active" : ""}`}
                onClick={() => selectLocale(code)}
              >
                {localeLabels[code]}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
