"use client";

import { useFavorites } from "@/components/providers/FavoritesProvider";
import { useI18n } from "@/components/providers/I18nProvider";

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      className="favorite-icon"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M12 20.5s-7.2-4.35-9.6-8.55C.6 9.1 1.35 5.7 4.35 4.35 6.45 3.4 8.85 4.05 10.2 5.7L12 7.8l1.8-2.1c1.35-1.65 3.75-2.3 5.85-1.35 3 1.35 3.75 4.75 1.95 7.6C19.2 16.15 12 20.5 12 20.5z"
        fill={filled ? "currentColor" : "none"}
      />
    </svg>
  );
}

interface FavoriteButtonProps {
  productId: number;
  variant?: "overlay" | "inline";
  className?: string;
  showLabel?: boolean;
}

export function FavoriteButton({
  productId,
  variant = "overlay",
  className = "",
  showLabel = false,
}: FavoriteButtonProps) {
  const { favoriteIds, toggleFavorite } = useFavorites();
  const { dict } = useI18n();
  const active = favoriteIds.has(productId);
  const label = active ? dict.product.removeFavorite : dict.product.addFavorite;

  return (
    <button
      type="button"
      className={`favorite-btn${variant === "inline" ? " favorite-btn--inline" : ""}${active ? " active" : ""}${className ? ` ${className}` : ""}`}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        void toggleFavorite(productId);
      }}
      aria-label={label}
      aria-pressed={active}
      title={label}
    >
      <HeartIcon filled={active} />
      {showLabel ? <span>{active ? "SAVED" : "SAVE"}</span> : null}
    </button>
  );
}
