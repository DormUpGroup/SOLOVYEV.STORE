"use client";

import { useI18n } from "@/components/providers/I18nProvider";
import { useTheme, type SiteTheme } from "@/components/providers/ThemeProvider";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const { dict } = useI18n();
  const copy = dict.account;
  const isLight = theme === "light";

  const select = (next: SiteTheme) => {
    setTheme(next);
  };

  return (
    <div className="theme-toggle" role="group" aria-label={copy.theme}>
      <span className="theme-toggle-label">{copy.theme}</span>
      <button
        type="button"
        className={`theme-switch${isLight ? " theme-switch--light" : ""}`}
        role="switch"
        aria-checked={isLight}
        aria-label={`${copy.theme}: ${isLight ? copy.themeLight : copy.themeDark}`}
        onClick={() => select(isLight ? "dark" : "light")}
      >
        <span className="theme-switch-track" aria-hidden="true">
          <span className="theme-switch-option">{copy.themeDark}</span>
          <span className="theme-switch-option">{copy.themeLight}</span>
          <span className="theme-switch-thumb" />
        </span>
      </button>
    </div>
  );
}
