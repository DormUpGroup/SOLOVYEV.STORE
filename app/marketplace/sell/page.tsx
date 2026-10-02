"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useI18n } from "@/components/providers/I18nProvider";
import {
  MARKETPLACE_BRANDS,
  MARKETPLACE_CATEGORIES,
  MARKETPLACE_CITIES,
  MARKETPLACE_CONDITIONS,
  MARKETPLACE_SHOE_SIZES,
  MARKETPLACE_SIZES,
  type MarketplaceCategory,
  type MarketplaceCondition,
} from "@/lib/marketplace/types";
import {
  canPublishListings,
  readSellerAccount,
} from "@/lib/marketplace/seller";
import {
  addMyListing,
  fileToDataUrl,
} from "@/lib/marketplace/my-listings";

interface Draft {
  photos: string[];
  brand: string;
  category: MarketplaceCategory | "";
  name: string;
  size: string;
  condition: MarketplaceCondition | "";
  description: string;
  price: string;
  city: string;
  fulfillment: "shipping" | "pickup" | "both" | "";
}

const emptyDraft: Draft = {
  photos: [],
  brand: "",
  category: "",
  name: "",
  size: "",
  condition: "",
  description: "",
  price: "",
  city: "",
  fulfillment: "",
};

export default function MarketplaceSellPage() {
  const { dict } = useI18n();
  const mp = dict.marketplace;
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const [publishing, setPublishing] = useState(false);
  const [publishedId, setPublishedId] = useState<string | null>(null);

  useEffect(() => {
    const check = () => setAllowed(canPublishListings(readSellerAccount()));
    check();
    window.addEventListener("mp-seller", check);
    return () => window.removeEventListener("mp-seller", check);
  }, []);

  const sizes = useMemo(() => {
    if (draft.category === "shoes") return [...MARKETPLACE_SHOE_SIZES];
    return [...MARKETPLACE_SIZES, "One Size", "30", "32"];
  }, [draft.category]);

  if (allowed === null) {
    return <div className="mp-container mp-empty">…</div>;
  }

  if (!allowed) {
    return (
      <div className="mp-container">
        <div className="mp-success" style={{ maxWidth: 480, margin: "0 auto" }}>
          <h1>{mp.sell.gateTitle}</h1>
          <p>{mp.sell.gateBody}</p>
          <Link
            href="/marketplace/become-seller"
            className="mp-btn mp-btn-primary"
          >
            {mp.sell.gateCta}
          </Link>
        </div>
      </div>
    );
  }

  const validateStep = (): boolean => {
    setError("");
    switch (step) {
      case 0:
        if (draft.photos.length < 1) {
          setError(mp.sell.required);
          return false;
        }
        break;
      case 1:
        if (!draft.brand) {
          setError(mp.sell.required);
          return false;
        }
        break;
      case 2:
        if (!draft.category) {
          setError(mp.sell.required);
          return false;
        }
        break;
      case 3:
        if (!draft.name.trim()) {
          setError(mp.sell.required);
          return false;
        }
        break;
      case 4:
        if (!draft.size) {
          setError(mp.sell.required);
          return false;
        }
        break;
      case 5:
        if (!draft.condition) {
          setError(mp.sell.required);
          return false;
        }
        break;
      case 6:
        if (!draft.description.trim()) {
          setError(mp.sell.required);
          return false;
        }
        break;
      case 7:
        if (!draft.price || Number(draft.price) <= 0) {
          setError(mp.sell.required);
          return false;
        }
        break;
      case 8:
        if (!draft.city) {
          setError(mp.sell.required);
          return false;
        }
        break;
      case 9:
        if (!draft.fulfillment) {
          setError(mp.sell.required);
          return false;
        }
        break;
    }
    return true;
  };

  const onNext = async () => {
    if (!validateStep()) return;
    if (step >= 9) {
      setPublishing(true);
      try {
        const seller = readSellerAccount();
        const saved = addMyListing({
          brand: draft.brand,
          name: draft.name.trim(),
          category: draft.category as MarketplaceCategory,
          size: draft.size,
          condition: draft.condition as MarketplaceCondition,
          color: "—",
          description: draft.description.trim(),
          price: Number(draft.price),
          city: draft.city || seller.city,
          images: draft.photos,
          status: "active",
          shipping:
            draft.fulfillment === "shipping" || draft.fulfillment === "both",
          pickup:
            draft.fulfillment === "pickup" || draft.fulfillment === "both",
        });
        setPublishedId(saved.id);
        setDone(true);
      } finally {
        setPublishing(false);
      }
      return;
    }
    setStep((s) => s + 1);
  };

  const onPhotos = async (files: FileList | null) => {
    if (!files?.length) return;
    const selected = Array.from(files).slice(0, 8 - draft.photos.length);
    const urls = await Promise.all(selected.map((f) => fileToDataUrl(f)));
    setDraft((d) => ({
      ...d,
      photos: [...d.photos, ...urls].slice(0, 8),
    }));
  };

  if (done) {
    return (
      <div className="mp-container mp-success-screen">
        <div className="mp-success mp-success-center">
          <h1>{mp.sell.successTitle}</h1>
          <p>{mp.sell.successBody}</p>
          <div className="mp-success-actions">
            {publishedId ? (
              <Link
                href={`/marketplace/item/${publishedId}`}
                className="mp-btn mp-btn-primary"
              >
                {mp.me.viewListing}
              </Link>
            ) : null}
            <Link href="/marketplace/me" className="mp-btn mp-btn-secondary">
              {mp.sell.viewMyListings}
            </Link>
            <button
              type="button"
              className="mp-btn mp-btn-ghost"
              onClick={() => {
                setDraft(emptyDraft);
                setStep(0);
                setDone(false);
                setPublishedId(null);
              }}
            >
              {mp.sell.sellAnother}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mp-container">
      <div className="mp-wizard">
        <div className="mp-wizard-progress" aria-hidden>
          {mp.sell.steps.map((_, i) => (
            <span key={i} className={i <= step ? "done" : ""} />
          ))}
        </div>

        <div className="mp-wizard-step">
          <h1>
            {mp.sell.title} · {step + 1}/10
          </h1>
          <p>{mp.sell.steps[step]}</p>

          {step === 0 && (
            <>
              <label className="mp-photo-drop">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => onPhotos(e.target.files)}
                />
                <span className="mp-photo-drop-title">{mp.sell.photoAdd}</span>
                <span className="mp-photo-drop-hint">{mp.sell.photoHint}</span>
              </label>
              {draft.photos.length > 0 ? (
                <div className="mp-photo-previews">
                  {draft.photos.map((src) => (
                    <div key={src}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt="" />
                    </div>
                  ))}
                </div>
              ) : null}
            </>
          )}

          {step === 1 && (
            <div className="mp-option-grid">
              {MARKETPLACE_BRANDS.map((brand) => (
                <button
                  key={brand}
                  type="button"
                  className={`mp-option${draft.brand === brand ? " selected" : ""}`}
                  onClick={() => setDraft((d) => ({ ...d, brand }))}
                >
                  {brand}
                </button>
              ))}
            </div>
          )}

          {step === 2 && (
            <div className="mp-option-grid">
              {MARKETPLACE_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`mp-option${draft.category === cat ? " selected" : ""}`}
                  onClick={() =>
                    setDraft((d) => ({ ...d, category: cat, size: "" }))
                  }
                >
                  {mp.categories[cat]}
                </button>
              ))}
            </div>
          )}

          {step === 3 && (
            <input
              className="mp-input"
              value={draft.name}
              onChange={(e) =>
                setDraft((d) => ({ ...d, name: e.target.value }))
              }
              placeholder={mp.sell.namePlaceholder}
            />
          )}

          {step === 4 && (
            <div className="mp-option-grid">
              {sizes.map((size) => (
                <button
                  key={size}
                  type="button"
                  className={`mp-option${draft.size === size ? " selected" : ""}`}
                  onClick={() => setDraft((d) => ({ ...d, size }))}
                >
                  {size}
                </button>
              ))}
            </div>
          )}

          {step === 5 && (
            <div className="mp-option-grid">
              {MARKETPLACE_CONDITIONS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`mp-option${draft.condition === c ? " selected" : ""}`}
                  onClick={() => setDraft((d) => ({ ...d, condition: c }))}
                >
                  {mp.conditions[c]}
                </button>
              ))}
            </div>
          )}

          {step === 6 && (
            <textarea
              className="mp-input"
              rows={6}
              value={draft.description}
              onChange={(e) =>
                setDraft((d) => ({ ...d, description: e.target.value }))
              }
              placeholder={mp.sell.descPlaceholder}
            />
          )}

          {step === 7 && (
            <input
              className="mp-input"
              type="number"
              inputMode="numeric"
              value={draft.price}
              onChange={(e) =>
                setDraft((d) => ({ ...d, price: e.target.value }))
              }
              placeholder={mp.sell.pricePlaceholder}
            />
          )}

          {step === 8 && (
            <div className="mp-option-grid">
              {MARKETPLACE_CITIES.map((city) => (
                <button
                  key={city}
                  type="button"
                  className={`mp-option${draft.city === city ? " selected" : ""}`}
                  onClick={() => setDraft((d) => ({ ...d, city }))}
                >
                  {city}
                </button>
              ))}
            </div>
          )}

          {step === 9 && (
            <div className="mp-option-grid">
              {(
                [
                  ["shipping", mp.sell.shipping],
                  ["pickup", mp.sell.pickup],
                  ["both", mp.sell.both],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  className={`mp-option${draft.fulfillment === key ? " selected" : ""}`}
                  onClick={() =>
                    setDraft((d) => ({ ...d, fulfillment: key }))
                  }
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          {error ? (
            <p style={{ color: "var(--mp-danger)", marginTop: "1rem" }}>
              {error}
            </p>
          ) : null}

          <div className="mp-wizard-nav">
            <button
              type="button"
              className="mp-btn mp-btn-secondary"
              disabled={step === 0}
              onClick={() => setStep((s) => Math.max(0, s - 1))}
            >
              {mp.sell.back}
            </button>
            <button
              type="button"
              className="mp-btn mp-btn-primary"
              style={{ flex: 1 }}
              onClick={onNext}
              disabled={publishing}
            >
              {publishing
                ? "…"
                : step >= 9
                  ? mp.sell.submit
                  : mp.sell.next}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
